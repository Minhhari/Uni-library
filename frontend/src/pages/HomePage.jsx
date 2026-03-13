import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_WELCOME = {
  admin: { emoji: '⚙️', title: 'Admin Dashboard', desc: 'Quản lý toàn bộ hệ thống LMS.' },
  librarian: { emoji: '📖', title: 'Thủ thư Dashboard', desc: 'Quản lý sách, mượn trả và đề xuất.' },
  lecturer: { emoji: '👨‍🏫', title: 'Giảng viên Dashboard', desc: 'Đề xuất sách và theo dõi tài liệu học tập.' },
  student: { emoji: '🎓', title: 'Sinh viên Dashboard', desc: 'Tìm kiếm và đọc sách online.' },
  guest: { emoji: '👤', title: 'Khách', desc: 'Xem danh sách sách công khai.' },
};

const QUICK_LINKS = [
  { to: '/books', label: '🔍 Tìm kiếm sách', roles: ['admin', 'librarian', 'lecturer', 'student', 'guest'] },
  { to: '/borrow', label: '📋 Lịch sử mượn sách', roles: ['student', 'lecturer'] },
  { to: '/proposals', label: '📝 Đề xuất sách', roles: ['lecturer', 'admin', 'librarian'] },
  { to: '/manage/books', label: '📚 Quản lý sách', roles: ['admin', 'librarian'] },
  { to: '/manage/users', label: '👥 Quản lý người dùng', roles: ['admin'] },
];

const HomePage = () => {
  const { user } = useAuth();
  const welcome = ROLE_WELCOME[user?.role] || ROLE_WELCOME.student;
  const links = QUICK_LINKS.filter((l) => l.roles.includes(user?.role));

  return (
    <div className="home-container">
      <div className="welcome-banner">
        <span className="welcome-emoji">{welcome.emoji}</span>
        <div>
          <h1>Xin chào, {user?.name}!</h1>
          <h2>{welcome.title}</h2>
          <p>{welcome.desc}</p>
        </div>
      </div>

      <div className="quick-links-grid">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="quick-link-card">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
