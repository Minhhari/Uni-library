import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  n == null ? '—' : Number(n).toLocaleString('vi-VN');

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const isOverdue = (dueDate, status) => {
  if (status === 'returned') return false;
  return dueDate && new Date(dueDate) < new Date();
};

const STATUS_CONFIG = {
  approved: { label: 'ON TIME', bg: 'bg-emerald-100 text-emerald-700' },
  returned: { label: 'RETURNED', bg: 'bg-slate-100 text-slate-500' },
  pending: { label: 'PENDING', bg: 'bg-amber-100 text-amber-700' },
  rejected: { label: 'REJECTED', bg: 'bg-red-100 text-red-600' },
  overdue: { label: 'OVERDUE', bg: 'bg-red-100 text-red-600 font-bold' },
};

const CONDITION_LABEL = {
  good: 'Nguyên vẹn',
  damaged: 'Hư hỏng',
  lost: 'Mất sách',
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, accent, trend, trendUp }) => (
  <div className={`bg - white rounded - 2xl p - 6 shadow - sm border border - slate - 100 flex flex - col gap - 3 relative overflow - hidden`}>
    <div className={`absolute top - 0 right - 0 w - 24 h - 24 rounded - full opacity - 5 - translate - y - 6 translate - x - 6 ${accent} `} />
    <div className="flex items-center justify-between">
      <span className={`w - 10 h - 10 rounded - xl flex items - center justify - center text - white text - lg ${accent} `}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </span>
      {trend != null && (
        <span className={`text - xs font - bold flex items - center gap - 0.5 ${trendUp ? 'text-emerald-500' : 'text-red-500'} `}>
          <span className="material-symbols-outlined text-[14px]">{trendUp ? 'trending_up' : 'trending_down'}</span>
          {trend}
        </span>
      )}
    </div>
    <div>
      <div className="text-3xl font-black text-slate-800 tracking-tight">{fmt(value)}</div>
      <div className="text-sm font-semibold text-slate-500 mt-0.5">{label}</div>
    </div>
    {sub && <div className="text-xs text-slate-400">{sub}</div>}
  </div>
);

// ─── Return Modal ──────────────────────────────────────────────────────────────
const ReturnModal = ({ record, onClose, onSuccess }) => {
  const [condition, setCondition] = useState('good');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReturn = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.put(`/ borrow /return/${record._id}`, { bookCondition: condition });
      onSuccess(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const bookPrice = record?.bookId?.price || 0;
  const dueDate = record?.dueDate ? new Date(record.dueDate) : null;
  const now = new Date();
  const daysLate = dueDate && now > dueDate ? Math.ceil((now - dueDate) / 86400000) : 0;

  const previewFine = (() => {
    const late = daysLate * 5000;
    if (condition === 'lost') return daysLate > 0 ? bookPrice + late : bookPrice;
    if (condition === 'damaged') return daysLate > 0 ? bookPrice * 0.5 + late : bookPrice * 0.5;
    return late;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight">Xử lý trả sách</h2>
              <p className="text-slate-300 text-sm mt-0.5 truncate max-w-xs">
                {record?.bookId?.title || '—'}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Info row */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Người mượn</div>
              <div className="font-bold text-slate-700 truncate">{record?.userId?.name || '—'}</div>
            </div>
            <div className={`rounded-xl p-3 ${daysLate > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Hạn trả</div>
              <div className={`font-bold ${daysLate > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                {fmtDate(record?.dueDate)}
                {daysLate > 0 && <span className="block text-xs font-semibold">Trễ {daysLate} ngày</span>}
              </div>
            </div>
          </div>

          {/* Condition picker */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Tình trạng sách
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'good', icon: 'check_circle', label: 'Nguyên vẹn', color: 'emerald' },
                { val: 'damaged', icon: 'warning', label: 'Hư hỏng', color: 'amber' },
                { val: 'lost', icon: 'help', label: 'Mất sách', color: 'red' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setCondition(opt.val)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-bold
                    ${condition === opt.val
                      ? opt.color === 'emerald' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : opt.color === 'amber' ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                >
                  <span className={`material-symbols-outlined text-[22px]
                    ${condition === opt.val
                      ? opt.color === 'emerald' ? 'text-emerald-600'
                        : opt.color === 'amber' ? 'text-amber-600'
                          : 'text-red-600'
                      : 'text-slate-400'}`}>
                    {opt.icon}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fine preview */}
          <div className={`rounded-2xl p-4 flex items-center justify-between
            ${previewFine > 0 ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">Tiền phạt dự kiến</div>
              <div className={`text-2xl font-black ${previewFine > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {previewFine > 0 ? `${fmt(previewFine)} đ` : 'Không có'}
              </div>
            </div>
            <span className={`material-symbols-outlined text-[36px] opacity-30 ${previewFine > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {previewFine > 0 ? 'payments' : 'check_circle'}
            </span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              onClick={handleReturn}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <span className="material-symbols-outlined text-[18px] animate-spin">autorenew</span>
                : <span className="material-symbols-outlined text-[18px]">task_alt</span>
              }
              Xác nhận trả
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Result Modal ──────────────────────────────────────────────────────────────
const ResultModal = ({ result, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
        ${result.fineAmount > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}>
        <span className={`material-symbols-outlined text-[32px]
          ${result.fineAmount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
          {result.fineAmount > 0 ? 'payments' : 'check_circle'}
        </span>
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-1">Trả sách thành công</h3>
      <p className="text-slate-500 text-sm mb-5">
        Tình trạng: <strong>{CONDITION_LABEL[result.bookCondition] || result.bookCondition}</strong>
        {result.daysLate > 0 && ` · Trễ ${result.daysLate} ngày`}
      </p>

      {result.fineAmount > 0 ? (
        <div className="bg-red-50 rounded-2xl p-4 mb-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tiền phạt</div>
          <div className="text-3xl font-black text-red-600">{fmt(result.fineAmount)} đ</div>
          <div className="text-xs text-slate-500 mt-1 capitalize">{result.fineReason?.replace(/_/g, ' + ')}</div>
        </div>
      ) : (
        <div className="bg-emerald-50 rounded-2xl p-4 mb-6">
          <div className="text-sm font-bold text-emerald-600">Không có tiền phạt 🎉</div>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-700 transition"
      >
        Đóng
      </button>
    </div>
  </div>
);

// ─── Main Dashboard ────────────────────────────────────────────────────────────
const LibrarianDashboard = () => {
  const { user } = useAuth();

  const [borrows, setBorrows] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const [returnTarget, setReturnTarget] = useState(null);
  const [returnResult, setReturnResult] = useState(null);

  const [filter, setFilter] = useState('all'); // all | pending | approved | overdue

  // ── Fetch data ────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, bookRes] = await Promise.all([
        api.get('/borrow/all'),
        api.get('/books'),
      ]);
      setBorrows(Array.isArray(bRes.data) ? bRes.data : []);
      const bookArr = bookRes.data?.books || bookRes.data || [];
      setBooks(Array.isArray(bookArr) ? bookArr : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalBooks = books.reduce((s, b) => s + (b.quantity || 0), 0);
  const activeBorrows = borrows.filter((b) => b.status === 'approved').length;
  const overdueItems = borrows.filter((b) => isOverdue(b.dueDate, b.status)).length;
  const pendingReturns = borrows.filter((b) => b.status === 'pending').length;

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = borrows.filter((b) => {
    if (filter === 'pending') return b.status === 'pending';
    if (filter === 'approved') return b.status === 'approved' && !isOverdue(b.dueDate, b.status);
    if (filter === 'overdue') return isOverdue(b.dueDate, b.status);
    return true;
  }).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setActionLoading((p) => ({ ...p, [id]: 'approve' }));
    try {
      await api.put(`/borrow/approve/${id}`);
      await fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi');
    } finally {
      setActionLoading((p) => ({ ...p, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Từ chối yêu cầu mượn này?')) return;
    setActionLoading((p) => ({ ...p, [id]: 'reject' }));
    try {
      await api.put(`/borrow/reject/${id}`);
      await fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi');
    } finally {
      setActionLoading((p) => ({ ...p, [id]: null }));
    }
  };

  const handleReturnSuccess = async (data) => {
    setReturnTarget(null);
    setReturnResult(data);
    await fetchAll();
  };

  // ── Status badge ──────────────────────────────────────────────────────────
  const getStatusBadge = (record) => {
    const key = isOverdue(record.dueDate, record.status) ? 'overdue' : record.status;
    const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.pending;
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider ${cfg.bg}`}>
        {cfg.label}
      </span>
    );
  };

  const initials = (name) => name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  const AVATAR_COLORS = [
    'bg-violet-500', 'bg-sky-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-indigo-500',
  ];
  const avatarColor = (id) => AVATAR_COLORS[(id?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  // ── Quick actions ─────────────────────────────────────────────────────────
  const quickActions = [
    { icon: 'library_add', label: 'Add New Book', sub: 'Catalog new items', href: '/books' },
    { icon: 'assignment_return', label: 'Process Return', sub: 'Check in borrowed books', action: () => setFilter('approved') },
    { icon: 'notification_important', label: 'Send Reminder', sub: 'Notify overdue borrowers', action: () => setFilter('overdue') },
    { icon: 'bar_chart', label: 'Generate Report', sub: 'Export monthly statistics', href: '/reports' },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-[48px] text-slate-300 animate-spin">autorenew</span>
      </div>
    );
  }

  return (
    <>
      {returnTarget && (
        <ReturnModal
          record={returnTarget}
          onClose={() => setReturnTarget(null)}
          onSuccess={handleReturnSuccess}
        />
      )}
      {returnResult && (
        <ResultModal
          result={returnResult}
          onClose={() => setReturnResult(null)}
        />
      )}

      <div className="space-y-8">
        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Curator Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">
              Managing the digital collection for the {new Date().getFullYear()} academic year.
            </p>
          </div>
          <a
            href="/books"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-200 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Entry
          </a>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon="menu_book" label="Total Books" value={totalBooks} accent="bg-emerald-500" trend="+2.4%" trendUp />
          <StatCard icon="shopping_bag" label="Active Borrows" value={activeBorrows} accent="bg-sky-500" trend="+12%" trendUp />
          <StatCard icon="warning" label="Overdue Items" value={overdueItems} accent="bg-red-500" trend="+5%" trendUp={false} />
          <StatCard icon="assignment_return" label="Pending Returns" value={pendingReturns} accent="bg-violet-500" trend="-8%" trendUp />
        </div>

        {/* ── Main Content ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Transactions Table ── */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Table header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-black text-slate-800">Recent Transactions</h2>
                <p className="text-slate-400 text-xs mt-0.5">{filtered.length} records</p>
              </div>
              {/* Filter tabs */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'pending', label: `Pending (${pendingReturns})` },
                  { key: 'approved', label: 'Active' },
                  { key: 'overdue', label: `Overdue (${overdueItems})` },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap
                      ${filter === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Book Title</th>
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Borrow Date</th>
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                        <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">inbox</span>
                        No records found
                      </td>
                    </tr>
                  ) : filtered.slice(0, 10).map((rec) => {
                    const name = rec.userId?.name || '?';
                    const title = rec.bookId?.title || '—';
                    const al = actionLoading[rec._id];
                    return (
                      <tr key={rec._id} className="hover:bg-slate-50/80 transition group">
                        {/* Student */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${avatarColor(rec.userId?._id)} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                              {initials(name)}
                            </div>
                            <span className="font-semibold text-slate-700 text-sm truncate max-w-[120px]">{name}</span>
                          </div>
                        </td>
                        {/* Book */}
                        <td className="px-4 py-3.5">
                          <span className="font-medium text-slate-600 truncate block max-w-[140px]" title={title}>{title}</span>
                        </td>
                        {/* Dates */}
                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{fmtDate(rec.borrowDate)}</td>
                        <td className={`px-4 py-3.5 whitespace-nowrap font-medium ${isOverdue(rec.dueDate, rec.status) ? 'text-red-600' : 'text-slate-500'}`}>
                          {fmtDate(rec.dueDate)}
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3.5">{getStatusBadge(rec)}</td>
                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {rec.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(rec._id)}
                                  disabled={!!al}
                                  title="Approve"
                                  className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center justify-center transition disabled:opacity-40"
                                >
                                  {al === 'approve'
                                    ? <span className="material-symbols-outlined text-[14px] animate-spin">autorenew</span>
                                    : <span className="material-symbols-outlined text-[14px]">check</span>}
                                </button>
                                <button
                                  onClick={() => handleReject(rec._id)}
                                  disabled={!!al}
                                  title="Reject"
                                  className="w-7 h-7 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition disabled:opacity-40"
                                >
                                  {al === 'reject'
                                    ? <span className="material-symbols-outlined text-[14px] animate-spin">autorenew</span>
                                    : <span className="material-symbols-outlined text-[14px]">close</span>}
                                </button>
                              </>
                            )}
                            {(rec.status === 'approved' || isOverdue(rec.dueDate, rec.status)) && (
                              <button
                                onClick={() => setReturnTarget(rec)}
                                title="Process Return"
                                className="w-7 h-7 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700 flex items-center justify-center transition"
                              >
                                <span className="material-symbols-outlined text-[14px]">assignment_return</span>
                              </button>
                            )}
                            {rec.status === 'returned' && (
                              <span className="text-xs text-slate-400 italic">Done</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-5">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {quickActions.map((qa, i) => (
                  <a
                    key={i}
                    href={qa.href || undefined}
                    onClick={qa.action}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition shrink-0">
                      <span className="material-symbols-outlined text-emerald-700 text-[18px]">{qa.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-700 truncate">{qa.label}</div>
                      <div className="text-xs text-slate-400 truncate">{qa.sub}</div>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 text-[16px] ml-auto shrink-0 group-hover:text-slate-500 transition">
                      chevron_right
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Curator Tip */}
            {overdueItems > 0 && (
              <div className="bg-slate-900 rounded-2xl p-5 text-white">
                <div className="text-[10px] font-black tracking-[0.2em] text-emerald-400 uppercase mb-2">
                  Curator Tip
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  You have <span className="text-white font-bold">{overdueItems} overdue</span> items today.
                  Processing these will optimize your inventory accuracy score.
                </p>
                <button
                  onClick={() => setFilter('overdue')}
                  className="mt-4 text-sm font-bold text-white underline underline-offset-2 hover:text-emerald-400 transition"
                >
                  Review Overdue →
                </button>
              </div>
            )}

            {pendingReturns > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="text-[10px] font-black tracking-[0.2em] text-amber-600 uppercase mb-2">
                  Pending Requests
                </div>
                <p className="text-sm text-amber-800 leading-relaxed">
                  <span className="font-bold">{pendingReturns} requests</span> waiting for approval.
                </p>
                <button
                  onClick={() => setFilter('pending')}
                  className="mt-3 text-sm font-bold text-amber-700 underline underline-offset-2 hover:text-amber-900 transition"
                >
                  Review Pending →
                </button>
              </div>
            )}

            {/* Mini Stats — books by status */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Borrow Summary</h3>
              {[
                { label: 'Approved / Active', value: activeBorrows, color: 'bg-sky-500' },
                { label: 'Pending', value: pendingReturns, color: 'bg-amber-400' },
                { label: 'Overdue', value: overdueItems, color: 'bg-red-500' },
                { label: 'Returned', value: borrows.filter((b) => b.status === 'returned').length, color: 'bg-slate-400' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <span className="text-sm text-slate-600">{s.label}</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LibrarianDashboard;