import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

const AdminUserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const { user: currentUser } = useAuth();
    const isLibrarian = currentUser?.role === 'librarian';
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const LIMIT = 10;

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = { page, limit: LIMIT };
            if (search.trim()) params.search = search.trim();
            if (roleFilter) params.role = roleFilter;
            if (statusFilter !== '') params.isActive = statusFilter;
            const { data } = await userAPI.getAllUsers(params);
            if (data.success) {
                let fetchedUsers = data.users || data.data || [];
                // Librarian cannot see Admins
                if (isLibrarian) {
                    fetchedUsers = fetchedUsers.filter(u => u.role !== 'admin');
                }
                setUsers(fetchedUsers);
                setTotalPages(data.totalPages || Math.ceil((data.total || 0) / LIMIT));
                setTotal(data.total || 0);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải danh sách người dùng.');
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter, statusFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            await userAPI.toggleUserStatus(userId);
            setUsers((prev) =>
                prev.map((u) => (u._id === userId ? { ...u, isActive: !currentStatus } : u))
            );
            setSuccessMsg('Đã cập nhật trạng thái người dùng.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể cập nhật trạng thái.');
        }
    };

    const handleCreateLibrarian = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        setCreateError('');
        try {
            await userAPI.createLibrarian(createForm);
            setSuccessMsg('Đã tạo tài khoản thủ thư thành công!');
            setShowCreateModal(false);
            setCreateForm({ name: '', email: '', password: '' });
            fetchUsers();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            setCreateError(err.response?.data?.message || 'Không thể tạo tài khoản thủ thư.');
        } finally {
            setCreateLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Quản lý người dùng</h1>
                    <p className="text-on-surface-variant text-lg mt-1">
                        Quản lý tất cả tài khoản — tổng cộng {total} người dùng
                    </p>
                </div>
                {!isLibrarian && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        Thêm thủ thư
                    </button>
                )}
            </div>

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

            {/* Filters */}
            <div className="bg-white p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-xl">search</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            value={search}
                            onChange={handleSearch}
                            className="w-full pl-12 pr-4 py-3 bg-surface-container-low rounded-xl border border-transparent focus:border-primary/40 focus:outline-none text-sm text-on-surface placeholder:text-on-surface-variant/40 transition-all"
                        />
                    </div>
                    {/* Role Filter */}
                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        className="px-4 py-3 bg-surface-container-low rounded-xl border border-transparent focus:border-primary/40 focus:outline-none text-sm text-on-surface transition-all min-w-[140px]"
                    >
                        <option value="">Tất cả vai trò</option>
                        {!isLibrarian && <option value="admin">Quản trị viên</option>}
                        {!isLibrarian && <option value="librarian">Thủ thư</option>}
                        <option value="lecturer">Giảng viên</option>
                        <option value="student">Sinh viên</option>
                    </select>
                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-4 py-3 bg-surface-container-low rounded-xl border border-transparent focus:border-primary/40 focus:outline-none text-sm text-on-surface transition-all min-w-[140px]"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="true">Đang hoạt động</option>
                        <option value="false">Đã khóa</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-24 text-on-surface-variant">
                        <span className="material-symbols-outlined animate-spin text-4xl mr-3 text-primary">progress_activity</span>
                        <span className="text-lg font-medium">Đang tải danh sách...</span>
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant gap-4">
                        <span className="material-symbols-outlined text-6xl opacity-30">group_off</span>
                        <p className="text-lg font-medium">Không tìm thấy người dùng</p>
                        <p className="text-sm opacity-60">Hãy thử điều chỉnh tìm kiếm hoặc bộ lọc</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                                    <th className="text-left px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Người dùng</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Vai trò</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Trạng thái</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Ngày tham gia</th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/5">
                                {users.map((u) => (
                                    <tr key={u._id} className="hover:bg-surface-container-low/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 overflow-hidden border border-primary/10">
                                                    {u.avatar ? (
                                                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        u.name?.[0]?.toUpperCase()
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-on-surface text-sm truncate">{u.name}</p>
                                                    <p className="text-on-surface-variant text-xs truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>
                                                {ROLE_LABELS[u.role] || u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                                {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                                            {new Date(u.createdAt).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/admin/users/${u._id}`}
                                                    className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                                                    title="Xem chi tiết"
                                                >
                                                    <span className="material-symbols-outlined text-lg">visibility</span>
                                                </Link>
                                                {!isLibrarian && (
                                                    <button
                                                        onClick={() => handleToggleStatus(u._id, u.isActive)}
                                                        className={`p-2 rounded-xl transition-all ${u.isActive
                                                            ? 'text-on-surface-variant hover:text-error hover:bg-error/10'
                                                            : 'text-on-surface-variant hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                        title={u.isActive ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
                                                    >
                                                        <span className="material-symbols-outlined text-lg">
                                                            {u.isActive ? 'block' : 'check_circle'}
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10">
                        <p className="text-sm text-on-surface-variant">
                            Trang <span className="font-bold text-on-surface">{page}</span> / <span className="font-bold text-on-surface">{totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = page <= 3 ? i + 1 : page - 2 + i;
                                if (p < 1 || p > totalPages) return null;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${p === page ? 'bg-primary text-white shadow-md' : 'bg-surface-container-low text-on-surface-variant hover:bg-primary/10 hover:text-primary'}`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Librarian Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-extrabold tracking-tight">Thêm thủ thư</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-xl hover:bg-surface-container-low transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {createError && (
                            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-xl text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">error</span>
                                {createError}
                            </div>
                        )}
                        <form onSubmit={handleCreateLibrarian} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Họ và tên"
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-transparent focus:border-primary/40 focus:outline-none text-sm transition-all"
                                    required
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Địa chỉ Email"
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-transparent focus:border-primary/40 focus:outline-none text-sm transition-all"
                                    required
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="Mật khẩu (ít nhất 6 ký tự)"
                                    value={createForm.password}
                                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                    className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-transparent focus:border-primary/40 focus:outline-none text-sm transition-all"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60"
                                >
                                    {createLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminUserManagementPage;
