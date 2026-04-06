import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area
} from 'recharts';
import * as XLSX from 'xlsx';

const MONTH_NAMES = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const fillMonths = (data) => {
    const map = {};
    data.forEach((d) => { map[`${d._id.year}-${d._id.month}`] = d.count; });
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        result.push({
            monthLabel: MONTH_NAMES[d.getMonth()],
            count: map[key] || 0,
        });
    }
    return result;
};

// ─── KPI Card (large hero number) ────────────────────────────────────────────
const KpiCard = ({ icon, label, value, gradient, textColor, bg }) => (
    <div className={`relative overflow-hidden ${bg} rounded-3xl p-6 flex flex-col gap-3 border border-white/60 shadow-sm hover:shadow-md transition-shadow duration-300`}>
        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
            <span className="material-symbols-outlined text-white text-xl">{icon}</span>
        </div>
        <p className={`text-3xl font-extrabold ${textColor} leading-none`}>{value}</p>
        <p className="text-sm font-semibold text-on-surface-variant leading-tight">{label}</p>
        <div className={`absolute -bottom-5 -right-5 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-10`} />
    </div>
);

// ─── Stat Row (compact info list) ────────────────────────────────────────────
const StatRow = ({ icon, label, value, color }) => (
    <div className="flex items-center gap-3 py-3 border-b border-outline-variant/10 last:border-0">
        <span className={`material-symbols-outlined text-xl ${color}`}>{icon}</span>
        <span className="flex-1 text-sm text-on-surface-variant">{label}</span>
        <span className="text-sm font-bold text-on-surface">{value}</span>
    </div>
);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-xl px-4 py-3 min-w-[120px]">
                <p className="text-xs font-bold text-on-surface-variant mb-1">{label}</p>
                <p className="text-xl font-extrabold text-on-surface">{payload[0].value.toLocaleString('vi-VN')}</p>
                <p className="text-xs text-on-surface-variant">{payload[0].name}</p>
            </div>
        );
    }
    return null;
};

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
    { id: 'overview', label: 'Tổng quan', icon: 'dashboard' },
    { id: 'users', label: 'Người dùng', icon: 'group' },
    { id: 'borrows', label: 'Mượn / Trả', icon: 'import_contacts' },
    { id: 'finance', label: 'Tài chính', icon: 'payments' },
];

const TIME_OPTIONS = [
    { label: 'Hôm nay', value: 'today' },
    { label: 'Tuần này', value: 'week' },
    { label: 'Tháng này', value: 'month' },
    { label: 'Năm nay', value: 'year' },
    { label: 'Tất cả', value: 'all' },
];

// ─── Page ────────────────────────────────────────────────────────────────────
const AdminReportsPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [timeFilter, setTimeFilter] = useState('month');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            setLoading(true);
            try {
                const { data } = await adminAPI.getStats({ period: timeFilter });
                if (isMounted) setStats(data.stats);
            } catch {
                if (isMounted) setError('Không thể tải dữ liệu phân tích.');
            } finally {
                if (isMounted) setLoading(false);
            }
        })();
        return () => { isMounted = false; };
    }, [timeFilter]);

    const handleExport = () => {
        setExporting(true);
        try {
            let data = [];
            let sheetName = "";
            let fileName = "";
            const currentPeriod = TIME_OPTIONS.find(o => o.value === timeFilter)?.label || '';

            switch (activeTab) {
                case 'overview':
                    sheetName = "Tổng quan";
                    fileName = `Bao_Cao_Tong_Quan_${timeFilter}.xlsx`;
                    data = [
                        ["BÁO CÁO TỔNG QUAN HỆ THỐNG LÝ THUYẾT"],
                        ["Thời gian:", currentPeriod],
                        [],
                        ["CHỈ SỐ", "SỐ LƯỢNG"],
                        ["Người dùng đang hoạt động", stats.users.active],
                        ["Sách đang được mượn", stats.borrows.active],
                        ["Sách quá hạn", stats.borrows.overdue],
                        ["Tiền phạt chưa thu", stats.fines.pending],
                        ["Tỷ lệ thu tiền phạt (%)", `${collectionRate}%`],
                    ];
                    break;
                case 'users':
                    sheetName = "Người dùng";
                    fileName = `Bao_Cao_Nguoi_Dung_${timeFilter}.xlsx`;
                    data = [
                        ["BÁO CÁO TÀI KHOẢN NGƯỜI DÙNG"],
                        ["Thời gian:", currentPeriod],
                        [],
                        ["NHÓM / PHÂN LOẠI", "SỐ LƯỢNG"],
                        ["Tổng số người dùng", stats.users.total],
                        ["Đang hoạt động", stats.users.active],
                        ["Sinh viên", stats.users.students],
                        ["Giảng viên", stats.users.lecturers],
                        ["Thủ thư", stats.users.librarians],
                        ["Tài khoản không hoạt động", stats.users.total - stats.users.active]
                    ];
                    break;
                case 'borrows':
                    sheetName = "Mượn Trả";
                    fileName = `Bao_Cao_Muon_Tra_${timeFilter}.xlsx`;
                    data = [
                        ["BÁO CÁO HỒ SƠ MƯỢN TRẢ SÁCH"],
                        ["Thời gian:", currentPeriod],
                        [],
                        ["CHỈ SỐ", "SỐ LƯỢNG"],
                        ["Tổng số lượt mượn", stats.borrows.total],
                        ["Đang mượn (Chưa trả)", stats.borrows.active],
                        ["Đã trả", stats.borrows.returned],
                        ["Quá hạn", stats.borrows.overdue]
                    ];
                    break;
                case 'finance':
                    sheetName = "Tài chính";
                    fileName = `Bao_Cao_Tai_Chinh_${timeFilter}.xlsx`;
                    data = [
                        ["BÁO CÁO TÌNH HÌNH TÀI CHÍNH & TIỀN PHẠT"],
                        ["Thời gian:", currentPeriod],
                        [],
                        ["CHỈ SỐ", "SỐ TIỀN (VNĐ)"],
                        ["Tổng tiền phạt đã xuất", stats.fines.total],
                        ["Doanh thu đã thu", stats.fines.paid],
                        ["Chưa thu", stats.fines.pending]
                    ];
                    break;
                default:
                    return;
            }

            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            XLSX.writeFile(wb, fileName);

        } catch (error) {
            console.error("Export error:", error);
        } finally {
            setExporting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-4xl mr-3 text-primary">progress_activity</span>
            <span>Đang tải dữ liệu phân tích...</span>
        </div>
    );

    if (error) return (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>{error}
        </div>
    );

    if (!stats) return null;

    const monthlyUserData = fillMonths(stats.charts?.monthlyUsers || []);
    const monthlyBorrowData = fillMonths(stats.charts?.monthlyBorrows || []);
    const collectionRate = stats.fines.total > 0
        ? Math.round((stats.fines.paid / stats.fines.total) * 100) : 0;

    const currentTimeLabel = TIME_OPTIONS.find(o => o.value === timeFilter)?.label ?? 'Tháng này';

    // ── Shared chart panels ──
    const UserBarChart = () => (
        <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm p-6 flex flex-col">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="font-bold text-on-surface">Người dùng mới</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Đăng ký theo tháng · 6 tháng qua</p>
                </div>
                <span className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-indigo-500 text-base">person_add</span>
                </span>
            </div>
            <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyUserData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                            <linearGradient id="ugGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f3ff', radius: 8 }} />
                        <Bar dataKey="count" fill="url(#ugGrad)" radius={[6, 6, 0, 0]} barSize={28} name="Người dùng mới" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const BorrowAreaChart = () => (
        <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm p-6 flex flex-col">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="font-bold text-on-surface">Hoạt động mượn sách</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Xu hướng mượn theo tháng · 6 tháng qua</p>
                </div>
                <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-500 text-base">trending_up</span>
                </span>
            </div>
            <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyBorrowData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                            <linearGradient id="baGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5}
                            fill="url(#baGrad)"
                            dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                            activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                            name="Lượt mượn" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    // ── Tab content panels ──
    const renderTabContent = () => {
        switch (activeTab) {

            case 'overview':
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* 4 KPI Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard icon="check_circle" label="Người dùng đang hoạt động" value={stats.users.active} gradient="from-indigo-500 to-violet-600" textColor="text-indigo-700" bg="bg-indigo-50" />
                            <KpiCard icon="autorenew" label="Đang mượn sách" value={stats.borrows.active} gradient="from-blue-500 to-cyan-600" textColor="text-blue-700" bg="bg-blue-50" />
                            <KpiCard icon="schedule" label="Sách quá hạn" value={stats.borrows.overdue} gradient="from-rose-500 to-pink-600" textColor="text-rose-700" bg="bg-rose-50" />
                            <KpiCard icon="pending" label="Tiền phạt chưa thu" value={fmt(stats.fines.pending)} gradient="from-amber-400 to-orange-500" textColor="text-amber-700" bg="bg-amber-50" />
                        </div>
                        {/* Two charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <UserBarChart />
                            <BorrowAreaChart />
                        </div>
                        {/* Fine progress bar */}
                        <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-bold text-on-surface">Tỷ lệ thu tiền phạt</p>
                                <span className="text-2xl font-extrabold text-emerald-600">{collectionRate}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-surface-container-low rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000" style={{ width: `${collectionRate}%` }} />
                            </div>
                            <p className="text-xs text-on-surface-variant mt-2">
                                {fmt(stats.fines.paid)} đã thu · {fmt(stats.fines.pending)} còn lại
                            </p>
                        </div>
                    </div>
                );

            case 'users':
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard icon="group" label="Tổng số người dùng" value={stats.users.total} gradient="from-indigo-500 to-violet-600" textColor="text-indigo-700" bg="bg-indigo-50" />
                            <KpiCard icon="check_circle" label="Đang hoạt động" value={stats.users.active} gradient="from-emerald-500 to-teal-600" textColor="text-emerald-700" bg="bg-emerald-50" />
                            <KpiCard icon="school" label="Sinh viên" value={stats.users.students} gradient="from-blue-500 to-cyan-600" textColor="text-blue-700" bg="bg-blue-50" />
                            <KpiCard icon="work" label="Giảng viên" value={stats.users.lecturers} gradient="from-purple-500 to-violet-600" textColor="text-purple-700" bg="bg-purple-50" />
                        </div>
                        {/* Compact detail list */}
                        <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm p-6 max-w-sm">
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Chi tiết phân loại</p>
                            <StatRow icon="badge" label="Thủ thư" value={stats.users.librarians} color="text-amber-500" />
                            <StatRow icon="block" label="Tài khoản không hoạt động" value={stats.users.total - stats.users.active} color="text-rose-400" />
                        </div>
                        <UserBarChart />
                    </div>
                );

            case 'borrows':
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard icon="import_contacts" label="Tổng số lượt mượn" value={stats.borrows.total} gradient="from-indigo-500 to-violet-600" textColor="text-indigo-700" bg="bg-indigo-50" />
                            <KpiCard icon="autorenew" label="Đang mượn" value={stats.borrows.active} gradient="from-blue-500 to-cyan-600" textColor="text-blue-700" bg="bg-blue-50" />
                            <KpiCard icon="assignment_turned_in" label="Đã trả" value={stats.borrows.returned} gradient="from-emerald-500 to-teal-600" textColor="text-emerald-700" bg="bg-emerald-50" />
                            <KpiCard icon="schedule" label="Quá hạn" value={stats.borrows.overdue} gradient="from-rose-500 to-pink-600" textColor="text-rose-700" bg="bg-rose-50" />
                        </div>
                        <BorrowAreaChart />
                    </div>
                );

            case 'finance':
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <KpiCard icon="account_balance" label="Tổng tiền phạt đã xuất" value={fmt(stats.fines.total)} gradient="from-indigo-500 to-violet-600" textColor="text-indigo-700" bg="bg-indigo-50" />
                            <KpiCard icon="payments" label="Doanh thu đã thu" value={fmt(stats.fines.paid)} gradient="from-emerald-500 to-teal-600" textColor="text-emerald-700" bg="bg-emerald-50" />
                            <KpiCard icon="pending" label="Chưa thu" value={fmt(stats.fines.pending)} gradient="from-amber-400 to-orange-500" textColor="text-amber-700" bg="bg-amber-50" />
                        </div>
                        <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-bold text-on-surface">Tỷ lệ thu tiền phạt</p>
                                <span className="text-2xl font-extrabold text-emerald-600">{collectionRate}%</span>
                            </div>
                            <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000" style={{ width: `${collectionRate}%` }} />
                            </div>
                            <p className="text-xs text-on-surface-variant mt-2">
                                {fmt(stats.fines.paid)} đã thu trên {fmt(stats.fines.total)} tổng cộng
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ── Header ── */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                        <span className="material-symbols-outlined text-white text-2xl">analytics</span>
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Báo cáo &amp; Phân tích</h1>
                        <p className="text-on-surface-variant text-sm mt-1">
                            Tổng quan hiệu suất · <span className="font-semibold text-emerald-600">{currentTimeLabel}</span>
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="relative">
                        <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2.5 rounded-2xl border border-outline-variant/20 bg-white text-sm font-semibold text-on-surface shadow-sm hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all cursor-pointer"
                        >
                            {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">expand_more</span>
                    </div>
                    <button
                        id="export-report-btn"
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60"
                    >
                        <span className={`material-symbols-outlined text-lg ${exporting ? 'animate-spin' : ''}`}>
                            {exporting ? 'progress_activity' : 'download'}
                        </span>
                        {exporting ? 'Đang xuất…' : 'Xuất báo cáo'}
                    </button>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 bg-surface-container-low/60 p-1.5 rounded-2xl w-fit">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                            ${activeTab === tab.id
                                ? 'bg-white text-on-surface shadow-sm'
                                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            {renderTabContent()}
        </div>
    );
};

export default AdminReportsPage;
