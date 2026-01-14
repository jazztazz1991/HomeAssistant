import api from './api';

const taskService = {
  // Get all tasks
  getAllTasks: async () => {
    const response = await api.get('/tasks');
    return response.data.tasks;
  },

  // Get tasks with urgency color coding
  getTasksWithUrgency: async () => {
    const response = await api.get('/tasks/urgency');
    return response.data.tasks;
  },

  // Get due tasks
  getDueTasks: async () => {
    const response = await api.get('/tasks/due');
    return response.data.tasks;
  },

  // Get single task
  getTask: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data.task;
  },

  // Create new task
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  // Update task
  updateTask: async (taskId, updates) => {
    const response = await api.put(`/tasks/${taskId}`, updates);
    return response.data;
  },

  // Complete task
  completeTask: async (taskId, completionData = {}) => {
    const response = await api.post(`/tasks/${taskId}/complete`, completionData);
    return response.data;
  },

  // Get task statistics
  getTaskStatistics: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/statistics`);
    return response.data.statistics;
  },

  // Get task completion history
  getTaskHistory: async (taskId, limit = 50) => {
    const response = await api.get(`/tasks/${taskId}/history?limit=${limit}`);
    return response.data.history;
  },

  // Get overall completion stats
  getCompletionStats: async () => {
    const response = await api.get('/tasks/stats/completion-rate');
    return response.data.stats;
  },

  // Delete task
  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  // Subtask operations
  getSubtasks: async (taskId) => {
    const response = await api.get(`/subtasks/task/${taskId}`);
    return response.data;
  },

  createSubtask: async (taskId, subtaskData) => {
    const response = await api.post(`/subtasks/task/${taskId}`, subtaskData);
    return response.data;
  },

  toggleSubtask: async (subtaskId) => {
    const response = await api.patch(`/subtasks/${subtaskId}/toggle`);
    return response.data;
  },

  updateSubtask: async (subtaskId, title) => {
    const response = await api.put(`/subtasks/${subtaskId}`, { title });
    return response.data;
  },

  deleteSubtask: async (subtaskId) => {
    const response = await api.delete(`/subtasks/${subtaskId}`);
    return response.data;
  },

  getSubtaskStats: async (taskId) => {
    const response = await api.get(`/subtasks/task/${taskId}/stats`);
    return response.data;
  }
};

export default taskService;
