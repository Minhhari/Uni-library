import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';

const ROLE_LABELS = {
  admin: 'Admin',
  librarian: 'Librarian',
  lecturer: 'Lecturer',
  student: 'Student',
  guest: 'Guest',
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
        setMessage('Profile updated successfully!');
        setEditMode(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmNew) {
      return setError('Passwords do not match.');
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
        setMessage('Password changed successfully!');
        setPwForm({ currentPassword: '', newPassword: '', confirmNew: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Change password failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Account Settings</h1>
        <p className="text-on-surface-variant text-lg">Manage your profile and security preferences</p>
      </header>

      {message && (
        <div className="p-4 bg-primary-container/20 text-primary rounded-2xl text-sm font-medium flex items-center gap-2 border border-primary/20">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          {message}
        </div>
      )}
      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-2xl text-sm font-medium flex items-center gap-2 border border-error/20">
          <span className="material-symbols-outlined text-lg">error</span>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: Avatar & Role */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/10 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-black text-4xl border-4 border-white shadow-xl overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name?.[0]?.toUpperCase()
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-lg">photo_camera</span>
              </button>
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-1">{user.name}</h2>
            <p className="text-on-surface-variant text-sm mb-4">{user.email}</p>
            <span className="px-4 py-1.5 bg-surface-container-high rounded-full text-xs font-bold text-on-surface tracking-widest uppercase">
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </div>

          <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10 text-xs text-on-surface-variant/70 leading-relaxed">
            <p>Member since: {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            <p>Account ID: {user._id?.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Right Col: Forms */}
        <div className="md:col-span-2 space-y-8">
          {/* Profile Form */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Personal Information
              </h3>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-6 py-2 bg-surface-container-high text-primary rounded-xl font-bold text-sm hover:bg-primary/10 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="relative group">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="input-field peer"
                  />
                  <label className="input-label top-1 text-xs text-primary">Full Name</label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Phone Number"
                      className="input-field peer"
                    />
                    <label className="input-label top-1 text-xs text-primary">Phone Number</label>
                  </div>
                  <div className="relative group">
                    <input
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      placeholder="Department"
                      className="input-field peer"
                    />
                    <label className="input-label top-1 text-xs text-primary">Department</label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary py-3 px-8" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-8 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <div className="space-y-1">
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Phone Number</p>
                  <p className="text-on-surface font-medium">{user.phone || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Department</p>
                  <p className="text-on-surface font-medium">{user.department || 'Not provided'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Password Form */}
          {!user.isGoogleAccount && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/10">
              <h3 className="text-xl font-bold flex items-center gap-2 mb-8">
                <span className="material-symbols-outlined text-tertiary">lock</span>
                Security & Password
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="relative group">
                  <input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    placeholder="Current Password"
                    className="input-field peer"
                  />
                  <label className="input-label top-1 text-xs text-primary">Current Password</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <input
                      type="password"
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      placeholder="New Password"
                      className="input-field peer"
                    />
                    <label className="input-label top-1 text-xs text-primary">New Password</label>
                  </div>
                  <div className="relative group">
                    <input
                      type="password"
                      value={pwForm.confirmNew}
                      onChange={(e) => setPwForm({ ...pwForm, confirmNew: e.target.value })}
                      placeholder="Confirm New Password"
                      className="input-field peer"
                    />
                    <label className="input-label top-1 text-xs text-primary">Confirm Password</label>
                  </div>
                </div>
                <button type="submit" className="px-8 py-3 bg-tertiary text-white rounded-xl font-bold text-sm hover:bg-tertiary/90 transition-all shadow-sm hover:shadow-lg active:scale-95 disabled:opacity-50" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
