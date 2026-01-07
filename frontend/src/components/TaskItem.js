import React, { useState } from 'react';
import EditTaskModal from './EditTaskModal';

function TaskItem({ task, onComplete, onDelete, onUpdate }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const categories = {
    household: { label: 'Household', color: '#FF6B6B', icon: '🏠' },
    work: { label: 'Work', color: '#4ECDC4', icon: '💼' },
    health: { label: 'Health', color: '#95E1D3', icon: '💪' },
    personal: { label: 'Personal', color: '#F38181', icon: '👤' },
    finance: { label: 'Finance', color: '#FFD93D', icon: '💰' },
    education: { label: 'Education', color: '#6C5CE7', icon: '📚' },
    social: { label: 'Social', color: '#A8E6CF', icon: '👥' },
    general: { label: 'General', color: '#95a5a6', icon: '📋' }
  };
  
  const getCategoryInfo = () => {
    return categories[task.category] || categories.general;
  };

  const getUrgencyStyle = () => {
    const color = task.urgency_color || 'green';
    
    const styles = {
      green: {
        borderLeft: '5px solid #4CAF50',
        backgroundColor: '#f1f8f4'
      },
      yellow: {
        borderLeft: '5px solid #FFC107',
        backgroundColor: '#fffbf0'
      },
      red: {
        borderLeft: '5px solid #f44336',
        backgroundColor: '#fff5f5'
      },
      overdue: {
        borderLeft: '5px solid #9C27B0',
        backgroundColor: '#faf0ff'
      }
    };

    return styles[color] || styles.green;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActualDueDate = () => {
    if (!task.next_due_date) return null;
    const startDate = new Date(task.next_due_date);
    const dueDate = new Date(startDate.getTime() + (task.due_within_days * 24 * 60 * 60 * 1000));
    return dueDate;
  };

  const getTimeRemaining = () => {
    const actualDueDate = getActualDueDate();
    if (!actualDueDate) return '';
    
    const now = new Date();
    const diffMs = actualDueDate - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      return `Overdue by ${Math.abs(diffDays)} days`;
    } else if (diffDays > 0) {
      return `${diffDays} days remaining`;
    } else {
      return `${diffHours} hours remaining`;
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return 'N/A';
    
    const years = Math.floor(minutes / (365 * 24 * 60));
    const remainingAfterYears = minutes % (365 * 24 * 60);
    
    const months = Math.floor(remainingAfterYears / (30 * 24 * 60));
    const remainingAfterMonths = remainingAfterYears % (30 * 24 * 60);
    
    const days = Math.floor(remainingAfterMonths / (24 * 60));
    const remainingAfterDays = remainingAfterMonths % (24 * 60);
    
    const hours = Math.floor(remainingAfterDays / 60);
    const mins = remainingAfterDays % 60;
    
    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
    if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    if (mins > 0) parts.push(`${mins} ${mins === 1 ? 'minute' : 'minutes'}`);
    
    return parts.length > 0 ? parts.join(' ') : '0 minutes';
  };

  const getUrgencyColor = () => {
    const colors = {
      green: '#4CAF50',
      yellow: '#FFC107',
      red: '#f44336',
      overdue: '#9C27B0'
    };
    return colors[task.urgency_color] || colors.green;
  };

  return (
    <div className="task-card">
      <div className="task-urgency-indicator" style={{ backgroundColor: getUrgencyColor() }}></div>
      
      <div className="task-card-header">
        <div className="task-card-title-section">
          <h3 className="task-card-title">{task.title}</h3>
          <div className="task-badges">
            <span 
              className="task-category-badge" 
              style={{ backgroundColor: getCategoryInfo().color }}
            >
              <span className="category-badge-icon">{getCategoryInfo().icon}</span>
              {getCategoryInfo().label}
            </span>
            <span className="task-repeat-badge">{task.repeat_timeline}</span>
          </div>
        </div>
        <div className="task-time-remaining">
          {getTimeRemaining()}
        </div>
      </div>

      {task.details && (
        <p className="task-card-description">{task.details}</p>
      )}

      <div className="task-card-meta">
        <div className="task-meta-item">
          <span className="meta-icon">🚀</span>
          <span className="meta-label">Started</span>
          <span className="meta-value">{formatDate(task.next_due_date)}</span>
        </div>
        <div className="task-meta-item">
          <span className="meta-icon">⏰</span>
          <span className="meta-label">Due By</span>
          <span className="meta-value">{formatDate(getActualDueDate())}</span>
        </div>
        <div className="task-meta-item">
          <span className="meta-icon">📅</span>
          <span className="meta-label">Time Window</span>
          <span className="meta-value">{task.due_within_days} day{task.due_within_days !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {task.times_completed > 0 && (
        <div className="task-card-stats">
          <div className="stat-badge">
            <span className="stat-icon">✓</span>
            <span>{task.times_completed} completion{task.times_completed !== 1 ? 's' : ''}</span>
          </div>
          {task.average_completion_time > 0 && (
            <div className="stat-badge">
              <span className="stat-icon">⏱️</span>
              <span>{formatDuration(task.average_completion_time)} avg</span>
            </div>
          )}
        </div>
      )}

      <div className="task-card-actions">
        <button 
          onClick={() => onComplete(task.task_id)} 
          className="task-btn task-btn-complete"
        >
          ✓ Complete
        </button>
        <button 
          onClick={() => setIsEditModalOpen(true)} 
          className="task-btn task-btn-edit"
        >
          ✏️ Edit
        </button>
        <button 
          onClick={() => onDelete(task.task_id)} 
          className="task-btn task-btn-delete"
        >
          🗑️ Delete
        </button>
      </div>

      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={task}
        onTaskUpdated={() => {
          setIsEditModalOpen(false);
          if (onUpdate) onUpdate();
        }}
      />
    </div>
  );
}

export default TaskItem;
