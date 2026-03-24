import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import BookListPage from './pages/BookListPage';
import BookDetailPage from './pages/BookDetailPage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';
import UserDetailPage from './pages/UserDetailPage';
import LibrarianDashboard from './pages/LibrarianDashboard'; // 👈 thêm
import TransactionPage from './pages/TransactionPage';
import StudentDashboard from './pages/StudentDashboard';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const AppLayout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/unauthorized'].includes(location.pathname);
  const [searchQuery, setSearchQuery] = useState('');

  if (isAuthPage) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  return (
    <div className="flex bg-surface min-h-screen font-body text-on-surface">
      <Sidebar />
      <div className="flex-1 ml-64 min-h-screen relative flex flex-col">
        <Topbar onSearch={setSearchQuery} />
        <main className="flex-1 pt-16 min-h-screen bg-surface">
          <div className="p-10 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <AppLayout>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
              <Route path="/books" element={<ProtectedRoute><BookListPage /></ProtectedRoute>} />
              <Route path="/books/:id" element={<ProtectedRoute><BookDetailPage /></ProtectedRoute>} />
              <Route path="/loans" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><TransactionPage /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

              {/* Librarian Dashboard */}
              <Route
                path="/librarian"
                element={
                  <ProtectedRoute roles={['admin', 'librarian']}>
                    <LibrarianDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route path="/admin/users" element={<ProtectedRoute roles={['admin', 'librarian']}><AdminUserManagementPage /></ProtectedRoute>} />
              <Route path="/admin/users/:id" element={<ProtectedRoute roles={['admin', 'librarian']}><UserDetailPage /></ProtectedRoute>} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;