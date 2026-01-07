# PostgreSQL Database Setup Instructions

## Prerequisites
- PostgreSQL Server installed on your system
- PostgreSQL running on localhost (default port 5432)

## Setup Steps

### 1. Install PostgreSQL (if not already installed)
- **Windows**: Download from https://www.postgresql.org/download/windows/
- **Mac**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

### 2. Start PostgreSQL Server
```bash
# Windows: PostgreSQL should start automatically as a service
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### 3. Configure Environment Variables (IMPORTANT - Do this first!)
Update the `.env` file with your PostgreSQL credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgresql_password
DB_NAME=task_manager
```

### 4. Run the Setup Script (Easiest Method)
```bash
node database/setup.js
```

This will automatically create the database and all tables.

**Alternative: Use PostgreSQL Command Line**
```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE task_manager;

# Connect to database
\c task_manager

# Run the schema file
\i database/schema.sql

# Or from command line directly:
psql -U postgres -f database/schema.sql
```

### 5. Test Connection
Run the server to test the database connection:
```bash
npm start
```

You should see "Database connected successfully" in the console.

## Database Schema

### Users Table
- `user_id`: Serial primary key (auto-increment)
- `username`: Unique username
- `email`: Unique email
- `password`: Hashed password
- `created_at`, `updated_at`: Timestamps (auto-managed by triggers)

### Tasks Table
- `task_id`: Serial primary key
- `user_id`: Foreign key to users
- `title`: Task title
- `details`: Task description
- `repeat_timeline`: daily, weekly, monthly, yearly (CHECK constraint)
- `due_within_days`: Number of days to complete
- `times_completed`: Total completions
- `total_completion_time`: Sum of completion times
- `average_completion_time`: Average time to complete
- `last_completed_at`: Last completion timestamp
- `next_due_date`: When task is next due
- `is_active`: Active/inactive status

### Task Completions Table
- `completion_id`: Serial primary key
- `task_id`: Foreign key to tasks
- `user_id`: Foreign key to users
- `completed_at`: Completion timestamp
- `completion_time_minutes`: How long it took
- `was_on_time`: Whether completed before due date
- `days_from_due`: Days early/late
- `notes`: Optional completion notes

### Task Statistics View
- Aggregated statistics per task
- Calculates on-time percentage
- Shows completion trends

## Troubleshooting

### Connection Errors
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env` file
- Ensure database exists: `psql -U postgres -l`

### Permission Issues
- Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE task_manager TO postgres;`
- Or create a new user:
  ```sql
  CREATE USER taskuser WITH PASSWORD 'password';
  GRANT ALL PRIVILEGES ON DATABASE task_manager TO taskuser;
  ```

### Port Already in Use
- Check if PostgreSQL is running: `sudo systemctl status postgresql`
- Check port: `sudo netstat -plnt | grep 5432`

## PostgreSQL vs MySQL Differences
- Uses `SERIAL` instead of `AUTO_INCREMENT`
- Uses `$1, $2` parameterized queries instead of `?`
- Uses `VARCHAR(n)` with CHECK constraint instead of ENUM
- Triggers use functions (PL/pgSQL)
- Better handling of DECIMAL division in views
