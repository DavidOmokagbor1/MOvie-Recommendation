"""
Manual script to add authentication fields to existing database.
Run this if migrations are not working.
"""
from app import app, db
from app.model import User
import sqlite3

def add_auth_fields():
    """Add authentication fields to User table"""
    with app.app_context():
        conn = sqlite3.connect('app.db')
        cursor = conn.cursor()
        
        try:
            # Check if columns already exist
            cursor.execute("PRAGMA table_info(User)")
            columns = [row[1] for row in cursor.fetchall()]
            
            # Add username if it doesn't exist
            if 'username' not in columns:
                print("Adding username column...")
                cursor.execute("ALTER TABLE User ADD COLUMN username VARCHAR(80)")
            
            # Add email if it doesn't exist
            if 'email' not in columns:
                print("Adding email column...")
                cursor.execute("ALTER TABLE User ADD COLUMN email VARCHAR(120)")
            
            # Add password_hash if it doesn't exist
            if 'password_hash' not in columns:
                print("Adding password_hash column...")
                cursor.execute("ALTER TABLE User ADD COLUMN password_hash VARCHAR(255)")
            
            # Add created_at if it doesn't exist
            if 'created_at' not in columns:
                print("Adding created_at column...")
                cursor.execute("ALTER TABLE User ADD COLUMN created_at DATETIME")
            
            # Add is_active if it doesn't exist
            if 'is_active' not in columns:
                print("Adding is_active column...")
                cursor.execute("ALTER TABLE User ADD COLUMN is_active BOOLEAN DEFAULT 1")
            
            # Check Interaction table
            cursor.execute("PRAGMA table_info(Interaction)")
            interaction_columns = [row[1] for row in cursor.fetchall()]
            
            # Add interaction_type if it doesn't exist
            if 'interaction_type' not in interaction_columns:
                print("Adding interaction_type column to Interaction table...")
                cursor.execute("ALTER TABLE Interaction ADD COLUMN interaction_type VARCHAR(20) DEFAULT 'view'")
            
            # Add created_at to Interaction if it doesn't exist
            if 'created_at' not in interaction_columns:
                print("Adding created_at column to Interaction table...")
                cursor.execute("ALTER TABLE Interaction ADD COLUMN created_at DATETIME")
            
            conn.commit()
            print("✅ Successfully added authentication fields!")
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Error: {str(e)}")
        finally:
            conn.close()

if __name__ == '__main__':
    add_auth_fields()

