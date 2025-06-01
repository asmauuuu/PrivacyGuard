from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
from ..models import db, User  # Correct relative import
import re

# Create a Blueprint for authentication routes
auth_bp = Blueprint('auth', __name__)

# Email validation regex pattern
EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    # Get JSON data from request
    data = request.get_json()
    
    # Check if required fields are present
    if not all(k in data for k in ['name', 'email', 'password']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Validate email format
    if not EMAIL_PATTERN.match(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate password length
    if len(data['password']) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long'}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 409
    
    # Create new user
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    new_user = User(
        name=data['name'],
        email=data['email'],
        password=hashed_password,
        verified=True  # For simplicity; in production, implement email verification
    )
    
    # Save user to database
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Log in a user"""
    # Get JSON data from request
    data = request.get_json()
    
    # Check if required fields are present
    if not all(k in data for k in ['email', 'password']):
        return jsonify({'error': 'Missing email or password'}), 400
    
    # Find user by email
    user = User.query.filter_by(email=data['email']).first()
    
    # Check if user exists and password is correct
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Check if user is verified (in production)
    if not user.verified:
        return jsonify({'error': 'Please verify your email first'}), 401
    

    # Create access token
    access_token = create_access_token(
    identity=str(user.id),  # force string
    expires_delta=timedelta(hours=24),
)

    # Return token and user data
    return jsonify({
        'token': access_token,
        'user': user.to_dict()
    })

@auth_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user():
    """Get current user information (requires authentication)"""
    # Get user ID from JWT token
    current_user_id = get_jwt_identity()
    
    # Convert string ID back to integer if needed
    user_id = int(current_user_id) if current_user_id else None
    
    # Find user in database
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Return user data
    return jsonify(user.to_dict())