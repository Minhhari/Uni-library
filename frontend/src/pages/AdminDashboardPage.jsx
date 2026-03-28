import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
    {
        to: '/admin/users',
        icon: 'group',
        title: 'Quản lý người dùng',
        description: 'Xem, tìm kiếm, phân quyền, khóa/mở tài khoản Sinh viên & Giảng viên. Tạo tài khoản Thủ thư mới.',
        gradient: 'from-indigo-500 to-violet-600',
        bg: 'bg-indigo-50',
        border: 'border-indigo-100',
        accent: 'text-indigo-600',
        shadow: 'shadow-indigo-100',
    },
    {
        to: '/admin/settings',
        icon: 'tune',
        title: 'Cài đặt hệ thống',
        description: 'Cấu hình số ngày mượn tối đa, mức phí phạt quá hạn, giới hạn đặt trước và các thông số khác.',
        gradient: 'from-amber-400 to-orange-500',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        accent: 'text-amber-600',
        shadow: 'shadow-amber-100',
    },
    {
        to: '/admin/reports',
        icon: 'analytics',
        title: 'Báo cáo & Thống kê',
        description: 'Bảng điều khiển tổng quan với thống kê tài khoản, biểu đồ mượn trả và tóm tắt doanh thu tiền phạt.',
        gradient: 'from-emerald-500 to-teal-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
        accent: 'text-emerald-600',
        shadow: 'shadow-emerald-100',
    },
];

const AdminDashboardPage = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* ── Hero Banner ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-10 text-white shadow-2xl">
                <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined text-white text-xl">admin_panel_settings</span>
                            </div>
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Trung tâm Quản trị hệ thống</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight leading-snug">
                            Chào mừng quay trở lại,{' '}
                            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                                {user?.name?.split(' ').slice(-1)[0] || 'Quản trị viên'}
                            </span>
                        </h1>
                        <p className="text-slate-400 mt-3 max-w-lg text-sm leading-relaxed">
                            Quản lý tài khoản người dùng, cấu hình thông số hệ thống và theo dõi hiệu suất thư viện — tất cả ở một nơi.
                        </p>
                    </div>
                    <div className="hidden md:flex flex-shrink-0 w-24 h-24 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm items-center justify-center">
                        <span className="material-symbols-outlined text-white/70 text-5xl">shield_person</span>
                    </div>
                </div>
            </div>

            {/* ── Feature Cards ── */}
            <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-5">Truy cập nhanh</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {FEATURES.map((f) => (
                        <Link
                            key={f.to}
                            to={f.to}
                            className={`group relative overflow-hidden ${f.bg} border ${f.border} rounded-3xl p-7 flex flex-col gap-5 hover:shadow-xl ${f.shadow} transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]`}
                        >
                            {/* Glow effect */}
                            <div className={`absolute -top-6 -right-6 w-32 h-32 rounded-full bg-gradient-to-br ${f.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />

                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                                <span className="material-symbols-outlined text-white text-2xl">{f.icon}</span>
                            </div>

                            {/* Text */}
                            <div className="flex-1">
                                <p className="text-lg font-extrabold text-on-surface tracking-tight">{f.title}</p>
                                <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{f.description}</p>
                            </div>

                            {/* CTA */}
                            <div className={`flex items-center gap-1.5 text-sm font-bold ${f.accent} group-hover:gap-3 transition-all duration-200`}>
                                Truy cập
                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
