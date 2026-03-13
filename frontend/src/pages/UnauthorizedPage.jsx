import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => (
  <div className="error-page">
    <div className="error-card">
      <span className="error-icon">🚫</span>
      <h1>Không có quyền truy cập</h1>
      <p>Bạn không có quyền xem trang này.</p>
      <Link to="/" className="btn btn-primary">Về trang chủ</Link>
    </div>
  </div>
);

export default UnauthorizedPage;
