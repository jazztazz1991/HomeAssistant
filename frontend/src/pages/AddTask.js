import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import taskService from '../services/taskService';

function AddTask() {
  const [taskData, setTaskData] = useState({
    title: '',
    details: '',
    repeat_timeline: 'daily',
    due_within_days: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await taskService.createTask(taskData);
      alert('Task created successfully!');
      navigate('/');
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

  return (
    <div className="add-task">
      <h1>Add New Task</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div>
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
        
        <div>
          <label>Description:</label>
          <textarea
            name="details"
            value={taskData.details}
            onChange={handleChange}
            disabled={loading}
            placeholder="Add any additional details..."
          />
        </div>
        
        <div>
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
        
        <div>
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
        
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Add Task'}
        </button>
      </form>
    </div>
  );
}

export default AddTask;
