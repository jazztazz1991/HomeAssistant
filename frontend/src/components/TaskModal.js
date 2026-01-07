import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import taskService from '../services/taskService';

function TaskModal({ isOpen, onClose, onTaskAdded }) {
  const [taskData, setTaskData] = useState({
    title: '',
    details: '',
    category: 'general',
    repeat_timeline: 'daily',
    due_within_days: 1
  });
  const [testMode, setTestMode] = useState(false);
  const [startDate, setStartDate] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const dataToSend = { ...taskData };
      if (testMode && startDate) {
        dataToSend.next_due_date = new Date(startDate).toISOString();
      }
      
      console.log('Sending task data:', dataToSend);
      
      await taskService.createTask(dataToSend);
      setTaskData({
        title: '',
        details: '',
        category: 'general',
        repeat_timeline: 'daily',
        due_within_days: 1
      });
      setTestMode(false);
      setStartDate('');
      onTaskAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
      console.error('Create task error:', err);
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

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Task</h2>
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

          <div className="form-group test-mode-section">
            <label className="test-mode-label">
              <input
                type="checkbox"
                checked={testMode}
                onChange={(e) => setTestMode(e.target.checked)}
              />
              <span>Test Mode (Set Custom Start Date)</span>
            </label>
            
            {testMode && (
              <div className="test-mode-inputs">
                <label>Start Date & Time:</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <small>Set a past or future date to test urgency colors</small>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Creating...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default TaskModal;
