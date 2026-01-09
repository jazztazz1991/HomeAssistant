import React, { useState, useEffect } from 'react';
import TaskItem from '../../components/TaskItem/TaskItem';
import taskService from '../../services/taskService';
import './AllTasks.css';

function AllTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [sortBy, setSortBy] = useState('urgency');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

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
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const getFilteredAndSortedTasks = () => {
    let filteredTasks = [...tasks];
    
    // Apply urgency filter
    if (urgencyFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.urgency_color === urgencyFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.category === categoryFilter);
    }
    
    // Apply timeline filter
    if (timelineFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.repeat_timeline === timelineFilter);
    }
    
    // Apply sorting
    const sortedTasks = [...filteredTasks].sort((a, b) => {
      if (sortBy === 'urgency') {
        const urgencyOrder = { 'red': 0, 'yellow': 1, 'green': 2, 'overdue': 3 };
        return urgencyOrder[a.urgency_color] - urgencyOrder[b.urgency_color];
      } else if (sortBy === 'due_date') {
        const aDueDate = new Date(a.next_due_date).getTime() + (a.due_within_days * 24 * 60 * 60 * 1000);
        const bDueDate = new Date(b.next_due_date).getTime() + (b.due_within_days * 24 * 60 * 60 * 1000);
        return aDueDate - bDueDate;
      } else if (sortBy === 'completion_rate') {
        return (b.times_completed || 0) - (a.times_completed || 0);
      }
      return 0;
    });
    
    return sortedTasks;
  };

  const filteredTasks = getFilteredAndSortedTasks();

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
    <div className="all-tasks-page">
      <div className="page-header">
        <h1>All Tasks</h1>
        <p className="page-description">View all tasks including future scheduled tasks</p>
      </div>

      <div className="filter-toggle-header" onClick={() => setIsFilterExpanded(!isFilterExpanded)}>
        <h3>
          {isFilterExpanded ? '▼' : '▶'} Filters & Sorting
        </h3>
        <span className="filter-summary">
          {urgencyFilter !== 'all' || categoryFilter !== 'all' || timelineFilter !== 'all' || sortBy !== 'urgency'
            ? 'Active'
            : 'Click to expand'}
        </span>
      </div>

      {isFilterExpanded && (
        <div className="filter-section">
        <div className="filter-group">
          <h3>Filter by Urgency</h3>
          <div className="task-filters">
            <button 
              className={urgencyFilter === 'all' ? 'active' : ''} 
              onClick={() => setUrgencyFilter('all')}
            >
              All ({tasks.length})
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

        <div className="filter-group">
          <h3>Filter by Timeline</h3>
          <div className="task-filters">
            <button 
              className={timelineFilter === 'all' ? 'active' : ''} 
              onClick={() => setTimelineFilter('all')}
            >
              All Timelines
            </button>
            <button 
              className={timelineFilter === 'daily' ? 'active' : ''} 
              onClick={() => setTimelineFilter('daily')}
            >
              📅 Daily
            </button>
            <button 
              className={timelineFilter === 'weekly' ? 'active' : ''} 
              onClick={() => setTimelineFilter('weekly')}
            >
              📆 Weekly
            </button>
            <button 
              className={timelineFilter === 'monthly' ? 'active' : ''} 
              onClick={() => setTimelineFilter('monthly')}
            >
              🗓️ Monthly
            </button>
            <button 
              className={timelineFilter === 'yearly' ? 'active' : ''} 
              onClick={() => setTimelineFilter('yearly')}
            >
              📖 Yearly
            </button>
          </div>
        </div>

        <div className="filter-group">
          <h3>Sort By</h3>
          <div className="task-filters">
            <button 
              className={sortBy === 'urgency' ? 'active' : ''} 
              onClick={() => setSortBy('urgency')}
            >
              🚨 Urgency
            </button>
            <button 
              className={sortBy === 'due_date' ? 'active' : ''} 
              onClick={() => setSortBy('due_date')}
            >
              📅 Due Date
            </button>
            <button 
              className={sortBy === 'completion_rate' ? 'active' : ''} 
              onClick={() => setSortBy('completion_rate')}
            >
              ✓ Completion Rate
            </button>
          </div>
        </div>
      </div>
      )}

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

export default AllTasks;
