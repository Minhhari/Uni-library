import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  admin: 'Admin',
  librarian: 'Thủ thư',
  lecturer: 'Giảng viên',
  student: 'Sinh viên',
  guest: 'Khách',
};

const ROLE_COLORS = {
  admin: '#ef4444',
  librarian: '#8b5cf6',
  lecturer: '#f59e0b',
  student: '#3b82f6',
  guest: '#6b7280',
};

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">📚</span>
          <span className="brand-text">LMS</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar-links">
          {isAuthenticated && (
            <>
              <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                Trang chủ
              </Link>
              <Link to="/books" className={`nav-link ${isActive('/books') ? 'active' : ''}`}>
                Sách
              </Link>
              {(user?.role === 'lecturer' || user?.role === 'admin' || user?.role === 'librarian') && (
                <Link to="/proposals" className={`nav-link ${isActive('/proposals') ? 'active' : ''}`}>
                  Đề xuất sách
                </Link>
              )}
              {(user?.role === 'admin' || user?.role === 'librarian') && (
                <Link to="/manage" className={`nav-link ${isActive('/manage') ? 'active' : ''}`}>
                  Quản lý
                </Link>
              )}
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="navbar-user">
          {isAuthenticated ? (
            <div className="user-dropdown">
              <button
                className="user-trigger"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar" className="nav-avatar" />
                ) : (
                  <div className="nav-avatar-placeholder">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="user-info">
                  <span className="user-name">{user?.name}</span>
                  <span
                    className="user-role-badge"
                    style={{ backgroundColor: ROLE_COLORS[user?.role] }}
                  >
                    {ROLE_LABELS[user?.role]}
                  </span>
                </div>
                <span className="dropdown-arrow">{menuOpen ? '▲' : '▼'}</span>
              </button>

              {menuOpen && (
                <div className="dropdown-menu">
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    👤 Hồ sơ cá nhân
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="dropdown-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      ⚙️ Quản trị hệ thống
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline btn-sm">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
