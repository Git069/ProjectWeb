import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (username, password) =>
    api.post('/login/', { username, password }),

  register: (userData) =>
    api.post('/register/', userData),

  logout: () =>
    api.post('/logout/'),
};

// User endpoints
export const userAPI = {
  getCurrentUser: () =>
    api.get('/users/me/'),

  updateProfile: (profileData) =>
    api.patch('/users/me/', profileData),
};

// Dashboard endpoint
export const dashboardAPI = {
  getDashboard: () =>
    api.get('/dashboard/'),
};

// jobs endpoints
export const jobsAPI = {
  getJobs: () =>
    api.get('/jobs/'),

  getJob: (id) =>
    api.get(`/jobs/${id}/`),

  createJob: (jobData) =>
    api.post('/jobs/', jobData),

  updateJob: (id, jobData) =>
    api.patch(`/jobs/${id}/`, jobData),

  deleteJob: (id) =>
    api.delete(`/jobs/${id}/`),

  getMatches: (id) =>
    api.get(`/jobs/${id}/matches/`),
};

// Applications endpoints
export const applicationsAPI = {
  getApplications: () =>
    api.get('/applications/'),

  getApplication: (id) =>
    api.get(`/applications/${id}/`),

  createApplication: (applicationData) =>
    api.post('/applications/', applicationData),

  acceptApplication: (id) =>
    api.post(`/applications/${id}/accept/`),

  rejectApplication: (id) =>
    api.post(`/applications/${id}/reject/`),
};

// chat endpoints
export const chatAPI = {
  getChatRooms: () =>
    api.get('/chat-rooms/'),

  getChatRoom: (id) =>
    api.get(`/chat-rooms/${id}/`),

  getOrCreateChatRoom: (jobId, craftsmanId) =>
    api.post('/chat-rooms/get_or_create/', {
      job_id: jobId,
      craftsman_id: craftsmanId,
    }),

  getMessages: (chatRoomId) =>
    api.get(`/messages/?chat_room=${chatRoomId}`),

  sendMessage: (chatRoomId, content) =>
    api.post('/messages/', {
      chat_room: chatRoomId,
      content: content,
    }),

  markAsRead: (chatRoomId) =>
    api.post('/messages/mark_as_read/', {
      chat_room_id: chatRoomId,
    }),
};

export default api;
