import React, { useState } from 'react';
import TaskList from '../components/TaskList';
import TaskModal from '../components/TaskModal';

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTaskAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Task Dashboard</h1>
        <button className="btn-add-task" onClick={() => setIsModalOpen(true)}>
          + Add Task
        </button>
      </div>
      <p>Manage your automated recurring tasks</p>
      <TaskList key={refreshTrigger} />
      
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onTaskAdded={handleTaskAdded}
      />
    </div>
  );
}

export default Dashboard;
