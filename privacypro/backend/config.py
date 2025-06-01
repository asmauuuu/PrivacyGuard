import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Secret key for signing cookies and other security features
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-secret-key')
    
    # Database connection string
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI', 'sqlite:///privacy_framework.db')
    
    # Disable SQLAlchemy modification tracking for better performance
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Secret key for JWT tokens
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret')  # Use separate env var

    # Email configuration
    MAIL_SERVER = 'smtp.gmail.com'  # Change to your SMTP server
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'your-email@gmail.com'  # Change to your email
    MAIL_PASSWORD = 'your-app-password'  # Change to your app password
    MAIL_DEFAULT_SENDER = 'your-email@gmail.com'  # Change to your email