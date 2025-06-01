from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import random
import string

# Create a SQLAlchemy instance
db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Email verification fields
    email_verified = db.Column(db.Boolean, default=False)
    verification_code = db.Column(db.String(6), nullable=True)
    verification_code_expires = db.Column(db.DateTime, nullable=True)

    def __init__(self, username, email, password, **kwargs):
        super().__init__(username=username, email=email, **kwargs)
        self.set_password(password)
        self.generate_verification_code()

    def set_password(self, password: str):
        """Hash and store the password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify a stored password against one provided by user"""
        return check_password_hash(self.password_hash, password)

    @staticmethod
    def hash_password(password: str) -> str:
        return generate_password_hash(password)

    def generate_verification_code(self, expiry_minutes: int = 10):
        """Generate a random 6-digit code and set expiry"""
        code = ''.join(random.choices(string.digits, k=6))
        self.verification_code = code
        self.verification_code_expires = datetime.utcnow() + timedelta(minutes=expiry_minutes)
        return code

    def verify_code(self, code: str) -> bool:
        """Check if provided code matches and is not expired"""
        if (self.verification_code == code and
            self.verification_code_expires and
            datetime.utcnow() <= self.verification_code_expires):
            self.email_verified = True
            # Invalidate code
            self.verification_code = None
            self.verification_code_expires = None
            return True
        return False

    def to_dict(self) -> dict:
        """Convert user object to dictionary (for JSON responses)"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'verified': self.verified,
            'email_verified': self.email_verified,
            'created_at': self.created_at.isoformat()
        }

class AppPermission(db.Model):
    __tablename__ = 'app_permissions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    app_name = db.Column(db.String(100), nullable=False)
    permission_type = db.Column(db.String(50), nullable=False)
    is_enabled = db.Column(db.Boolean, default=True)
    last_accessed = db.Column(db.DateTime, nullable=True)
    risk_level = db.Column(db.String(20), nullable=True)  # low, medium, high

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'app_name': self.app_name,
            'permission_type': self.permission_type,
            'is_enabled': self.is_enabled,
            'last_accessed': self.last_accessed.isoformat() if self.last_accessed else None,
            'risk_level': self.risk_level
        }
