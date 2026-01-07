import React, { useState, useEffect } from 'react';
import taskService from '../services/taskService';

function Statistics() {
  const [tasks, setTasks] = useState([]);
  const [completionStats, setCompletionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tasksData, statsData] = await Promise.all([
        taskService.getTasksWithUrgency(),
        taskService.getCompletionStats()
      ]);
      setTasks(tasksData);
      setCompletionStats(statsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch statistics');
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalTasks = tasks.length;
    const activeTasks = tasks.filter(t => t.is_active).length;
    const completedTasks = tasks.reduce((sum, t) => sum + (t.times_completed || 0), 0);
    
    const tasksWithCompletions = tasks.filter(t => t.times_completed > 0);
    const avgCompletionTime = tasksWithCompletions.length > 0
      ? tasksWithCompletions.reduce((sum, t) => sum + (t.average_completion_time || 0), 0) / tasksWithCompletions.length
      : 0;

    const urgencyCounts = {
      green: tasks.filter(t => t.urgency_color === 'green').length,
      yellow: tasks.filter(t => t.urgency_color === 'yellow').length,
      red: tasks.filter(t => t.urgency_color === 'red').length,
      overdue: tasks.filter(t => t.urgency_color === 'overdue').length
    };

    const timelineCounts = {
      daily: tasks.filter(t => t.repeat_timeline === 'daily').length,
      weekly: tasks.filter(t => t.repeat_timeline === 'weekly').length,
      monthly: tasks.filter(t => t.repeat_timeline === 'monthly').length,
      yearly: tasks.filter(t => t.repeat_timeline === 'yearly').length
    };

    const mostCompletedTask = tasks.reduce((max, task) => 
      task.times_completed > (max?.times_completed || 0) ? task : max
    , null);

    const longestStreakTask = tasks.reduce((max, task) => 
      task.current_streak > (max?.current_streak || 0) ? task : max
    , null);

    return {
      totalTasks,
      activeTasks,
      completedTasks,
      avgCompletionTime,
      urgencyCounts,
      timelineCounts,
      mostCompletedTask,
      longestStreakTask
    };
  };

  if (loading) {
    return <div className="loading">Loading statistics...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={fetchStatistics}>Retry</button>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="statistics-page">
      <div className="statistics-header">
        <h1>Task Statistics</h1>
        <button onClick={fetchStatistics} className="btn-refresh">
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        {/* Overview Stats */}
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Tasks</h3>
            <div className="stat-value">{stats.totalTasks}</div>
            <div className="stat-label">{stats.activeTasks} active</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Total Completions</h3>
            <div className="stat-value">{stats.completedTasks}</div>
            <div className="stat-label">across all tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>Avg Completion Time</h3>
            <div className="stat-value">
              {stats.avgCompletionTime > 0 ? `${Math.round(stats.avgCompletionTime)} min` : 'N/A'}
            </div>
            <div className="stat-label">per task</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>On-Time Completion Rate</h3>
            <div className="stat-value">
              {completionStats && completionStats.total_completions > 0 
                ? `${((completionStats.on_time_completions / completionStats.total_completions) * 100).toFixed(1)}%`
                : 'N/A'}
            </div>
            <div className="stat-label">
              {completionStats 
                ? `${completionStats.on_time_completions}/${completionStats.total_completions} before overdue`
                : 'No completions yet'}
            </div>
          </div>
        </div>
      </div>

      {/* Urgency Breakdown */}
      <div className="stats-section">
        <h2>Urgency Breakdown</h2>
        <div className="urgency-stats">
          <div className="urgency-bar-container">
            <div className="urgency-bars">
              <div 
                className="urgency-bar green" 
                style={{width: `${(stats.urgencyCounts.green / stats.totalTasks * 100) || 0}%`}}
              >
                {stats.urgencyCounts.green > 0 && stats.urgencyCounts.green}
              </div>
              <div 
                className="urgency-bar yellow" 
                style={{width: `${(stats.urgencyCounts.yellow / stats.totalTasks * 100) || 0}%`}}
              >
                {stats.urgencyCounts.yellow > 0 && stats.urgencyCounts.yellow}
              </div>
              <div 
                className="urgency-bar red" 
                style={{width: `${(stats.urgencyCounts.red / stats.totalTasks * 100) || 0}%`}}
              >
                {stats.urgencyCounts.red > 0 && stats.urgencyCounts.red}
              </div>
              <div 
                className="urgency-bar overdue" 
                style={{width: `${(stats.urgencyCounts.overdue / stats.totalTasks * 100) || 0}%`}}
              >
                {stats.urgencyCounts.overdue > 0 && stats.urgencyCounts.overdue}
              </div>
            </div>
            <div className="urgency-legend">
              <div className="legend-item">
                <span className="legend-color green"></span>
                <span>Green: {stats.urgencyCounts.green}</span>
              </div>
              <div className="legend-item">
                <span className="legend-color yellow"></span>
                <span>Yellow: {stats.urgencyCounts.yellow}</span>
              </div>
              <div className="legend-item">
                <span className="legend-color red"></span>
                <span>Red: {stats.urgencyCounts.red}</span>
              </div>
              <div className="legend-item">
                <span className="legend-color overdue"></span>
                <span>Overdue: {stats.urgencyCounts.overdue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Breakdown */}
      <div className="stats-section">
        <h2>Tasks by Timeline</h2>
        <div className="timeline-stats">
          <div className="timeline-item">
            <div className="timeline-label">Daily</div>
            <div className="timeline-bar">
              <div 
                className="timeline-fill" 
                style={{width: `${(stats.timelineCounts.daily / stats.totalTasks * 100) || 0}%`}}
              ></div>
            </div>
            <div className="timeline-count">{stats.timelineCounts.daily}</div>
          </div>
          <div className="timeline-item">
            <div className="timeline-label">Weekly</div>
            <div className="timeline-bar">
              <div 
                className="timeline-fill" 
                style={{width: `${(stats.timelineCounts.weekly / stats.totalTasks * 100) || 0}%`}}
              ></div>
            </div>
            <div className="timeline-count">{stats.timelineCounts.weekly}</div>
          </div>
          <div className="timeline-item">
            <div className="timeline-label">Monthly</div>
            <div className="timeline-bar">
              <div 
                className="timeline-fill" 
                style={{width: `${(stats.timelineCounts.monthly / stats.totalTasks * 100) || 0}%`}}
              ></div>
            </div>
            <div className="timeline-count">{stats.timelineCounts.monthly}</div>
          </div>
          <div className="timeline-item">
            <div className="timeline-label">Yearly</div>
            <div className="timeline-bar">
              <div 
                className="timeline-fill" 
                style={{width: `${(stats.timelineCounts.yearly / stats.totalTasks * 100) || 0}%`}}
              ></div>
            </div>
            <div className="timeline-count">{stats.timelineCounts.yearly}</div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="stats-section">
        <h2>Top Performers</h2>
        <div className="top-performers">
          {stats.mostCompletedTask && (
            <div className="performer-card">
              <h3>🏆 Most Completed Task</h3>
              <div className="performer-name">{stats.mostCompletedTask.title}</div>
              <div className="performer-stat">
                {stats.mostCompletedTask.times_completed} completions
              </div>
            </div>
          )}
          {stats.longestStreakTask && stats.longestStreakTask.current_streak > 0 && (
            <div className="performer-card">
              <h3>🔥 Longest Streak</h3>
              <div className="performer-name">{stats.longestStreakTask.title}</div>
              <div className="performer-stat">
                {stats.longestStreakTask.current_streak} in a row
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Details Table */}
      <div className="stats-section">
        <h2>Task Performance Details</h2>
        <div className="task-details-table">
          <table>
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Timeline</th>
                <th>Completions</th>
                <th>Avg Time</th>
                <th>Current Streak</th>
                <th>Best Streak</th>
              </tr>
            </thead>
            <tbody>
              {tasks
                .filter(t => t.times_completed > 0)
                .sort((a, b) => b.times_completed - a.times_completed)
                .map(task => (
                  <tr key={task.task_id}>
                    <td>{task.title}</td>
                    <td>{task.repeat_timeline}</td>
                    <td>{task.times_completed}</td>
                    <td>
                      {task.average_completion_time 
                        ? `${Math.round(task.average_completion_time)} min` 
                        : 'N/A'}
                    </td>
                    <td>{task.current_streak || 0}</td>
                    <td>{task.best_streak || 0}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {tasks.filter(t => t.times_completed > 0).length === 0 && (
            <div className="no-data">No completed tasks yet. Start completing tasks to see statistics!</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Statistics;
