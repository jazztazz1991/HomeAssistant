const db = require('../config/database');

async function createSubtasksTable() {
  const createTableQuery = `
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
    await db.query(createTableQuery);
    console.log('✓ Subtasks table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating subtasks table:', error);
    process.exit(1);
  }
}

createSubtasksTable();
