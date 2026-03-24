import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally - auto logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lms_token');
      localStorage.removeItem('lms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth APIs ───────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (credential) => api.post('/auth/google', { credential }),
};

// ─── User APIs ───────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  editUser: (id, data) => api.put(`/users/${id}`, data),
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  toggleUserStatus: (id) => api.put(`/users/${id}/status`),
  deleteUser: (id) => api.delete(`/users/${id}`),
  createLibrarian: (data) => api.post('/users/librarian', data),
};

// ─── Borrow APIs ─────────────────────────────────────────
export const borrowAPI = {
  // Student
  requestBorrow: (bookId) => api.post('/borrow/request', { bookId }),
  getMyBooks: () => api.get('/borrow/my-books'),

  // Librarian / Admin
  getAllBorrows: () => api.get('/borrow/all'),
  approveBorrow: (id) => api.put(`/borrow/approve/${id}`),
  rejectBorrow: (id) => api.put(`/borrow/reject/${id}`),
  returnBook: (id, bookCondition) => api.put(`/borrow/return/${id}`, { bookCondition }),
};

// ─── Fine APIs ───────────────────────────────────────────
export const fineAPI = {
  getMyFines: () => api.get('/fines/my'),
  getAllFines: () => api.get('/fines/all'),
  getFineByBorrow: (borrowId) => api.get(`/fines/borrow/${borrowId}`),
};

export default api;