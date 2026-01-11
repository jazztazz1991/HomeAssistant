import React, { useState, useEffect } from 'react';
import taskService from '../../services/taskService';
import TaskItem from '../../components/TaskItem/TaskItem';
import './Calendar.css';

function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month or week
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    details: '',
    repeat_timeline: 'daily',
    due_within_days: 1
  });

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

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await taskService.createTask(newTaskData);
      setShowAddTaskModal(false);
      setNewTaskData({
        title: '',
        details: '',
        repeat_timeline: 'daily',
        due_within_days: 1
      });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
      console.error('Create task error:', err);
    }
  };

  const handleTaskInputChange = (e) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setNewTaskData({
      ...newTaskData,
      [e.target.name]: value
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.next_due_date);
      const deadline = new Date(taskDate.getTime() + (task.due_within_days * 24 * 60 * 60 * 1000));
      
      // Check if task's start date or deadline falls on this date
      const taskStartDate = taskDate.toDateString();
      const taskDeadlineDate = deadline.toDateString();
      const checkDate = date.toDateString();
      
      return taskStartDate === checkDate || taskDeadlineDate === checkDate || 
             (taskDate <= date && deadline >= date);
    });
  };

  const changeMonth = (direction) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderMonthView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const days = [];
    const today = new Date().toDateString();

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toDateString();
      const isToday = dateStr === today;
      const tasksForDay = getTasksForDate(date);
      
      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''} ${tasksForDay.length > 0 ? 'has-tasks' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="day-number">{day}</div>
          {tasksForDay.length > 0 && (
            <div className="task-indicators">
              {tasksForDay.slice(0, 3).map((task, idx) => (
                <div
                  key={idx}
                  className={`task-dot ${task.urgency_color}`}
                  title={task.title}
                ></div>
              ))}
              {tasksForDay.length > 3 && (
                <div className="task-count">+{tasksForDay.length - 3}</div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    // Create array of week days
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }

    // Group tasks by their span across the week
    const taskRows = [];
    const processedTasks = new Set();

    tasks.forEach(task => {
      if (processedTasks.has(task.task_id)) return;

      const taskStartDate = new Date(task.next_due_date);
      const taskEndDate = new Date(taskStartDate.getTime() + (task.due_within_days * 24 * 60 * 60 * 1000));

      // Check if task overlaps with this week
      const weekStart = weekDates[0];
      const weekEnd = new Date(weekDates[6]);
      weekEnd.setHours(23, 59, 59, 999);

      if (taskEndDate >= weekStart && taskStartDate <= weekEnd) {
        // Calculate which days this task spans
        const spanStart = Math.max(0, Math.ceil((taskStartDate - weekStart) / (24 * 60 * 60 * 1000)));
        const spanEnd = Math.min(6, Math.floor((taskEndDate - weekStart) / (24 * 60 * 60 * 1000)));

        if (spanStart <= 6 && spanEnd >= 0) {
          taskRows.push({
            task,
            startDay: Math.max(0, spanStart),
            endDay: Math.min(6, spanEnd),
            span: Math.min(6, spanEnd) - Math.max(0, spanStart) + 1
          });
          processedTasks.add(task.task_id);
        }
      }
    });

    return (
      <>
        <div className="week-header">
          {weekDates.map((date, i) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`week-header-day ${isToday ? 'today' : ''}`}>
                <div className="week-day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="week-day-date">{date.getDate()}</div>
              </div>
            );
          })}
        </div>
        <div className="week-tasks-container">
          {taskRows.map((taskRow, idx) => (
            <div key={idx} className="week-task-row">
              {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                if (dayIndex === taskRow.startDay) {
                  return (
                    <div
                      key={dayIndex}
                      className={`week-task-bar ${taskRow.task.urgency_color}`}
                      style={{
                        gridColumn: `${dayIndex + 1} / span ${taskRow.span}`
                      }}
                      onClick={() => {
                        const taskDate = new Date(taskRow.task.next_due_date);
                        setSelectedDate(taskDate);
                      }}
                    >
                      <span className="week-task-title">{taskRow.task.title}</span>
                      <span className="week-task-timeline">{taskRow.task.repeat_timeline}</span>
                    </div>
                  );
                } else if (dayIndex < taskRow.startDay || dayIndex > taskRow.endDay) {
                  return <div key={dayIndex} className="week-task-empty"></div>;
                } else {
                  return null;
                }
              })}
            </div>
          ))}
        </div>
      </>
    );
  };

  if (loading) {
    return <div className="loading">Loading calendar...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={fetchTasks}>Retry</button>
      </div>
    );
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="calendar-page">
      <div className="page-header">
        <h1>📅 Calendar View</h1>
        <p className="page-description">Visual timeline of your tasks</p>
      </div>

      <div className="calendar-controls">
        <div className="calendar-nav">
          <button onClick={() => changeMonth(-1)} className="nav-btn">← Prev</button>
          <button onClick={goToToday} className="today-btn">Today</button>
          <button onClick={() => changeMonth(1)} className="nav-btn">Next →</button>
        </div>
        
        <div className="calendar-title">
          <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
        </div>

        <div className="view-toggle-container">
          <div className="view-toggle">
            <button
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
          </div>
          <button onClick={() => setShowAddTaskModal(true)} className="add-task-btn">+ Add Task</button>
        </div>
      </div>

      <div className="calendar-content-wrapper">
        {viewMode === 'month' ? (
          <div className="calendar-grid">
            <div className="calendar-header">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-header-day">{day}</div>
              ))}
            </div>
            <div className="calendar-days">
              {renderMonthView()}
            </div>
          </div>
        ) : (
          <div className="week-grid">
            {renderWeekView()}
          </div>
        )}

        {selectedDate && (
          <div className="selected-date-tasks">
            <div className="selected-date-header">
              <h3>Tasks for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</h3>
              <button onClick={() => setSelectedDate(null)} className="close-btn">×</button>
            </div>
            <div className="task-list">
              {getTasksForDate(selectedDate).length > 0 ? (
                getTasksForDate(selectedDate).map(task => (
                  <TaskItem
                    key={task.task_id}
                    task={task}
                    onComplete={async (id) => {
                      const task = tasks.find(t => t.task_id === id);
                      const startTime = new Date(task.next_due_date);
                      const now = new Date();
                      const diffMs = now - startTime;
                      const completionTimeMinutes = Math.round(diffMs / (1000 * 60));
                      
                      await taskService.completeTask(id, {
                        completion_time_minutes: completionTimeMinutes,
                        notes: null
                      });
                      fetchTasks();
                    }}
                    onDelete={async (id) => {
                      if (window.confirm('Are you sure you want to delete this task?')) {
                        await taskService.deleteTask(id);
                        fetchTasks();
                      }
                    }}
                    onUpdate={fetchTasks}
                  />
                ))
              ) : (
                <p className="no-tasks-message">No tasks for this date</p>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddTaskModal && (
        <div className="modal-overlay" onClick={() => setShowAddTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Task</h2>
              <button onClick={() => setShowAddTaskModal(false)} className="close-btn">×</button>
            </div>
            <form onSubmit={handleAddTask} className="task-form">
              <div className="form-group">
                <label>Task Name:</label>
                <input
                  type="text"
                  name="title"
                  value={newTaskData.title}
                  onChange={handleTaskInputChange}
                  required
                  placeholder="e.g., Water plants, Pay bills"
                />
              </div>
              
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="details"
                  value={newTaskData.details}
                  onChange={handleTaskInputChange}
                  placeholder="Add any additional details..."
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Repeat Timeline:</label>
                <select
                  name="repeat_timeline"
                  value={newTaskData.repeat_timeline}
                  onChange={handleTaskInputChange}
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
                  value={newTaskData.due_within_days}
                  onChange={handleTaskInputChange}
                  min="1"
                  required
                />
                <small>How many days you have to complete the task once it appears</small>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddTaskModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
