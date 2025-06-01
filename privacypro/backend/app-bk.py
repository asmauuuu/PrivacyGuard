from flask import Flask, request, jsonify, render_template, get_flashed_messages
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token
from flask_mail import Mail, Message
import os
import json
import random
import string
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from datetime import datetime



# Initialize Flask app
app = Flask(__name__)
app.secret_key = 'your-secret-key'  # Required for flash and session

# Configuration
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this!
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # Change to your SMTP server
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'your-email@gmail.com'  # Change to your email
app.config['MAIL_PASSWORD'] = 'your-app-password'  # Change to your app password
app.config['MAIL_DEFAULT_SENDER'] = 'your-email@gmail.com'  # Change to your email

# Enable CORS
# Updated CORS configuration
CORS(app, 
    origins=["http://localhost:5500"],  # Frontend origin
    supports_credentials=True,
    expose_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE"]
)


# Initialize extensions
jwt = JWTManager(app)
mail = Mail(app)

# File-based storage
USERS_FILE = 'users.json'
VERIFICATION_FILE = 'verification.json'

# Initialize empty files if they don't exist
if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, 'w') as f:
        json.dump([], f)

if not os.path.exists(VERIFICATION_FILE):
    with open(VERIFICATION_FILE, 'w') as f:
        json.dump({}, f)

# Helper functions
def load_users():
    try:
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def load_verification():
    try:
        with open(VERIFICATION_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def save_verification(verification_data):
    with open(VERIFICATION_FILE, 'w') as f:
        json.dump(verification_data, f, indent=2)

def send_verification_email(email, code):
    subject = 'Verify Your Email - Privacy Framework'
    body = f'''
    Thank you for registering with Privacy Framework!

    Your verification code is: {code}

    This code will expire in 30 minutes.

    If you did not register for an account, please ignore this email.
    '''

    msg = Message(subject=subject, recipients=[email], body=body)
    try:
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

# Routes
@app.route('/')
def index():
     return render_template('index.html')

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()

    # Extract user data
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    # Validate input
    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400

    # Load existing users
    users = load_users()

    # Check if user already exists
    for user in users:
        if user['email'] == email:
            return jsonify({'error': 'Email already registered'}), 400

    # Generate verification code
    verification_code = ''.join(random.choices(string.digits, k=6))

    # Create new user
    new_user = {
        'id': len(users) + 1,
        'username': name,
        'email': email,
        'password': password,  # In a real app, hash this password!
        'is_admin': False,
        'email_verified': False,
        'created_at': datetime.utcnow().isoformat()
    }

    # Add user to users list
    users.append(new_user)
    save_users(users)

    # Store verification data
    verification_data = load_verification()
    verification_data[email] = {
        'code': verification_code,
        'expires_at': (datetime.utcnow() + timedelta(minutes=30)).isoformat()
    }
    save_verification(verification_data)

    # Send verification email
    email_sent = send_verification_email(email, verification_code)

    if email_sent:
        return jsonify({
            'message': 'User registered successfully. Please check your email for verification.',
            'email': email
        }), 201
    else:
        return jsonify({
            'message': 'User registered, but there was an issue sending the verification email.',
            'email': email,
            'verification_code': verification_code  # Only for testing! Remove in production
        }), 201


# Dummy placeholders — replace with real implementations
def load_users():
    # Return a list of user dicts
    pass

def save_users(users):
    # Save updated users to storage
    pass

def load_verification():
    # Load verification data from storage
    pass

def save_verification(data):
    # Save updated verification data
    pass
@app.route('/login', methods=['GET', 'POST'])
def login_page():
    if request.method == 'GET':
        return render_template('login.html')  # Show login form

    email = request.form.get('email')
    password = request.form.get('password')

    if not email or not password:
        flash('Email and password are required', 'error')
        return redirect(url_for('login_page'))

    # Load users
    users = load_users()
    user = next((u for u in users if u['email'] == email), None)

    if not user or user['password'] != password:
        flash('Invalid email or password', 'error')
        return redirect(url_for('login_page'))

    if not user.get('email_verified', False):
        flash('Please verify your email before logging in', 'error')
        return redirect(url_for('login_page'))

    # Set session data
    session['user_id'] = user['id']
    session['username'] = user['username']

    flash('Login successful!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))

    return render_template('dashboard.html', username=session.get('username'))

@app.route('/api/verify-email', methods=['POST'])
def verify_email():
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')

    if not email or not code:
        return jsonify({'error': 'Email and verification code are required'}), 400

    verification_data = load_verification()

    if email not in verification_data:
        return jsonify({'error': 'No verification code found for this email'}), 404

    if verification_data[email]['code'] != code:
        return jsonify({'error': 'Invalid verification code'}), 400

    try:
        expires_at = datetime.fromisoformat(verification_data[email]['expires_at'])
        if expires_at < datetime.utcnow():
            return jsonify({'error': 'Verification code has expired'}), 400
    except Exception:
        return jsonify({'error': 'Invalid expiration format'}), 500

    # Mark email as verified
    users = load_users()
    for user in users:
        if user['email'] == email:
            user['email_verified'] = True
            save_users(users)
            break

    # Remove verification data
    del verification_data[email]
    save_verification(verification_data)

    return jsonify({'message': 'Email verified successfully'}), 200


@app.route('/api/resend-verification', methods=['POST'])
def resend_verification():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    # Load users
    users = load_users()

    # Check if user exists
    user_exists = False
    for user in users:
        if user['email'] == email:
            if user['email_verified']:
                return jsonify({'message': 'Email already verified'}), 200
            user_exists = True
            break

    if not user_exists:
        return jsonify({'error': 'User not found'}), 404

    # Generate new verification code
    verification_code = ''.join(random.choices(string.digits, k=6))

    # Update verification data
    verification_data = load_verification()
    verification_data[email] = {
        'code': verification_code,
        'expires_at': (datetime.utcnow() + timedelta(minutes=30)).isoformat()
    }
    save_verification(verification_data)

    # Send verification email
    email_sent = send_verification_email(email, verification_code)

    if email_sent:
        return jsonify({'message': 'Verification code sent'}), 200
    else:
        return jsonify({
            'message': 'There was an issue sending the verification email.',
            'verification_code': verification_code  # Only for testing! Remove in production
        }), 200

# Add permissions endpoints
@app.route('/api/permissions', methods=['GET'])
def get_permissions():
    # This is a placeholder - implement your actual permissions logic here
    return jsonify({
        'permissions': [
            {'id': 1, 'name': 'Location', 'description': 'Access to device location'},
            {'id': 2, 'name': 'Camera', 'description': 'Access to device camera'},
            {'id': 3, 'name': 'Microphone', 'description': 'Access to device microphone'},
        ]
    })

if __name__ == '__main__':
    app.run(debug=True)