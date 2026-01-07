const db = require('../config/database');

class Task {
  // Create a new task
  static async create(userId, taskData) {
    const { title, details, category, repeat_timeline, due_within_days, next_due_date } = taskData;
    console.log('Task.create received:', { userId, title, details, category, repeat_timeline, due_within_days, next_due_date });
    
    // Set next_due_date to provided date or now - task is immediately available
    const nextDueDate = next_due_date ? new Date(next_due_date) : new Date();
    
    const categoryValue = category || 'general';
    console.log('Inserting with category:', categoryValue);
    
    const result = await db.query(
      `INSERT INTO tasks (user_id, title, details, category, repeat_timeline, due_within_days, next_due_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING task_id`,
      [userId, title, details, categoryValue, repeat_timeline, due_within_days, nextDueDate]
    );
    return result.rows[0].task_id;
  }

  // Get all tasks for a user
  static async findByUserId(userId, includeInactive = false) {
    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [userId];
    
    if (!includeInactive) {
      query += ' AND is_active = TRUE';
    }
    query += ' ORDER BY next_due_date ASC';
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Get task by ID
  static async findById(taskId) {
    const result = await db.query(
      'SELECT * FROM tasks WHERE task_id = $1',
      [taskId]
    );
    return result.rows[0];
  }

  // Get tasks that are due (next_due_date is in the past or today)
  static async getDueTasks(userId) {
    const result = await db.query(
      `SELECT * FROM tasks 
       WHERE user_id = $1 
       AND is_active = TRUE 
       AND next_due_date <= NOW()
       ORDER BY next_due_date ASC`,
      [userId]
    );
    return result.rows;
  }

  // Get task with urgency color coding
  static async getTasksWithUrgency(userId) {
    const result = await db.query(
      `SELECT *,
        EXTRACT(EPOCH FROM ((next_due_date + (due_within_days || ' days')::INTERVAL) - NOW())) / 3600 as hours_until_deadline,
        (due_within_days * 24) as total_hours_available,
        CASE
          WHEN (next_due_date + (due_within_days || ' days')::INTERVAL) <= NOW() THEN 'overdue'
          WHEN EXTRACT(EPOCH FROM ((next_due_date + (due_within_days || ' days')::INTERVAL) - NOW())) / 3600 <= (due_within_days * 24 * 0.25) THEN 'red'
          WHEN EXTRACT(EPOCH FROM ((next_due_date + (due_within_days || ' days')::INTERVAL) - NOW())) / 3600 <= (due_within_days * 24 * 0.5) THEN 'yellow'
          ELSE 'green'
        END as urgency_color
      FROM tasks
      WHERE user_id = $1 AND is_active = TRUE
      ORDER BY next_due_date ASC`,
      [userId]
    );
    return result.rows;
  }

  // Mark task as complete
  static async complete(taskId, userId, completionTimeMinutes = null, notes = null) {
    const task = await this.findById(taskId);
    if (!task) return false;

    // Calculate the actual deadline (start date + due_within_days)
    const startDate = new Date(task.next_due_date);
    const deadline = new Date(startDate.getTime() + (task.due_within_days * 24 * 60 * 60 * 1000));
    const now = new Date();
    
    // Task is on time if completed before the deadline
    const wasOnTime = now <= deadline;
    const daysFromDue = Math.floor((now - deadline) / (1000 * 60 * 60 * 24));

    // Record completion in history
    await db.query(
      `INSERT INTO task_completions 
       (task_id, user_id, completion_time_minutes, was_on_time, days_from_due, notes) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [taskId, userId, completionTimeMinutes, wasOnTime, daysFromDue, notes]
    );

    // Update task statistics
    const newTimesCompleted = task.times_completed + 1;
    let newTotalTime = task.total_completion_time;
    let newAvgTime = task.average_completion_time;

    if (completionTimeMinutes) {
      newTotalTime += completionTimeMinutes;
      newAvgTime = newTotalTime / newTimesCompleted;
    }

    const nextDueDate = this.calculateNextDueDate(task.repeat_timeline, new Date());

    await db.query(
      `UPDATE tasks 
       SET times_completed = $1, 
           total_completion_time = $2,
           average_completion_time = $3,
           last_completed_at = NOW(),
           next_due_date = $4
       WHERE task_id = $5`,
      [newTimesCompleted, newTotalTime, newAvgTime, nextDueDate, taskId]
    );

    return true;
  }

  // Update task
  static async update(taskId, updates) {
    const fields = [];
    const values = [];
    let paramCounter = 1;

    const allowedFields = ['title', 'details', 'category', 'repeat_timeline', 'due_within_days', 'is_active'];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramCounter++}`);
        values.push(updates[field]);
      }
    }

    if (fields.length === 0) return false;

    values.push(taskId);
    const result = await db.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE task_id = $${paramCounter}`,
      values
    );
    return result.rowCount > 0;
  }

  // Delete task
  static async delete(taskId) {
    const result = await db.query(
      'DELETE FROM tasks WHERE task_id = $1',
      [taskId]
    );
    return result.rowCount > 0;
  }

  // Get task statistics
  static async getStatistics(taskId) {
    const result = await db.query(
      'SELECT * FROM task_statistics WHERE task_id = $1',
      [taskId]
    );
    return result.rows[0];
  }

  // Get completion history
  static async getCompletionHistory(taskId, limit = 50) {
    const result = await db.query(
      `SELECT * FROM task_completions 
       WHERE task_id = $1 
       ORDER BY completed_at DESC 
       LIMIT $2`,
      [taskId, limit]
    );
    return result.rows;
  }

  // Get overall completion stats for a user
  static async getOverallCompletionStats(userId) {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_completions,
        SUM(CASE WHEN was_on_time THEN 1 ELSE 0 END) as on_time_completions
       FROM task_completions tc
       JOIN tasks t ON tc.task_id = t.task_id
       WHERE t.user_id = $1`,
      [userId]
    );
    
    const stats = result.rows[0];
    return {
      total_completions: parseInt(stats.total_completions) || 0,
      on_time_completions: parseInt(stats.on_time_completions) || 0
    };
  }

  // Helper: Calculate next due date based on repeat timeline
  static calculateNextDueDate(repeatTimeline, fromDate = new Date()) {
    const date = new Date(fromDate);
    
    switch (repeatTimeline) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    
    return date;
  }
}

module.exports = Task;
