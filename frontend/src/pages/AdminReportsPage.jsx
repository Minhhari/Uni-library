import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color = 'primary' }) => {
    const colorMap = {
        primary: 'from-indigo-500 to-violet-600',
        emerald: 'from-emerald-500 to-teal-600',
        amber: 'from-amber-400 to-orange-500',
        rose: 'from-rose-500 to-pink-600',
        blue: 'from-blue-500 to-cyan-600',
        purple: 'from-purple-500 to-violet-600',
    };
    return (
        <div className="relative overflow-hidden bg-white rounded-3xl border border-outline-variant/10 shadow-sm p-6">
            <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${colorMap[color]} opacity-10`} />
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center mb-4 shadow-lg`}>
                <span className="material-symbols-outlined text-white text-xl">{icon}</span>
            </div>
            <p className="text-2xl font-extrabold text-on-surface">{value}</p>
            <p className="text-sm font-semibold text-on-surface mt-1">{label}</p>
        </div>
    );
};

// ─── Bar Chart ───────────────────────────────────────────────────────────────
const BarChart = ({ data, color = '#6366f1', title }) => {
    const max = Math.max(...data.map((d) => d.count), 1);
    return (
        <div>
            <p className="text-sm font-bold text-on-surface-variant mb-3">{title}</p>
            <div className="flex items-end gap-2 h-28">
                {data.map((d, i) => {
                    const pct = Math.round((d.count / max) * 100);
                    const label = MONTH_NAMES[(d._id?.month ?? 1) - 1];
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                                className="w-full rounded-t-lg transition-all duration-500"
                                style={{ height: `${Math.max(pct, 4)}%`, background: color }}
                                title={`${label}: ${d.count}`}
                            />
                            <span className="text-[10px] font-bold text-on-surface-variant">{label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Fill 6 months ───────────────────────────────────────────────────────────
const fillMonths = (data) => {
    const map = {};
    data.forEach((d) => { map[`${d._id.year}-${d._id.month}`] = d.count; });
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        result.push({ _id: { year: d.getFullYear(), month: d.getMonth() + 1 }, count: map[key] || 0 });
    }
    return result;
};

// ─── Page ────────────────────────────────────────────────────────────────────
const AdminReportsPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const { data } = await adminAPI.getStats();
                setStats(data.stats);
            } catch {
                setError('Failed to load analytics.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-4xl mr-3 text-primary">progress_activity</span>
            <span>Loading analytics…</span>
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
        ? Math.round((stats.fines.paid / stats.fines.total) * 100)
        : 0;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                    <span className="material-symbols-outlined text-white text-2xl">analytics</span>
                </div>
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Reports & Analytics</h1>
                    <p className="text-on-surface-variant text-sm mt-1">System-wide performance overview</p>
                </div>
            </div>

            {/* ── User Accounts ── */}
            <section>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">👥 User Accounts</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatCard icon="group" label="Total Users" value={stats.users.total} color="primary" />
                    <StatCard icon="check_circle" label="Active" value={stats.users.active} color="emerald" />
                    <StatCard icon="school" label="Students" value={stats.users.students} color="blue" />
                    <StatCard icon="work" label="Lecturers" value={stats.users.lecturers} color="purple" />
                    <StatCard icon="badge" label="Librarians" value={stats.users.librarians} color="amber" />
                </div>
            </section>

            {/* ── Borrow Records ── */}
            <section>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">📚 Borrow Records</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon="import_contacts" label="Total Borrows" value={stats.borrows.total} color="primary" />
                    <StatCard icon="autorenew" label="Currently Active" value={stats.borrows.active} color="blue" />
                    <StatCard icon="assignment_turned_in" label="Returned" value={stats.borrows.returned} color="emerald" />
                    <StatCard icon="schedule" label="Overdue" value={stats.borrows.overdue} color="rose" />
                </div>
            </section>

            {/* ── Fines & Revenue ── */}
            <section>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">💰 Fines & Revenue</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard icon="account_balance" label="Total Fines Issued" value={fmt(stats.fines.total)} color="primary" />
                    <StatCard icon="payments" label="Revenue Collected" value={fmt(stats.fines.paid)} color="emerald" />
                    <StatCard icon="pending" label="Pending Collection" value={fmt(stats.fines.pending)} color="rose" />
                </div>
            </section>

            {/* ── Charts ── */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm p-6">
                    <p className="font-bold text-on-surface mb-1">New Users</p>
                    <p className="text-xs text-on-surface-variant mb-5">Last 6 months</p>
                    <BarChart data={monthlyUserData} color="#6366f1" title="Monthly Registrations" />
                </div>
                <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm p-6">
                    <p className="font-bold text-on-surface mb-1">Borrow Activity</p>
                    <p className="text-xs text-on-surface-variant mb-5">Last 6 months</p>
                    <BarChart data={monthlyBorrowData} color="#10b981" title="Monthly Borrows" />
                </div>
            </section>

            {/* ── Fine collection rate ── */}
            {stats.fines.total > 0 && (
                <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm p-6">
                    <p className="font-bold text-on-surface mb-4">Fine Collection Rate</p>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-3 bg-surface-container-low rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000"
                                style={{ width: `${collectionRate}%` }}
                            />
                        </div>
                        <span className="text-2xl font-extrabold text-emerald-600 w-16 text-right">{collectionRate}%</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-2">
                        {fmt(stats.fines.paid)} collected of {fmt(stats.fines.total)} total
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdminReportsPage;
