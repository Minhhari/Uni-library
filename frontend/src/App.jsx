import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import BookListPage from './pages/BookListPage';
import BookDetailPage from './pages/BookDetailPage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';
import UserDetailPage from './pages/UserDetailPage';
import HomeDashboard from './pages/HomeDashboard';
import RecommendationPage from './pages/RecommendationPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminSystemSettingsPage from './pages/AdminSystemSettingsPage';
import AdminReportsPage from './pages/AdminReportsPage';
import LibrarianDashboard from './pages/LibrarianDashboard';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import StudentNavbar from './components/StudentNavbar';
import TransactionPage from './pages/TransactionPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import LecturerBookRequestPage from './pages/LecturerDashboard';
import LecturerNavbar from './components/LecturerNavbar';
import { useAuth } from './context/AuthContext';
import { TermsModal } from './components';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const AppLayout = ({ children }) => {
  const location = useLocation();
  const { user, showTermsModal, setShowTermsModal } = useAuth();
  const isAuthPage = ['/login', '/register', '/unauthorized'].includes(location.pathname);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (user && ['student', 'lecturer'].includes(user.role) && !user.hasAcceptedTerms && location.pathname === '/') {
      setShowTermsModal(true);
    }
  }, [user, location.pathname, setShowTermsModal]);

  if (isAuthPage) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  const isStudent = user?.role === 'student' || !user?.role || user?.role === 'user';
  const isLecturer = user?.role === 'lecturer';

  if (isStudent) {
    return (
      <div className="bg-surface min-h-screen font-body text-on-surface">
        <StudentNavbar />
        <main className="pt-20 min-h-screen">
          <div className="p-10 max-w-[1400px] mx-auto">
            {children}
          </div>
          <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
        </main>
      </div>
    );
  }

  if (isLecturer) {
    return (
      <div className="bg-surface min-h-screen font-body text-on-surface">
        <LecturerNavbar />
        <main className="pt-20 min-h-screen">
          <div className="p-10 max-w-[1400px] mx-auto">
            {children}
          </div>
          <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
        </main>
      </div>
    );
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

const DashboardSelector = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboardPage />;
  if (user?.role === 'librarian') return <LibrarianDashboard />;
  if (user?.role === 'lecturer') return <HomeDashboard />;
  return <HomeDashboard />;
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
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardSelector />
                </ProtectedRoute>
              } />
              <Route path="/books" element={<ProtectedRoute><BookListPage /></ProtectedRoute>} />
              <Route path="/books/:id" element={<ProtectedRoute><BookDetailPage /></ProtectedRoute>} />
              <Route path="/recommendations" element={<ProtectedRoute><RecommendationPage /></ProtectedRoute>} />

              {/* ⚠️ NOTE: HomePage chưa import → cần fix nếu dùng */}
              <Route path="/my-activity" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><TransactionPage /></ProtectedRoute>} />
              <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/book-requests" element={<ProtectedRoute><LecturerBookRequestPage /></ProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><AdminUserManagementPage /></ProtectedRoute>} />
              <Route path="/admin/users/:id" element={<ProtectedRoute><UserDetailPage /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute><AdminSystemSettingsPage /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute><AdminReportsPage /></ProtectedRoute>} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </Router>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;