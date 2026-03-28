import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { userAPI } from '../services/api';

const ROLE_LABELS = {
    admin: 'Quản trị viên',
    librarian: 'Thủ thư',
    lecturer: 'Giảng viên',
    student: 'Sinh viên',
};

const ROLE_COLORS = {
    admin: 'bg-red-100 text-red-700',
    librarian: 'bg-purple-100 text-purple-700',
    lecturer: 'bg-blue-100 text-blue-700',
    student: 'bg-emerald-100 text-emerald-700',
};

const UserDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ name: '', role: '' });
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            try {
                const { data } = await userAPI.getUserById(id);
                if (data.success) {
                    setUser(data.user);
                    setForm({ name: data.user.name, role: data.user.role });
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Không thể tải thông tin người dùng.');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const { data } = await userAPI.editUser(id, form);
            if (data.success) {
                setUser(data.user);
                setEditMode(false);
                setSuccessMsg('Cập nhật người dùng thành công!');
                setTimeout(() => setSuccessMsg(''), 4000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Cập nhật người dùng thất bại.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async () => {
        try {
            await userAPI.toggleUserStatus(id);
            const newStatus = !user.isActive;
            setUser((prev) => ({ ...prev, isActive: newStatus }));
            setSuccessMsg(`Tài khoản đã được ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} thành công.`);
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Cập nhật trạng thái thất bại.');
        }
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            await userAPI.deleteUser(id);
            navigate('/admin/users', { state: { message: 'Đã xóa người dùng thành công.' } });
        } catch (err) {
            setError(err.response?.data?.message || 'Xóa người dùng thất bại.');
            setShowDeleteConfirm(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-4xl mr-3 text-primary">progress_activity</span>
                <span className="text-lg font-medium">Đang tải thông tin người dùng...</span>
            </div>
        );
    }

    if (error && !user) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <span className="material-symbols-outlined text-6xl text-error opacity-50">person_off</span>
                <p className="text-lg font-bold text-on-surface">Không tìm thấy người dùng</p>
                <p className="text-sm text-on-surface-variant">{error}</p>
                <Link to="/admin/users" className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all">
                    Quay lại danh sách người dùng
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Link to="/admin/users" className="hover:text-primary transition-colors font-medium">Quản lý người dùng</Link>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
                <span className="text-on-surface font-semibold truncate">{user?.name}</span>
            </nav>

            {/* Alerts */}
            {successMsg && (
                <div className="p-4 bg-primary-container/20 text-primary rounded-2xl text-sm font-medium flex items-center gap-2 border border-primary/20">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    {successMsg}
                </div>
            )}
            {error && (
                <div className="p-4 bg-error-container text-on-error-container rounded-2xl text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Avatar + Quick Info */}
                <div className="space-y-4">
                    <div className="bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-sm text-center">
                        <div className="relative inline-block mb-6">
                            <div className="w-28 h-28 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-black text-4xl border-4 border-white shadow-xl overflow-hidden">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    user?.name?.[0]?.toUpperCase()
                                )}
                            </div>
                            <span className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${user?.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        </div>
                        <h2 className="text-xl font-bold text-on-surface mb-1">{user?.name}</h2>
                        <p className="text-on-surface-variant text-sm mb-4 break-all">{user?.email}</p>
                        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${ROLE_COLORS[user?.role]}`}>
                            {ROLE_LABELS[user?.role] || user?.role}
                        </span>
                    </div>

                    {/* Meta Info */}
                    <div className="bg-surface-container-low p-5 rounded-2xl text-xs text-on-surface-variant space-y-3">
                        <div className="flex justify-between">
                            <span className="font-bold uppercase tracking-widest">ID tài khoản</span>
                            <span className="font-mono text-on-surface">{user?._id?.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold uppercase tracking-widest">Ngày tham gia</span>
                            <span className="text-on-surface">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold uppercase tracking-widest">Đăng nhập cuối</span>
                            <span className="text-on-surface">{user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Chưa từng'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold uppercase tracking-widest">Google</span>
                            <span className="text-on-surface">{user?.isGoogleAccount ? 'Có' : 'Không'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold uppercase tracking-widest">Trạng thái</span>
                            <span className={`font-bold ${user?.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                                {user?.isActive ? 'Hoạt động' : 'Bị vô hiệu hóa'}
                            </span>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                        <button
                            onClick={handleToggleStatus}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${user?.isActive
                                ? 'bg-error/10 text-error hover:bg-error/20'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">{user?.isActive ? 'block' : 'check_circle'}</span>
                            {user?.isActive ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-error/5 text-error font-bold text-sm hover:bg-error/10 transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                            Xóa người dùng
                        </button>
                    </div>
                </div>

                {/* Right: Edit Form */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">manage_accounts</span>
                                Chi tiết tài khoản
                            </h3>
                            {!editMode && (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="px-5 py-2 bg-surface-container-high text-primary rounded-xl font-bold text-sm hover:bg-primary/10 transition-colors"
                                >
                                    Chỉnh sửa
                                </button>
                            )}
                        </div>

                        {editMode ? (
                            <form onSubmit={handleSave} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Họ và tên</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-transparent focus:border-primary/40 focus:outline-none text-sm transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Vai trò</label>
                                    <select
                                        value={form.role}
                                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                                        className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-transparent focus:border-primary/40 focus:outline-none text-sm transition-all"
                                    >
                                        <option value="student">Sinh viên</option>
                                        <option value="lecturer">Giảng viên</option>
                                        <option value="librarian">Thủ thư</option>
                                        <option value="admin">Quản trị viên</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60"
                                    >
                                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEditMode(false); setForm({ name: user.name, role: user.role }); }}
                                        className="px-8 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-colors"
                                    >
                                        Hủy bỏ
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { label: 'Họ và tên', value: user?.name },
                                    { label: 'Email', value: user?.email },
                                    { label: 'Vai trò', value: ROLE_LABELS[user?.role] || user?.role },
                                    { label: 'Số điện thoại', value: user?.phone || 'Chưa cung cấp' },
                                    { label: 'Khoa/Phòng ban', value: user?.department || 'Chưa cung cấp' },
                                    { label: 'Mã số sinh viên', value: user?.studentId || 'Chưa cung cấp' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="space-y-1">
                                        <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">{label}</p>
                                        <p className="text-on-surface font-medium text-sm">{value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Security Info */}
                    <div className="bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-tertiary">security</span>
                            Thông tin bảo mật
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Số lần đăng nhập sai</p>
                                <p className={`font-bold text-sm ${user?.loginAttempts > 0 ? 'text-error' : 'text-emerald-600'}`}>
                                    {user?.loginAttempts || 0} lần đăng nhập thất bại
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Khóa tài khoản</p>
                                <p className={`font-bold text-sm ${user?.lockUntil && new Date(user.lockUntil) > new Date() ? 'text-error' : 'text-emerald-600'}`}>
                                    {user?.lockUntil && new Date(user.lockUntil) > new Date()
                                        ? `Bị khóa đến ${new Date(user.lockUntil).toLocaleTimeString()}`
                                        : 'Không bị khóa'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in fade-in zoom-in-95 duration-200 text-center">
                        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-error text-3xl">warning</span>
                        </div>
                        <h2 className="text-xl font-extrabold mb-2">Xóa người dùng?</h2>
                        <p className="text-on-surface-variant text-sm mb-8">
                            Bạn có chắc chắn muốn xóa <strong>{user?.name}</strong>? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteLoading}
                                className="flex-1 py-3 bg-error text-white rounded-xl font-bold text-sm hover:bg-error/90 active:scale-95 transition-all disabled:opacity-60"
                            >
                                {deleteLoading ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDetailPage;
