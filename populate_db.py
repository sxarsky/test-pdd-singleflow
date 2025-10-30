#!/usr/bin/env python3
"""
Script to populate the SingleFlow SQLite database with sample data.
Creates a user account and populates it with 3 projects, each with 3 tasks.
"""

import sqlite3
import bcrypt
import uuid
from datetime import datetime, timedelta

# Configuration
DB_PATH = "server/database.sqlite"
USER_EMAIL = "demo@example.com"
USER_PASSWORD = "password123"
USER_USERNAME = "Demo User"

def generate_id():
    """Generate a UUID string"""
    return str(uuid.uuid4())

def hash_password(password):
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_user(conn):
    """Create a user account"""
    user_id = generate_id()
    password_hash = hash_password(USER_PASSWORD)
    now = datetime.now().isoformat()

    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO profiles (id, email, username, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, USER_EMAIL, USER_USERNAME, password_hash, now, now))

    print(f"✓ Created user: {USER_EMAIL}")
    print(f"  Username: {USER_USERNAME}")
    print(f"  Password: {USER_PASSWORD}")
    print(f"  User ID: {user_id}")

    return user_id

def create_projects(conn, user_id):
    """Create 3 projects"""
    projects = [
        {
            "name": "Website Redesign",
            "description": "Complete overhaul of the company website with modern design and improved UX",
            "status": "active"
        },
        {
            "name": "Mobile App Development",
            "description": "Build a native mobile application for iOS and Android platforms",
            "status": "active"
        },
        {
            "name": "Marketing Campaign Q4",
            "description": "Plan and execute marketing campaigns for the fourth quarter",
            "status": "active"
        }
    ]

    cursor = conn.cursor()
    project_ids = []
    now = datetime.now().isoformat()

    for idx, project in enumerate(projects):
        project_id = generate_id()
        cursor.execute("""
            INSERT INTO projects (id, name, description, owner_id, status, display_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (project_id, project["name"], project["description"], user_id,
              project["status"], idx, now, now))

        project_ids.append(project_id)
        print(f"✓ Created project: {project['name']}")

    return project_ids

def create_tasks(conn, project_ids, user_id):
    """Create 3 tasks for each project"""
    tasks_data = {
        "Website Redesign": [
            {
                "title": "Design homepage mockups",
                "description": "Create wireframes and high-fidelity mockups for the new homepage",
                "status": "done",
                "priority": "high",
                "due_date": (datetime.now() - timedelta(days=5)).isoformat()
            },
            {
                "title": "Implement responsive navigation",
                "description": "Build a mobile-first navigation component with hamburger menu",
                "status": "in_progress",
                "priority": "high",
                "due_date": (datetime.now() + timedelta(days=3)).isoformat()
            },
            {
                "title": "Set up analytics tracking",
                "description": "Integrate Google Analytics and set up event tracking",
                "status": "open",
                "priority": "medium",
                "due_date": (datetime.now() + timedelta(days=10)).isoformat()
            }
        ],
        "Mobile App Development": [
            {
                "title": "Set up React Native project",
                "description": "Initialize project with TypeScript and configure build tools",
                "status": "done",
                "priority": "urgent",
                "due_date": (datetime.now() - timedelta(days=15)).isoformat()
            },
            {
                "title": "Design authentication flow",
                "description": "Create login, signup, and password reset screens",
                "status": "review",
                "priority": "high",
                "due_date": (datetime.now() + timedelta(days=1)).isoformat()
            },
            {
                "title": "Implement push notifications",
                "description": "Set up Firebase Cloud Messaging for push notifications",
                "status": "blocked",
                "priority": "medium",
                "due_date": (datetime.now() + timedelta(days=7)).isoformat()
            }
        ],
        "Marketing Campaign Q4": [
            {
                "title": "Research target audience",
                "description": "Conduct market research and create buyer personas",
                "status": "done",
                "priority": "high",
                "due_date": (datetime.now() - timedelta(days=20)).isoformat()
            },
            {
                "title": "Create social media content calendar",
                "description": "Plan content for Instagram, Twitter, and LinkedIn for Q4",
                "status": "in_progress",
                "priority": "medium",
                "due_date": (datetime.now() + timedelta(days=5)).isoformat()
            },
            {
                "title": "Design email templates",
                "description": "Create responsive email templates for newsletter campaigns",
                "status": "open",
                "priority": "low",
                "due_date": (datetime.now() + timedelta(days=14)).isoformat()
            }
        ]
    }

    cursor = conn.cursor()
    now = datetime.now().isoformat()
    task_count = 0

    # Map project names to IDs
    project_name_to_id = {}
    cursor.execute("SELECT id, name FROM projects WHERE owner_id = ?", (user_id,))
    for project_id, name in cursor.fetchall():
        project_name_to_id[name] = project_id

    for project_name, tasks in tasks_data.items():
        project_id = project_name_to_id.get(project_name)
        if not project_id:
            continue

        for idx, task in enumerate(tasks):
            task_id = generate_id()
            cursor.execute("""
                INSERT INTO tasks (
                    id, project_id, title, description, status, priority,
                    assignee_id, reporter_id, due_date, display_order,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                task_id, project_id, task["title"], task["description"],
                task["status"], task["priority"], user_id, user_id,
                task["due_date"], idx, now, now
            ))
            task_count += 1

    print(f"✓ Created {task_count} tasks across all projects")

def main():
    """Main function to populate the database"""
    print("=" * 60)
    print("SingleFlow Database Population Script")
    print("=" * 60)
    print()

    # Connect to database
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute("PRAGMA foreign_keys = ON")
        print(f"✓ Connected to database: {DB_PATH}")
        print()
    except sqlite3.Error as e:
        print(f"✗ Error connecting to database: {e}")
        return

    try:
        # Check if user already exists
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM profiles WHERE email = ?", (USER_EMAIL,))
        existing_user = cursor.fetchone()

        if existing_user:
            print(f"⚠ User {USER_EMAIL} already exists. Deleting and recreating...")
            cursor.execute("DELETE FROM profiles WHERE email = ?", (USER_EMAIL,))
            conn.commit()
            print()

        # Create user
        user_id = create_user(conn)
        print()

        # Create projects
        project_ids = create_projects(conn, user_id)
        print()

        # Create tasks
        create_tasks(conn, project_ids, user_id)
        print()

        # Commit all changes
        conn.commit()
        print("=" * 60)
        print("✓ Database populated successfully!")
        print("=" * 60)
        print()
        print("You can now log in with:")
        print(f"  Email: {USER_EMAIL}")
        print(f"  Password: {USER_PASSWORD}")

    except sqlite3.Error as e:
        print(f"✗ Database error: {e}")
        conn.rollback()
    except Exception as e:
        print(f"✗ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
