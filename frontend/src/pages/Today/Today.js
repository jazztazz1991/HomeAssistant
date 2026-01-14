import React, { useState, useEffect } from 'react';
import TaskList from '../../components/TaskList/TaskList';
import TaskModal from '../../components/TaskModal/TaskModal';
import api from '../../services/api';
import './Today.css';

function Today() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    overdue: 0,
    dueToday: 0,
    completedToday: 0
  });

  useEffect(() => {
    fetchTodayStats();
  }, [refreshTrigger]);

  const fetchTodayStats = async () => {
    try {
      const response = await api.get('/tasks');
      const tasks = response.data.tasks || response.data;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const overdue = tasks.filter(task => {
        const dueDate = new Date(task.due_date);
        return !task.completed && dueDate < today;
      }).length;
      
      const dueToday = tasks.filter(task => {
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return !task.completed && dueDate.getTime() === today.getTime();
      }).length;
      
      const completedToday = tasks.filter(task => {
        if (!task.completed_at) return false;
        const completedDate = new Date(task.completed_at);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
      }).length;
      
      setStats({ overdue, dueToday, completedToday });
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  };

  const handleTaskAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="today-page">
      <div className="today-header">
        <div>
          <h1>Today</h1>
          <p className="today-date">{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        <button className="btn-add-task" onClick={() => setIsModalOpen(true)}>
          + Add Task
        </button>
      </div>

      <div className="today-stats">
        <div className="stat-card overdue">
          <div className="stat-number">{stats.overdue}</div>
          <div className="stat-label">Overdue</div>
        </div>
        <div className="stat-card due-today">
          <div className="stat-number">{stats.dueToday}</div>
          <div className="stat-label">Due Today</div>
        </div>
        <div className="stat-card completed">
          <div className="stat-number">{stats.completedToday}</div>
          <div className="stat-label">Completed Today</div>
        </div>
      </div>

      <div className="today-tasks">
        <h2>Your Tasks</h2>
        <TaskList 
          key={refreshTrigger} 
          filterOverdue={true}
          filterToday={true}
          limit={20}
        />
      </div>
      
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onTaskAdded={handleTaskAdded}
      />
    </div>
  );
}

export default Today;
