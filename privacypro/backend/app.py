from flask import Flask, request, render_template, jsonify, url_for, redirect
import json
from datetime import datetime

app = Flask(__name__)

USERS_FILE = "./static/users.json" 
VERIFICATION_FILE = './static/verification.json'

MESSAGES = [
    {
        "id": 101,
        "title": "Privacy Breach in Default Camera App",
        "content": "A recent privacy concern was reported about the default camera app collecting location data without user consent. This has raised discussions about enforcing stricter permission models."
    },
    {
        "id": 102,
        "title": "Background Data Access Detected",
        "content": "The default email app has been observed accessing data in the background. This access occurs even when the app is not in active use, raising concerns over transparency."
    }
]

# ✅ Redirect '/' to login page
@app.route('/')
def home_redirect():
    return redirect(url_for('login_page'))

@app.route('/index', methods=['GET'])
def landing_page():
    if request.method == 'GET':
        return render_template('index.html')

@app.route('/login', methods=['GET'])
def login_page():
    if request.method == 'GET':
        return render_template('login.html')

@app.route('/sign-up', methods=['GET'])
def sign_up_page():
    if request.method == 'GET':
        return render_template('signup.html')

@app.route("/submit", methods=["POST"])
def submit():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    print(email)

    with open(USERS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    auth_email = data[0]["email"]

    found = False
    for user in data:
        if user["email"] == auth_email:
            found = True
            break

    return jsonify({'email': f'{email}'}, {'password': f'{password}'})

@app.route("/sign-up", methods=["POST"])
def sign_up():
    data = request.get_json()
    full_name = data.get("full_name")
    signup_email = data.get("signup_email")
    signup_pwd = data.get("signup_pwd")
    confirm_pwd = data.get("confirm_pwd")

    with open(USERS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    new_user = {
        'id': len(data) + 1,
        'username': full_name,
        'email': signup_email,
        'password': signup_pwd, 
        'is_admin': False,
        'email_verified': False,
        'created_at': datetime.now().isoformat()
    }

    data.append(new_user)

    with open(USERS_FILE, "w") as file:
        json.dump(data, file, indent=4)

    return jsonify({'message': 'User registered successfully.', 'email': signup_email})

@app.route('/dashboard', methods=['GET'])
def dashboard_page():
    if request.method == 'GET':
        return render_template('dashboard.html')

@app.route('/detail/<int:msg_id>')
def detail(msg_id):
    message = next((m for m in MESSAGES if m['id'] == msg_id), None)
    if not message:
        return "Message not found", 404
    return render_template('detail.html', message=message)

if __name__ == '__main__':
    app.run(debug=True)
