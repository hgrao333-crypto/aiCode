"""
Create or promote a user to admin.

Usage:
    ./venv/bin/python3 create_admin.py admin@logos.dev yourpassword

If the email already exists the password is updated and is_admin is set.
"""
import sys
from database import SessionLocal, engine, Base
import models
from auth import hash_password

Base.metadata.create_all(bind=engine)


def create_admin(email: str, password: str):
    db = SessionLocal()
    try:
        user = db.query(models.User).filter_by(email=email).first()
        if user:
            user.hashed_password = hash_password(password)
            user.is_admin = True
            print(f"Updated existing user {email!r} → admin=True")
        else:
            user = models.User(
                email=email,
                hashed_password=hash_password(password),
                is_admin=True,
            )
            db.add(user)
            print(f"Created admin user {email!r}")
        db.commit()
        print("Done. Login at http://localhost:3000/auth/login")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 create_admin.py <email> <password>")
        sys.exit(1)
    create_admin(sys.argv[1], sys.argv[2])
