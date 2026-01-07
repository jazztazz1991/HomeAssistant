import React, { useState } from 'react';

function AddTask() {
  const [taskData, setTaskData] = useState({
    name: '',
    description: '',
    repeatTimeline: 'daily',
    dueWithinDays: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Task data:', taskData);
    // TODO: Send to backend
  };

  const handleChange = (e) => {
    setTaskData({
      ...taskData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="add-task">
      <h1>Add New Task</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Task Name:</label>
          <input
            type="text"
            name="name"
            value={taskData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label>Description:</label>
          <textarea
            name="description"
            value={taskData.description}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label>Repeat Timeline:</label>
          <select
            name="repeatTimeline"
            value={taskData.repeatTimeline}
            onChange={handleChange}
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
            name="dueWithinDays"
            value={taskData.dueWithinDays}
            onChange={handleChange}
            min="1"
            required
          />
        </div>
        
        <button type="submit">Add Task</button>
      </form>
    </div>
  );
}

export default AddTask;
