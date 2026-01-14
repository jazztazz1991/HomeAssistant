const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize database connection
const db = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const subtaskRoutes = require('./routes/subtasks');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Task Manager API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/subtasks', subtaskRoutes);

// Create subtasks table if it doesn't exist
const createSubtasksTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS subtasks (
      subtask_id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      position INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      CONSTRAINT fk_task
        FOREIGN KEY (task_id) 
        REFERENCES tasks(task_id) 
        ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_subtask_task_id ON subtasks(task_id);
    CREATE INDEX IF NOT EXISTS idx_subtask_position ON subtasks(position);
  `;
  try {
    await db.query(query);
    console.log('Subtasks table ready');
  } catch (error) {
    console.error('Error creating subtasks table:', error.message);
  }
};

createSubtasksTable();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
