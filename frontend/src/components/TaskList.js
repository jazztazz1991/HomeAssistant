import React, { useState, useEffect } from 'react';
import TaskItem from './TaskItem';
import taskService from '../services/taskService';

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [urgencyFilter, setUrgencyFilter] = useState('all'); // all, green, yellow, red
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, household, work, health, personal, finance, education, social, general

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
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getTasksWithUrgency();
      setTasks(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (taskId) => {
    try {
      // Find the task to get its next_due_date
      const task = tasks.find(t => t.task_id === taskId);
      
      // Calculate completion time in minutes from when task appeared
      let completionTimeMinutes = null;
      if (task && task.next_due_date) {
        const startTime = new Date(task.next_due_date);
        const now = new Date();
        const diffMs = now - startTime;
        completionTimeMinutes = Math.round(diffMs / (1000 * 60)); // Convert to minutes
      }
      
      await taskService.completeTask(taskId, {
        completion_time_minutes: completionTimeMinutes,
        notes: null
      });

      // Refresh tasks
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete task');
      console.error('Error completing task:', err);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await taskService.deleteTask(taskId);
      fetchTasks();
      alert('Task deleted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const getFilteredTasks = () => {
    // Filter for due tasks (next_due_date is in the past or today)
    let filteredTasks = tasks.filter(task => 
      new Date(task.next_due_date) <= new Date()
    );
    
    // Apply urgency filter
    if (urgencyFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.urgency_color === urgencyFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.category === categoryFilter);
    }
    
    return filteredTasks;
  };

  const filteredTasks = getFilteredTasks();

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={fetchTasks}>Retry</button>
      </div>
    );
  }

  return (
    <div className="task-list-container">
      <div className="filter-section">
        <div className="filter-group">
          <h3>Filter by Urgency</h3>
          <div className="task-filters">
            <button 
              className={urgencyFilter === 'all' ? 'active' : ''} 
              onClick={() => setUrgencyFilter('all')}
            >
              All ({tasks.filter(task => new Date(task.next_due_date) <= new Date()).length})
            </button>
            <button 
              className={urgencyFilter === 'green' ? 'active filter-green' : 'filter-green'} 
              onClick={() => setUrgencyFilter('green')}
            >
              🟢 On Track
            </button>
            <button 
              className={urgencyFilter === 'yellow' ? 'active filter-yellow' : 'filter-yellow'} 
              onClick={() => setUrgencyFilter('yellow')}
            >
              🟡 Attention
            </button>
            <button 
              className={urgencyFilter === 'red' ? 'active filter-red' : 'filter-red'} 
              onClick={() => setUrgencyFilter('red')}
            >
              🔴 Urgent
            </button>
          </div>
        </div>

        <div className="filter-group">
          <h3>Filter by Category</h3>
          <div className="task-filters">
            <button 
              className={categoryFilter === 'all' ? 'active' : ''} 
              onClick={() => setCategoryFilter('all')}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.value}
                className={categoryFilter === cat.value ? 'active filter-category' : 'filter-category'}
                onClick={() => setCategoryFilter(cat.value)}
                style={{
                  borderColor: categoryFilter === cat.value ? cat.color : '#ddd',
                  backgroundColor: categoryFilter === cat.value ? cat.color : 'white',
                  color: categoryFilter === cat.value ? 'white' : '#333'
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="no-tasks">
          <p>No tasks found. Add your first task to get started!</p>
        </div>
      ) : (
        <div className="task-list">
          {filteredTasks.map(task => (
            <TaskItem
              key={task.task_id}
              task={task}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onUpdate={fetchTasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskList;
