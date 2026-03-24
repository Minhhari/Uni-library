import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

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
  // Current user
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),

  // Admin - User Management
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  editUser: (id, data) => api.put(`/users/${id}`, data),
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  toggleUserStatus: (id) => api.put(`/users/${id}/status`),
  deleteUser: (id) => api.delete(`/users/${id}`),
  createLibrarian: (data) => api.post('/users/librarian', data),
};

// ─── Book APIs ───────────────────────────────────
export const bookAPI = {
  // Get books with search and filter
  getBooks: (params) => api.get('/books', { params }),
  
  // Get book details
  getBookById: (id) => api.get(`/books/${id}`),
  
  // Add new book (admin/librarian)
  addBook: (data) => api.post('/books', data),
  
  // Update book (admin/librarian)
  updateBook: (id, data) => api.put(`/books/${id}`, data),
  
  // Delete book (admin only)
  deleteBook: (id) => api.delete(`/books/${id}`),
  
  // Update book quantity (admin/librarian)
  updateQuantity: (id, quantity) => api.put(`/books/${id}/quantity`, { quantity }),
};

// ─── Recommendation APIs ───────────────────────────────────
export const recommendationAPI = {
  // Comprehensive recommendations
  getRecommendations: (params) => api.get('/recommendations', { params }),
  
  // Personalized recommendations
  getPersonalized: (params) => api.get('/recommendations/personalized', { params }),
  
  // Popular books
  getPopular: (params) => api.get('/recommendations/popular', { params }),
  
  // Collaborative recommendations
  getCollaborative: (params) => api.get('/recommendations/collaborative', { params }),
  
  // Semester-based recommendations
  getSemester: (params) => api.get('/recommendations/semester', { params }),
  
  // Academic progress recommendations
  getAcademic: (params) => api.get('/recommendations/academic', { params }),
  
  // Semester information
  getSemesterInfo: () => api.get('/recommendations/semester/info'),
};

// ─── Borrow APIs ───────────────────────────────────
export const borrowAPI = {
  // Borrow request
  requestBorrow: (data) => api.post('/borrow/request', data),
  
  // Get my borrowed books
  getMyBooks: (params) => api.get('/borrow/my-books', { params }),
  
  // Get all borrow records (admin/librarian)
  getAllBorrows: (params) => api.get('/borrow/all', { params }),
  
  // Approve borrow request
  approveBorrow: (id) => api.put(`/borrow/approve/${id}`),
  
  // Reject borrow request
  rejectBorrow: (id) => api.put(`/borrow/reject/${id}`),
  
  // Return book
  returnBook: (id) => api.put(`/borrow/return/${id}`),
};

export default api;
