# SingleFlow - Project & Task Management

A full-stack project and task management application for demonstrating and testing Pragmatic Drag and Drop - built with React, TypeScript, Express, and SQLite.

## Prerequisites

- Node.js 16+
- npm or yarn
- Python 3.8+ (optional, for demo data seeding)

## Features

- 🔐 User authentication with JWT
- 📁 Project management
- ✅ Task management with Kanban board
- 🏷️ Tag system for organizing tasks
- 📅 Calendar view for tasks with due dates
- 🎯 Drag-and-drop for projects and tasks
- 💾 Local SQLite database

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Backend Server

```bash
npm run dev:server
```

The backend API will be available at `http://localhost:3000`.

### 3. Start the Frontend (in a new terminal)

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

Alternatively, run both together:

```bash
npm run dev:all
```

### 4. Create Demo Data (Optional but required to run existing tests)

To populate the database with sample projects and tasks:

```bash
# Create a Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the seed script
python3 populate_db.py
```

This creates a demo account with the following credentials:
- **Email:** demo@example.com
- **Password:** password123

The script generates 3 sample projects with 9 tasks to explore the application's features.

### 5. Access the Application

Open `http://localhost:5173` in your browser and either:
- Sign in with the demo credentials (if you ran the seed script)
- Create a new account to get started


## Database

The application uses SQLite for local data persistence. The database file is automatically created at `server/database.sqlite` when you first run the backend server.

You can inspect the database using tools like [DB Browser for SQLite](https://sqlitebrowser.org/).

## Testing

This application is designed for testing [Pragmatic Drag and Drop](https://github.com/atlassian/pragmatic-drag-and-drop) features with interactive drag-and-drop scenarios:

- **Board** - Kanban board with task drag and drop across columns
- **Grid** - Priority grid with 2D dragging and positioning
- **Nested Draggables** - Nested project and task hierarchies
- **Calendar** - Calendar view with date-based task placement

### Running Tests Locally

To run tests with Playwright:

```bash
# Install test dependencies
npm install @skyramp/skyramp @playwright/test
npx playwright install

# Run a specific test
npx playwright test src/tests/ui/ui_test_<name>.spec.ts --headed
```

> **Note:** Tests require the demo data to be seeded. Run `python3 populate_db.py` before running tests.

Sample recorded traces are stored in `/traces` organized by test scenario.

## Development

### Build for Production

Build frontend:
```bash
npm run build
```

Build backend:
```bash
npm run build:server
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run typecheck
```

## Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Atlaskit Pragmatic Drag and Drop

**Backend:**
- Express.js
- SQLite (via better-sqlite3)
- JWT authentication
- bcryptjs for password hashing

## License

MIT

## Credits

Built for comprehensive testing and demonstration of [Pragmatic Drag and Drop](https://github.com/atlassian/pragmatic-drag-and-drop) by Atlassian.
