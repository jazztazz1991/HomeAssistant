const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');

// All task routes require authentication
router.use(authMiddleware);

// Get all tasks for current user
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.findByUserId(req.user.userId);
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
});

// Get tasks with urgency color coding
router.get('/urgency', async (req, res) => {
  try {
    const tasks = await Task.getTasksWithUrgency(req.user.userId);
    res.json({ tasks });
  } catch (error) {
    console.error('Get urgency tasks error:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
});

// Get due tasks
router.get('/due', async (req, res) => {
  try {
    const tasks = await Task.getDueTasks(req.user.userId);
    res.json({ tasks });
  } catch (error) {
    console.error('Get due tasks error:', error);
    res.status(500).json({ message: 'Server error fetching due tasks' });
  }
});

// Get single task by ID
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify task belongs to user
    if (task.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error fetching task' });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const { title, details, category, repeat_timeline, due_within_days, next_due_date } = req.body;
    
    console.log('Received task data:', { title, details, category, repeat_timeline, due_within_days, next_due_date });

    // Validate input
    if (!title || !repeat_timeline) {
      return res.status(400).json({ message: 'Please provide title and repeat timeline' });
    }

    const validTimelines = ['daily', 'weekly', 'monthly', 'yearly'];
    if (!validTimelines.includes(repeat_timeline)) {
      return res.status(400).json({ message: 'Invalid repeat timeline' });
    }

    const taskId = await Task.create(req.user.userId, {
      title,
      details,
      category,
      repeat_timeline,
      due_within_days: due_within_days || 1,
      next_due_date
    });

    const task = await Task.findById(taskId);
    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify task belongs to user
    if (task.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const updated = await Task.update(req.params.id, req.body);
    
    if (!updated) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const updatedTask = await Task.findById(req.params.id);
    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error updating task' });
  }
});

// Update the task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }
    // Verify task belongs to user
    if (task.user_id !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    const updated = await Task.update(req.params.id, req.body);
    if (!updated) {
        return res.status(400).json({ message: 'No valid fields to update' });
    }

    const updatedTask = await Task.findById(req.params.id);
    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error updating task' });
  }
});

// Mark task as complete
router.post('/:id/complete', async (req, res) => {
  try {
    const { completion_time_minutes, notes } = req.body;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify task belongs to user
    if (task.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to complete this task' });
    }

    const completed = await Task.complete(
      req.params.id,
      req.user.userId,
      completion_time_minutes,
      notes
    );

    if (!completed) {
      return res.status(500).json({ message: 'Failed to complete task' });
    }

    const updatedTask = await Task.findById(req.params.id);
    res.json({
      message: 'Task completed successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ message: 'Server error completing task' });
  }
});

// Get task statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify task belongs to user
    if (task.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to view statistics' });
    }

    const statistics = await Task.getStatistics(req.params.id);
    res.json({ statistics });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

// Get task completion history
router.get('/:id/history', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify task belongs to user
    if (task.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to view history' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const history = await Task.getCompletionHistory(req.params.id, limit);
    res.json({ history });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Server error fetching history' });
  }
});

// Get overall completion stats for user
router.get('/stats/completion-rate', async (req, res) => {
  try {
    const stats = await Task.getOverallCompletionStats(req.user.userId);
    res.json({ stats });
  } catch (error) {
    console.error('Get completion stats error:', error);
    res.status(500).json({ message: 'Server error fetching completion stats' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify task belongs to user
    if (task.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await Task.delete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error deleting task' });
  }
});

module.exports = router;
