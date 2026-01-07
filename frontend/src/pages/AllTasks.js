import React, { useState, useEffect } from 'react';
import TaskItem from '../components/TaskItem';
import taskService from '../services/taskService';

function AllTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      {tasks.length === 0 ? (
        <div className="no-tasks">
          <p>No tasks found. Add your first task to get started!</p>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map(task => (
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
