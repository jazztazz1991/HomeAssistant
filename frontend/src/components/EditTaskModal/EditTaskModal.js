import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import taskService from '../../services/taskService';
import './EditTaskModal.css';

function EditTaskModal({ isOpen, onClose, task, onTaskUpdated }) {
  const [taskData, setTaskData] = useState({
    title: '',
    details: '',
    category: 'general',
    repeat_timeline: 'daily',
    due_within_days: 1
  });
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'household', label: 'Household', color: '#FF6B6B', icon: '🏠' },
    { value: 'work', label: 'Work', color: '#4ECDC4', icon: '💼' },
    { value: 'health', label: 'Health', color: '#95E1D3', icon: '💪' },
    { value: 'personal', label: 'Personal', color: '#F38181', icon: '👤' },
    { value: 'finance', label: 'Finance', color: '#FFD93D', icon: '💰' },
    { value: 'education', label: 'Education', color: '#6C5CE7', icon: '📚' },
    { value: 'social', label: 'Social', color: '#A8E6CF', icon: '👥' },
    { value: 'general', label: 'General', color: '#95a5a6', icon: '📋' }
  ];

  useEffect(() => {
    if (task && isOpen) {
      setTaskData({
        title: task.title || '',
        details: task.details || '',
        category: task.category || 'general',
        repeat_timeline: task.repeat_timeline || 'daily',
        due_within_days: task.due_within_days || 1
      });
      loadSubtasks();
    }
  }, [task, isOpen]);

  const loadSubtasks = async () => {
    if (!task?.task_id) return;
    try {
      const data = await taskService.getSubtasks(task.task_id);
      setSubtasks(data);
    } catch (error) {
      console.error('Error loading subtasks:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await taskService.updateTask(task.task_id, taskData);
      onTaskUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
      console.error('Update task error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setTaskData({
      ...taskData,
      [e.target.name]: value
    });
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !task?.task_id) return;
    
    try {
      await taskService.createSubtask(task.task_id, {
        title: newSubtaskTitle.trim(),
        position: subtasks.length
      });
      setNewSubtaskTitle('');
      loadSubtasks();
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const handleRemoveSubtask = async (subtaskId) => {
    try {
      await taskService.deleteSubtask(subtaskId);
      loadSubtasks();
    } catch (error) {
      console.error('Error removing subtask:', error);
    }
  };

  const handleSubtaskKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Task</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Name:</label>
            <input
              type="text"
              name="title"
              value={taskData.title}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="e.g., Water plants, Pay bills"
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              name="details"
              value={taskData.details}
              onChange={handleChange}
              disabled={loading}
              placeholder="Add any additional details..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Category:</label>
            <div className="category-grid">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  className={`category-option ${taskData.category === cat.value ? 'selected' : ''}`}
                  onClick={() => setTaskData({ ...taskData, category: cat.value })}
                  style={{
                    borderColor: taskData.category === cat.value ? cat.color : '#ddd',
                    backgroundColor: taskData.category === cat.value ? `${cat.color}15` : 'transparent'
                  }}
                  disabled={loading}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span className="category-label">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Repeat Timeline:</label>
            <select
              name="repeat_timeline"
              value={taskData.repeat_timeline}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="form-group">
            <label>Due Within (days):</label>
            <input
              type="number"
              name="due_within_days"
              value={taskData.due_within_days}
              onChange={handleChange}
              min="1"
              required
              disabled={loading}
            />
            <small>How many days you have to complete the task once it appears</small>
          </div>

          <div className="form-group">
            <label>Subtasks:</label>
            <div className="subtask-input-row">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyPress={handleSubtaskKeyPress}
                placeholder="Add a subtask..."
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="btn-add-subtask"
                disabled={loading || !newSubtaskTitle.trim()}
              >
                + Add
              </button>
            </div>
            {subtasks.length > 0 && (
              <ul className="subtask-list">
                {subtasks.map((subtask) => (
                  <li key={subtask.subtask_id} className="subtask-item">
                    <span className="subtask-text">{subtask.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(subtask.subtask_id)}
                      className="btn-remove-subtask"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default EditTaskModal;
