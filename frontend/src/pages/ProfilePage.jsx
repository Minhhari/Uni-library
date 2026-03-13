import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';

const ROLE_LABELS = {
  admin: '⚙️ Admin',
  librarian: '📖 Thủ thư',
  lecturer: '👨‍🏫 Giảng viên',
  student: '🎓 Sinh viên',
  guest: '👤 Khách',
};

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmNew: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { data } = await userAPI.updateProfile(form);
      if (data.success) {
        updateUser(data.user);
        setMessage('Cập nhật thông tin thành công!');
        setEditMode(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmNew) {
      return setError('Mật khẩu mới không khớp.');
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { data } = await userAPI.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      if (data.success) {
        setMessage('Đổi mật khẩu thành công!');
        setPwForm({ currentPassword: '', newPassword: '', confirmNew: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Avatar & basic info */}
        <div className="profile-header">
          <div className="avatar-wrapper">
            {user.avatar ? (
              <img src={user.avatar} alt="avatar" className="avatar" />
            ) : (
              <div className="avatar-placeholder">{user.name?.[0]?.toUpperCase()}</div>
            )}
          </div>
          <div>
            <h2>{user.name}</h2>
            <span className="role-badge">{ROLE_LABELS[user.role] || user.role}</span>
            <p className="email-text">{user.email}</p>
          </div>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Edit Profile Form */}
        <div className="profile-section">
          <div className="section-header">
            <h3>Thông tin cá nhân</h3>
            {!editMode && (
              <button className="btn btn-outline" onClick={() => setEditMode(true)}>
                Chỉnh sửa
              </button>
            )}
          </div>

          {editMode ? (
            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="form-group">
                <label>Họ và tên</label>
                <input name="name" value={form.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="0123456789" />
              </div>
              <div className="form-group">
                <label>Khoa / Bộ môn</label>
                <input name="department" value={form.department} onChange={handleChange} placeholder="Công nghệ thông tin" />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setEditMode(false)}>
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <div className="info-grid">
              <div><span>Số điện thoại:</span> {user.phone || '—'}</div>
              <div><span>Khoa / Bộ môn:</span> {user.department || '—'}</div>
              <div><span>Tham gia:</span> {new Date(user.createdAt).toLocaleDateString('vi-VN')}</div>
            </div>
          )}
        </div>

        {/* Change Password (only for non-Google accounts) */}
        {!user.isGoogleAccount && (
          <div className="profile-section">
            <h3>Đổi mật khẩu</h3>
            <form onSubmit={handleChangePassword} className="profile-form">
              <div className="form-group">
                <label>Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={pwForm.confirmNew}
                  onChange={(e) => setPwForm({ ...pwForm, confirmNew: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                Đổi mật khẩu
              </button>
            </form>
          </div>
        )}

        <div className="profile-section">
          <button className="btn btn-danger" onClick={logout}>Đăng xuất</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
