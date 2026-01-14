const db = require('../config/database');

const Subtask = {
  // Create a new subtask
  create: async (taskId, title, position = 0) => {
    const result = await db.query(
      `INSERT INTO subtasks (task_id, title, position) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [taskId, title, position]
    );
    return result.rows[0];
  },

  // Get all subtasks for a task
  findByTaskId: async (taskId) => {
    const result = await db.query(
      `SELECT * FROM subtasks 
       WHERE task_id = $1 
       ORDER BY position ASC, subtask_id ASC`,
      [taskId]
    );
    return result.rows;
  },

  // Get single subtask by ID
  findById: async (subtaskId) => {
    const result = await db.query(
      `SELECT * FROM subtasks WHERE subtask_id = $1`,
      [subtaskId]
    );
    return result.rows[0];
  },

  // Toggle subtask completion
  toggleComplete: async (subtaskId) => {
    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      throw new Error('Subtask not found');
    }

    const newCompleted = !subtask.completed;
    const completedAt = newCompleted ? new Date() : null;

    const result = await db.query(
      `UPDATE subtasks 
       SET completed = $1, completed_at = $2 
       WHERE subtask_id = $3 
       RETURNING *`,
      [newCompleted, completedAt, subtaskId]
    );
    return result.rows[0];
  },

  // Update subtask title
  update: async (subtaskId, title) => {
    const result = await db.query(
      `UPDATE subtasks 
       SET title = $1 
       WHERE subtask_id = $2 
       RETURNING *`,
      [title, subtaskId]
    );
    return result.rows[0];
  },

  // Delete subtask
  delete: async (subtaskId) => {
    const result = await db.query(
      `DELETE FROM subtasks WHERE subtask_id = $1 RETURNING *`,
      [subtaskId]
    );
    return result.rows[0];
  },

  // Update subtask positions (for reordering)
  updatePositions: async (updates) => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      for (const { subtaskId, position } of updates) {
        await client.query(
          `UPDATE subtasks SET position = $1 WHERE subtask_id = $2`,
          [position, subtaskId]
        );
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get subtask count and completion stats for a task
  getStats: async (taskId) => {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_count
       FROM subtasks 
       WHERE task_id = $1`,
      [taskId]
    );
    return result.rows[0];
  }
};

module.exports = Subtask;
