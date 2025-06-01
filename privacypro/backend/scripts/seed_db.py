import sys
import os
import random
from datetime import datetime, timedelta

# Add the parent directory to the path so we can import our app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app, db
from backend.models import User, AppPermission

# Sample data
app_names = [
    "Camera", "Phone", "Messages", "Maps", "Calendar", 
    "Weather", "Photos", "Contacts", "Browser", "Music"
]

permission_types = [
    "Camera", "Microphone", "Location", "Contacts", 
    "Storage", "Notifications", "Calendar", "Phone"
]

risk_levels = ["low", "medium", "high"]

def create_sample_users():
    """Create sample users if they don't exist"""
    if User.query.count() == 0:
        print("Creating sample users...")
        users = [
            User(
                username="user1",
                email="user1@example.com",
                password_hash=User.hash_password("password123")
            ),
            User(
                username="user2",
                email="user2@example.com",
                password_hash=User.hash_password("password123")
            ),
            User(
                username="admin",
                email="admin@example.com",
                password_hash=User.hash_password("admin123"),
                is_admin=True
            )
        ]
        
        db.session.add_all(users)
        db.session.commit()
        print(f"Created {len(users)} sample users")
    else:
        print("Users already exist, skipping user creation")

def create_sample_permissions():
    """Create sample app permissions for each user"""
    users = User.query.all()
    
    if AppPermission.query.count() > 0:
        print("Permissions already exist. Skipping permission creation.")
        return
        
    print("Creating sample permissions...")
    permissions = []
    
    for user in users:
        # Give each user 15-25 random permissions
        num_permissions = random.randint(15, 25)
        
        for _ in range(num_permissions):
            app_name = random.choice(app_names)
            permission_type = random.choice(permission_types)
            is_enabled = random.choice([True, False])
            risk_level = random.choice(risk_levels)
            
            # Generate a random last_accessed time within the past 30 days
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            
            last_accessed = None
            if is_enabled:
                last_accessed = datetime.utcnow() - timedelta(
                    days=days_ago, 
                    hours=hours_ago,
                    minutes=minutes_ago
                )
            
            permission = AppPermission(
                user_id=user.id,
                app_name=app_name,
                permission_type=permission_type,
                is_enabled=is_enabled,
                risk_level=risk_level,
                last_accessed=last_accessed
            )
            permissions.append(permission)
    
    db.session.add_all(permissions)
    db.session.commit()
    print(f"Created {len(permissions)} sample permissions")

def main():
    """Main function to seed the database"""
    with app.app_context():
        print("Starting database seeding...")
        
        # Create tables if they don't exist
        db.create_all()
        
        # Create sample data
        create_sample_users()
        create_sample_permissions()
        
        print("Database seeding completed!")

if __name__ == "__main__":
    main()