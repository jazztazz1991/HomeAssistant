const express = require('express');
const router = express.Router();
const Subtask = require('../models/Subtask');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get all subtasks for a task
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const subtasks = await Subtask.findByTaskId(taskId);
    res.json(subtasks);
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    res.status(500).json({ message: 'Server error fetching subtasks' });
  }
});

// Create a new subtask
router.post('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, position } = req.body;

    console.log('Creating subtask:', { taskId, title, position, body: req.body });

    if (!title) {
      return res.status(400).json({ message: 'Subtask title is required' });
    }

    const subtask = await Subtask.create(taskId, title, position || 0);
    console.log('Subtask created successfully:', subtask);
    res.status(201).json(subtask);
  } catch (error) {
    console.error('Error creating subtask:', error);
    res.status(500).json({ message: 'Server error creating subtask' });
  }
});

// Toggle subtask completion
router.patch('/:subtaskId/toggle', async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const subtask = await Subtask.toggleComplete(subtaskId);
    
    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    res.json(subtask);
  } catch (error) {
    console.error('Error toggling subtask:', error);
    res.status(500).json({ message: 'Server error toggling subtask' });
  }
});

// Update subtask title
router.put('/:subtaskId', async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Subtask title is required' });
    }

    const subtask = await Subtask.update(subtaskId, title);
    
    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    res.json(subtask);
  } catch (error) {
    console.error('Error updating subtask:', error);
    res.status(500).json({ message: 'Server error updating subtask' });
  }
});

// Delete subtask
router.delete('/:subtaskId', async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const subtask = await Subtask.delete(subtaskId);
    
    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    res.json({ message: 'Subtask deleted successfully' });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    res.status(500).json({ message: 'Server error deleting subtask' });
  }
});

// Update subtask positions (for reordering)
router.post('/reorder', async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: 'Updates must be an array' });
    }

    await Subtask.updatePositions(updates);
    res.json({ message: 'Subtasks reordered successfully' });
  } catch (error) {
    console.error('Error reordering subtasks:', error);
    res.status(500).json({ message: 'Server error reordering subtasks' });
  }
});

// Get subtask stats for a task
router.get('/task/:taskId/stats', async (req, res) => {
  try {
    const { taskId } = req.params;
    const stats = await Subtask.getStats(taskId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching subtask stats:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

module.exports = router;
