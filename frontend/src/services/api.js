import axios from 'axios';

// ─── Base Config ─────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Interceptors ────────────────────────────────────────
// Attach JWT token
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

// Handle 401 (auto logout)
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

// ─── Book APIs ───────────────────────────────────────────
export const bookAPI = {
  getBooks: (params) => api.get('/books', { params }),
  getCategories: () => api.get('/books/categories'),
  getBookById: (id) => api.get(`/books/${id}`),
  addBook: (data) => api.post('/books', data),
  updateBook: (id, data) => api.put(`/books/${id}`, data),
  deleteBook: (id) => api.delete(`/books/${id}`),
  updateQuantity: (id, quantity) =>
    api.put(`/books/${id}/quantity`, { quantity }),
};

// ─── Recommendation APIs ─────────────────────────────────
export const recommendationAPI = {
  getRecommendations: (params) =>
    api.get('/recommendations', { params }),

  getPersonalized: (params) =>
    api.get('/recommendations/personalized', { params }),

  getPopular: (params) =>
    api.get('/recommendations/popular', { params }),

  getCollaborative: (params) =>
    api.get('/recommendations/collaborative', { params }),

  getSemester: (params) =>
    api.get('/recommendations/semester', { params }),

  getAcademic: (params) =>
    api.get('/recommendations/academic', { params }),

  getSemesterInfo: () =>
    api.get('/recommendations/semester/info'),
};

// ─── Borrow APIs ─────────────────────────────────────────
export const borrowAPI = {
  requestBorrow: (data) => api.post('/borrow/request', data),
  getMyBooks: (params) => api.get('/borrow/my-books', { params }),
  getAllBorrows: (params) => api.get('/borrow/all', { params }),
  approveBorrow: (id) => api.put(`/borrow/approve/${id}`),
  rejectBorrow: (id) => api.put(`/borrow/reject/${id}`),
  returnBook: (id) => api.put(`/borrow/return/${id}`),
};

// ─── Fine APIs ───────────────────────────────────────────
export const fineAPI = {
  getMyFines: () => api.get('/fines/my'),
  getAllFines: () => api.get('/fines/all'),
  getFineByBorrow: (borrowId) =>
    api.get(`/fines/borrow/${borrowId}`),
};

// ─── Payment APIs ────────────────────────────────────────
export const paymentAPI = {
  createPayment: (fineId) =>
    api.post('/payments/create', { fineId }),

  verifyPayment: (orderCode) =>
    api.get(`/payments/verify/${orderCode}`),

  getPaymentStatus: (orderCode) =>
    api.get(`/payments/${orderCode}`),
};


// ─── Admin APIs ──────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key, value) => api.put(`/admin/settings/${key}`, { value }),
};

// ─── Book Request APIs ───────────────────────────────────
export const bookRequestAPI = {
  createRequest: (data) => api.post('/book-requests', data),
  uploadExcel: (formData) => api.post('/book-requests/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyRequests: () => api.get('/book-requests/my-requests'),
  getAllRequests: (params) => api.get('/book-requests', { params }),
  updateStatus: (id, status, note) => api.put(`/book-requests/${id}/status`, { status, note })
};

// ─── Notification APIs ───────────────────────────────────
export const notificationAPI = {
  getMyNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`)
};

// ─── Export ──────────────────────────────────────────────
export default api;