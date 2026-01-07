-- Create Database (run this separately if needed)
-- CREATE DATABASE task_manager;

-- Connect to database
\c task_manager;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  task_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  details TEXT,
  category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('household', 'work', 'health', 'personal', 'finance', 'education', 'social', 'general')),
  repeat_timeline VARCHAR(20) NOT NULL CHECK (repeat_timeline IN ('daily', 'weekly', 'monthly', 'yearly')),
  due_within_days INTEGER NOT NULL DEFAULT 1,
  times_completed INTEGER DEFAULT 0,
  total_completion_time INTEGER DEFAULT 0,
  average_completion_time DECIMAL(10, 2) DEFAULT 0,
  last_completed_at TIMESTAMP NULL,
  next_due_date TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_next_due_date ON tasks(next_due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_is_active ON tasks(is_active);

-- Trigger for tasks table
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Task Completion History Table
CREATE TABLE IF NOT EXISTS task_completions (
  completion_id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completion_time_minutes INTEGER,
  was_on_time BOOLEAN DEFAULT TRUE,
  days_from_due INTEGER DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Indexes for task_completions
CREATE INDEX IF NOT EXISTS idx_completions_task_id ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_completions_completed_at ON task_completions(completed_at);

-- Task Statistics View
CREATE OR REPLACE VIEW task_statistics AS
SELECT 
  t.task_id,
  t.user_id,
  t.title,
  t.times_completed,
  t.average_completion_time,
  t.last_completed_at,
  t.next_due_date,
  COUNT(tc.completion_id) as total_completions,
  AVG(tc.completion_time_minutes) as avg_completion_minutes,
  SUM(CASE WHEN tc.was_on_time = TRUE THEN 1 ELSE 0 END) as on_time_completions,
  SUM(CASE WHEN tc.was_on_time = FALSE THEN 1 ELSE 0 END) as late_completions,
  CASE 
    WHEN COUNT(tc.completion_id) > 0 
    THEN (SUM(CASE WHEN tc.was_on_time = TRUE THEN 1 ELSE 0 END)::DECIMAL / COUNT(tc.completion_id) * 100)
    ELSE 0
  END as on_time_percentage
FROM tasks t
LEFT JOIN task_completions tc ON t.task_id = tc.task_id
GROUP BY t.task_id;
