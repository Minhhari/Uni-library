import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { bookRequestAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CreateBookModal, EditBookModal } from '../components';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  n == null ? '0' : Number(n).toLocaleString('vi-VN');

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const isOverdue = (dueDate, status) => {
  if (status === 'returned') return false;
  return dueDate && new Date(dueDate) < new Date();
};

const STATUS_CONFIG = {
  approved: { label: 'ĐANG MƯỢN', bg: 'bg-emerald-100 text-emerald-700' },
  returned: { label: 'ĐÃ TRẢ', bg: 'bg-slate-100 text-slate-500' },
  pending: { label: 'CHỜ DUYỆT', bg: 'bg-amber-100 text-amber-700' },
  rejected: { label: 'TỪ CHỐI', bg: 'bg-red-100 text-red-600' },
  overdue: { label: 'QUÁ HẠN', bg: 'bg-red-100 text-red-600 font-bold' },
  waiting_for_pickup: { label: 'CHỜ LẤY SÁCH', bg: 'bg-blue-100 text-blue-700' },
  expired: { label: 'ĐÃ HỦY (QUÁ HẠN)', bg: 'bg-slate-200 text-slate-500' },
  fulfilled: { label: 'ĐÃ GIAO SÁCH', bg: 'bg-teal-100 text-teal-700' },
};

const CONDITION_LABEL = {
  good: 'Nguyên vẹn',
  damaged: 'Hư hỏng',
  lost: 'Mất sách',
};

// ─── Components ────────────────────────────────────────────────────────────────

// 1. Stat Card
const StatCard = ({ icon, label, value, accent, trend, trendUp }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6 ${accent} group-hover:scale-110 transition-transform`} />
    <div className="flex items-center justify-between">
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg ${accent} shadow-inner`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </span>
      {trend != null && (
        <span className={`text-xs font-bold flex items-center gap-0.5 ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
          <span className="material-symbols-outlined text-[14px]">{trendUp ? 'trending_up' : 'trending_down'}</span>
          {trend}
        </span>
      )}
    </div>
    <div>
      <div className="text-3xl font-black text-slate-800 tracking-tight">{fmt(value)}</div>
      <div className="text-sm font-semibold text-slate-500 mt-0.5">{label}</div>
    </div>
  </div>
);

// 2. Return Modal (Enhanced with Fine logic)
const ReturnModal = ({ record, onClose, onSuccess }) => {
  const [condition, setCondition] = useState('good');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReturn = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.put(`/borrow/return/${record._id}`, { bookCondition: condition });
      onSuccess(res.data);
      toast.success('Xử lý trả sách thành công');
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
    if (condition === 'damaged') return daysLate > 0 ? (bookPrice * 0.5) + late : bookPrice * 0.5;
    return late;
  })();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-xl font-black tracking-tight">Xử lý trả sách</h2>
              <p className="text-slate-400 text-sm mt-1 truncate max-w-[250px]">
                {record?.bookId?.title}
              </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition active:scale-95">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Người mượn</div>
              <div className="font-bold text-slate-800 truncate">{record?.userId?.name}</div>
            </div>
            <div className={`rounded-2xl p-4 border ${daysLate > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Hạn trả</div>
              <div className={`font-bold ${daysLate > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {fmtDate(record?.dueDate)}
                {daysLate > 0 && <span className="block text-[10px] font-black mt-1">Trễ {daysLate} ngày</span>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Tình trạng thực tế</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: 'good', icon: 'check_circle', label: 'Nguyên vẹn', color: 'emerald' },
                { val: 'damaged', icon: 'warning', label: 'Hư hỏng', color: 'amber' },
                { val: 'lost', icon: 'error', label: 'Mất sách', color: 'red' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setCondition(opt.val)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all group
                    ${condition === opt.val
                      ? opt.color === 'emerald' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : opt.color === 'amber' ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                      : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  <span className={`material-symbols-outlined text-[24px] ${condition === opt.val ? '' : 'opacity-40'} group-hover:scale-110 transition-transform`}>
                    {opt.icon}
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-tighter">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl p-5 flex items-center justify-between shadow-inner
            ${previewFine > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
            <div>
              <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${previewFine > 0 ? 'text-red-400' : 'text-emerald-400'}`}>Phí phạt dự kiến</div>
              <div className={`text-2xl font-black ${previewFine > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {previewFine > 0 ? `${fmt(previewFine)} đ` : '0 đ'}
              </div>
            </div>
            <span className={`material-symbols-outlined text-[40px] opacity-20 ${previewFine > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {previewFine > 0 ? 'payments' : 'verified'}
            </span>
          </div>

          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">{error}</div>}

          <div className="flex gap-4">
            <button onClick={onClose} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition active:scale-95">Hủy</button>
            <button
              onClick={handleReturn}
              disabled={loading}
              className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span> : 'Xác nhận trả'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Result Modal (Success fine info)
const ResultModal = ({ result, onClose }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-10 text-center relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-2 ${result.fineAmount > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl
        ${result.fineAmount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
        <span className="material-symbols-outlined text-[40px]">
          {result.fineAmount > 0 ? 'error' : 'check_circle'}
        </span>
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-2">Đã nhận lại sách!</h3>
      <p className="text-slate-500 text-sm mb-6 px-4">
        Hệ thống đã cập nhật tình trạng sách là <strong>{CONDITION_LABEL[result.bookCondition]}</strong>.
      </p>

      {result.fineAmount > 0 && (
        <div className="bg-red-50 rounded-2xl p-6 mb-8 border border-red-100">
          <div className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-2">Hóa đơn phạt đã tạo</div>
          <div className="text-3xl font-black text-red-600">{fmt(result.fineAmount)} đ</div>
          <div className="text-[11px] font-bold text-slate-500 mt-2 italic">Lý do: {result.fineReason?.replace(/_/g, ' + ')}</div>
        </div>
      )}

      <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow-xl shadow-slate-200 active:scale-95">Đóng cửa sổ</button>
    </div>
  </div>
);

// ─── BorrowSlip Component ──────────────────────────────────────────────────────
const BorrowSlip = ({ group, slipIdx, actionLoading, onApprove, onReject, onPickup, onReturn }) => {
  const [expanded, setExpanded] = useState(true);
  const user = group[0]?.userId;
  const createdAt = group[0]?.createdAt;

  // Tổng hợp trạng thái của phiếu
  const allReturned = group.every(r => r.status === 'returned');
  const hasPending = group.some(r => r.status === 'pending');
  const hasActive = group.some(r => r.status === 'approved' || r.status === 'waiting_for_pickup');

  const slipStatus = allReturned ? 'returned'
    : hasPending ? 'pending'
      : hasActive ? 'active'
        : 'mixed';

  const slipBadge = {
    returned: { label: 'Hoàn tất', bg: 'bg-slate-100 text-slate-500' },
    pending: { label: `${group.filter(r => r.status === 'pending').length} chờ duyệt`, bg: 'bg-amber-100 text-amber-700' },
    active: { label: 'Đang mượn', bg: 'bg-emerald-100 text-emerald-700' },
    mixed: { label: 'Đang xử lý', bg: 'bg-blue-100 text-blue-700' },
  }[slipStatus];

  return (
    <div className="border-b border-slate-50 last:border-0">
      {/* Slip Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-8 py-5 flex items-center gap-5 hover:bg-slate-50/60 transition text-left group"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-black flex-shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-black text-slate-800 text-sm">{user?.name || 'Người dùng'}</span>
            <span className="text-[10px] text-slate-400 font-bold">{user?.email}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Phiếu #{String(slipIdx + 1).padStart(3, '0')} · {group.length} quyển · {fmtDate(createdAt)}
            </span>
          </div>
        </div>

        {/* Book thumbnails preview */}
        <div className="hidden sm:flex items-center -space-x-3 flex-shrink-0">
          {group.slice(0, 3).map((rec, i) => (
            <img
              key={rec._id}
              src={rec.bookId?.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=100'}
              className="w-8 h-11 object-cover rounded-lg border-2 border-white shadow-sm"
              style={{ zIndex: 3 - i }}
              alt=""
            />
          ))}
          {group.length > 3 && (
            <div className="w-8 h-11 rounded-lg bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-500">
              +{group.length - 3}
            </div>
          )}
        </div>

        {/* Slip status badge */}
        <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest flex-shrink-0 ${slipBadge.bg}`}>
          {slipBadge.label}
        </span>

        {/* Expand chevron */}
        <span className={`material-symbols-outlined text-slate-300 group-hover:text-slate-500 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Slip Body — book rows */}
      {expanded && (
        <div className="px-8 pb-6 space-y-3">
          {group.map((rec) => {
            const statusKey = isOverdue(rec.dueDate, rec.status) ? 'overdue' : rec.status;
            const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
            const isLoading = actionLoading[rec._id];

            return (
              <div key={rec._id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition group/row">
                {/* Cover */}
                <img
                  src={rec.bookId?.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=100'}
                  className="w-10 h-14 object-cover rounded-lg shadow-sm flex-shrink-0"
                  alt=""
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-sm truncate">{rec.bookId?.title}</div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">{rec.bookId?.author}</div>
                  {rec.requestedDueDate || rec.dueDate ? (
                    <div className={`text-[10px] font-black mt-1 ${isOverdue(rec.dueDate, rec.status) ? 'text-rose-500' : 'text-slate-400'}`}>
                      Trả: {fmtDate(rec.dueDate || rec.requestedDueDate)}
                    </div>
                  ) : null}
                </div>

                {/* Status */}
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest flex-shrink-0 ${cfg.bg}`}>
                  {cfg.label}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {rec.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onApprove(rec._id)}
                        disabled={isLoading}
                        title="Duyệt"
                        className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center hover:shadow-lg hover:shadow-emerald-500/30 transition shadow-md shadow-emerald-500/20 active:scale-90 disabled:opacity-50"
                      >
                        {isLoading ? <span className="material-symbols-outlined animate-spin text-[16px]">autorenew</span>
                          : <span className="material-symbols-outlined text-[18px]">check</span>}
                      </button>
                      <button
                        onClick={() => onReject(rec._id)}
                        disabled={isLoading}
                        title="Từ chối"
                        className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition disabled:opacity-50 active:scale-90"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </>
                  )}
                  {rec.status === 'waiting_for_pickup' && (
                    <button
                      onClick={() => onPickup(rec._id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 active:scale-95"
                    >
                      {isLoading ? <span className="material-symbols-outlined animate-spin text-[14px]">autorenew</span>
                        : <span className="material-symbols-outlined text-[14px]">front_hand</span>}
                      Giao sách
                    </button>
                  )}
                  {rec.status === 'approved' && (
                    <button
                      onClick={() => onReturn(rec)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[14px]">assignment_return</span>
                      Nhận lại
                    </button>
                  )}
                  {rec.status === 'returned' && (
                    <span className="text-[10px] font-black text-slate-300 uppercase italic px-2">Hoàn tất</span>
                  )}
                  {rec.status === 'rejected' && (
                    <span className="text-[10px] font-black text-red-300 uppercase italic px-2">Đã từ chối</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Main Dashboard Page ───────────────────────────────────────────────────────
const LibrarianDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [loading, setLoading] = useState(true);
  const [showCreateBookModal, setShowCreateBookModal] = useState(false);
  const [data, setData] = useState({
    borrows: [],
    books: [],
    reservations: [],
    bookRequests: [],
    users: [],
    fines: [],
  });

  const [returnTarget, setReturnTarget] = useState(null);
  const [returnResult, setReturnResult] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  // Book request review state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectInputs, setRejectInputs] = useState({}); // { bookIndex: 'reason string' }
  const [bookItemLoading, setBookItemLoading] = useState({}); // { `${reqId}_${idx}`: true }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [borRes, bookRes, resRes, reqRes, userRes, fineRes] = await Promise.all([
        api.get('/borrow/all'),
        api.get('/books'),
        api.get('/reservation/all'),
        api.get('/book-requests'),
        api.get('/users'),
        api.get('/fines/all'),
      ]);

      setData({
        borrows: Array.isArray(borRes.data) ? borRes.data : (borRes.data?.data || []),
        books: bookRes.data?.data || bookRes.data?.books || (Array.isArray(bookRes.data) ? bookRes.data : []),
        reservations: resRes.data?.data || (Array.isArray(resRes.data) ? resRes.data : []),
        bookRequests: reqRes.data?.data || reqRes.data?.requests || (Array.isArray(reqRes.data) ? reqRes.data : []),
        users: userRes.data?.users || (Array.isArray(userRes.data) ? userRes.data : []),
        fines: fineRes.data?.data?.fines || fineRes.data?.fines || (Array.isArray(fineRes.data) ? fineRes.data : []),
      });
    } catch (e) {
      console.error('Fetch error:', e);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Actions
  const handleApproveBorrow = async (id) => {
    setActionLoading(p => ({ ...p, [id]: true }));
    try {
      await api.put(`/borrow/approve/${id}`);
      toast.success('Đã duyệt yêu cầu mượn');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi');
    } finally {
      setActionLoading(p => ({ ...p, [id]: false }));
    }
  };

  const handlePickupBorrow = async (id) => {
    setActionLoading(p => ({ ...p, [id]: true }));
    try {
      await api.put(`/borrow/pickup/${id}`);
      toast.success('Đã xác nhận giao sách');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi xác nhận giao sách');
    } finally {
      setActionLoading(p => ({ ...p, [id]: false }));
    }
  };

  const handleRejectBorrow = async (id) => {
    setActionLoading(p => ({ ...p, [id]: true }));
    try {
      await api.put(`/borrow/reject/${id}`);
      toast.success('Đã từ chối yêu cầu mượn');
      fetchData();
    } catch (e) {
      console.error('Reject error:', e);
      toast.error(e.response?.data?.message || 'Không thể từ chối yêu cầu');
    } finally {
      setActionLoading(p => ({ ...p, [id]: false }));
    }
  };

  const handleApproveReservation = async (id) => {
    try {
      await api.put(`/reservation/approve/${id}`);
      toast.success('Đã duyệt yêu cầu đặt trước');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi');
    }
  };

  const handleHandoverReservation = async (id) => {
    setActionLoading(p => ({ ...p, [id]: true }));
    try {
      await api.put(`/reservation/handover/${id}`);
      toast.success('Đã giao sách! Bản ghi mượn trả đã được tạo trong tab Mượn & Trả.');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi giao sách');
    } finally {
      setActionLoading(p => ({ ...p, [id]: false }));
    }
  };

  const handleRejectReservation = async (id) => {
    setActionLoading(p => ({ ...p, [id]: true }));
    try {
      await api.put(`/reservation/reject/${id}`);
      toast.success('Đã từ chối yêu cầu đặt trước');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi');
    } finally {
      setActionLoading(p => ({ ...p, [id]: false }));
    }
  };

  const handleUpdateRequestStatus = async (id, status, note) => {
    try {
      await bookRequestAPI.updateStatus(id, status, note);
      toast.success(`Đã cập nhật phiếu: ${status}`);
      fetchData();
      if (selectedRequest?._id === id) setSelectedRequest(null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi');
    }
  };

  const handleBookItemStatus = async (requestId, bookIndex, bookStatus, rejectReason) => {
    const key = `${requestId}_${bookIndex}`;
    setBookItemLoading(p => ({ ...p, [key]: true }));
    try {
      const res = await bookRequestAPI.updateBookItemStatus(requestId, bookIndex, bookStatus, rejectReason);
      toast.success(bookStatus === 'approved' ? '✅ Đã duyệt cuốn sách' : '❌ Đã từ chối cuốn sách');
      // Update selectedRequest in-place so modal stays open
      if (res.data?.data) setSelectedRequest(res.data.data);
      // Clear reject input for this book
      setRejectInputs(p => { const n = { ...p }; delete n[bookIndex]; return n; });
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi cập nhật');
    } finally {
      setBookItemLoading(p => ({ ...p, [key]: false }));
    }
  };

  // Sections
  const renderOverview = () => {
    const totalQty = data.books.reduce((s, b) => s + (b.quantity || 0), 0);
    const activeBor = data.borrows.filter(b => b.status === 'approved').length;
    const pendingBor = data.borrows.filter(b => b.status === 'pending').length;
    const overdue = data.borrows.filter(b => isOverdue(b.dueDate, b.status)).length;

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="auto_stories" label="Tổng đầu sách" value={data.books.length} accent="bg-indigo-600" />
          <StatCard icon="inventory_2" label="Tổng bản sao" value={totalQty} accent="bg-emerald-600" />
          <StatCard icon="shopping_cart" label="Đang cho mượn" value={activeBor} accent="bg-sky-600" />
          <StatCard icon="warning" label="Quá hạn" value={overdue} accent="bg-rose-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Tasks */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">notifications_active</span>
              Việc cần xử lý ngay
            </h3>
            <div className="space-y-4">
              {pendingBor > 0 && (
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">{pendingBor}</span>
                    <div>
                      <div className="font-bold text-amber-900 text-sm">Yêu cầu mượn sách mới</div>
                      <div className="text-xs text-amber-700">Đang chờ bạn phê duyệt</div>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('borrows')} className="px-4 py-2 bg-white text-amber-700 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-amber-100 transition">Xử lý</button>
                </div>
              )}
              {data.reservations.filter(r => r.status === 'pending').length > 0 && (
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">
                      {data.reservations.filter(r => r.status === 'pending').length}
                    </span>
                    <div>
                      <div className="font-bold text-indigo-900 text-sm">Yêu cầu đặt trước (Reserve)</div>
                      <div className="text-xs text-indigo-700">Có sách sắp về hoặc đang chờ duyệt</div>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('reservations')} className="px-4 py-2 bg-white text-indigo-700 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-indigo-100 transition">Xử lý</button>
                </div>
              )}
              {data.bookRequests.filter(r => r.status === 'Pending').length > 0 && (
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                      {data.bookRequests.filter(r => r.status === 'Pending').length}
                    </span>
                    <div>
                      <div className="font-bold text-emerald-900 text-sm">Yêu cầu mua sách mới từ GV</div>
                      <div className="text-xs text-emerald-700">Cần xem xét nhập thêm</div>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('requests')} className="px-4 py-2 bg-white text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-emerald-100 transition">Xử lý</button>
                </div>
              )}
              {pendingBor === 0 && data.reservations.filter(r => r.status === 'pending').length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  <span className="material-symbols-outlined text-[48px] opacity-20 block mb-2">task_alt</span>
                  <p className="text-sm font-medium">Bạn đã hoàn tất mọi việc cần làm!</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Settings or Mini Inventory */}
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-32 translate-x-32 blur-3xl opacity-50" />
            <h3 className="text-lg font-black mb-6 relative z-10">Lối tắt quản lý</h3>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              {[
                { icon: 'add_box', label: 'Thêm sách', action: () => setShowCreateBookModal(true), color: 'bg-emerald-500' },
                { icon: 'account_circle', label: 'Hội viên', href: '/admin/users', color: 'bg-sky-500' },
                { icon: 'receipt_long', label: 'Khoản phạt', action: () => setSearchParams({ tab: 'fines' }), color: 'bg-rose-500' },
                { icon: 'settings', label: 'Cài đặt hệ thống', href: '/admin/settings', color: 'bg-slate-700' },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action || (() => window.location.href = btn.href)}
                  className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/5 hover:bg-white/10 transition border border-white/10 group"
                >
                  <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${btn.color} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-[24px]">{btn.icon}</span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-widest opacity-80">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBorrows = () => {
    // Group borrows into "phiếu mượn" — same user, submitted within 5 minutes of each other
    const sorted = data.borrows.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const slips = [];
    const visited = new Set();

    for (const rec of sorted) {
      if (visited.has(rec._id)) continue;
      const userId = rec.userId?._id;
      const recTime = new Date(rec.createdAt).getTime();

      // Find all records from same user within ±5 min
      const group = sorted.filter(r => {
        if (visited.has(r._id)) return false;
        if (r.userId?._id !== userId) return false;
        const diff = Math.abs(new Date(r.createdAt).getTime() - recTime);
        return diff <= 5 * 60 * 1000;
      });

      group.forEach(r => visited.add(r._id));
      slips.push(group);
    }

    return (
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">Nhật ký mượn & trả</h3>
            <p className="text-slate-400 text-xs font-bold mt-1 tracking-widest">{slips.length} phiếu mượn — {data.borrows.length} lượt sách</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
            <button className="p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition">
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {slips.map((group, slipIdx) => (
            <BorrowSlip
              key={slipIdx}
              group={group}
              slipIdx={slipIdx}
              actionLoading={actionLoading}
              onApprove={handleApproveBorrow}
              onReject={handleRejectBorrow}
              onPickup={handlePickupBorrow}
              onReturn={(rec) => setReturnTarget(rec)}
            />
          ))}
          {slips.length === 0 && (
            <div className="py-20 text-center text-slate-300">
              <span className="material-symbols-outlined text-[64px] block mb-4">import_contacts</span>
              <p className="font-bold uppercase tracking-widest text-xs">Chưa có phiếu mượn nào</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReservations = () => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-indigo-900 tracking-tighter uppercase">Danh sách đặt trước (Reservations)</h3>
          <p className="text-slate-400 text-xs font-bold mt-1 tracking-widest">Xử lý khi sách về hoặc cho phép mượn ưu tiên</p>
        </div>
        <div className="flex gap-3 text-xs font-bold">
          <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl">
            {data.reservations.filter(r => r.status === 'pending').length} Chờ duyệt
          </span>
          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-xl">
            {data.reservations.filter(r => r.status === 'approved').length} Chờ giao
          </span>
        </div>
      </div>
      <div className="p-8">
        {data.reservations.length === 0 ? (
          <div className="text-center py-20 text-slate-300">
            <span className="material-symbols-outlined text-[64px] block mb-4">bookmark_add</span>
            <p className="font-bold uppercase tracking-widest text-xs">Không có yêu cầu đặt trước nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.reservations.slice().sort((a, b) => {
              // Sắp xếp: pending -> approved -> còn lại
              const order = { pending: 0, approved: 1, rejected: 2, fulfilled: 3, cancelled: 4 };
              return (order[a.status] ?? 5) - (order[b.status] ?? 5);
            }).map(res => {
              const isFulfilled = res.status === 'fulfilled';
              const isApproved = res.status === 'approved';
              const isPending = res.status === 'pending';
              const isExpired = res.expiresAt && new Date(res.expiresAt) < new Date() && isApproved;

              return (
                <div
                  key={res._id}
                  className={`p-6 rounded-3xl border transition bg-white shadow-sm flex flex-col gap-4
                    ${isFulfilled ? 'border-teal-200 bg-teal-50/30'
                      : isApproved ? 'border-blue-200 bg-blue-50/30 hover:border-blue-300'
                        : isPending ? 'border-amber-200 hover:border-indigo-200'
                          : 'border-slate-100 opacity-60'}`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm
                        ${isFulfilled ? 'bg-teal-100 text-teal-700'
                          : isApproved ? 'bg-blue-100 text-blue-700'
                            : 'bg-indigo-50 text-indigo-600'}`}>
                        #{res.queuePosition || 0}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 truncate max-w-[160px]">{res.bookId?.title}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                          {res.bookId?.author}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest
                      ${res.status === 'fulfilled' ? 'bg-teal-100 text-teal-700'
                        : res.status === 'approved' ? 'bg-blue-100 text-blue-700'
                          : res.status === 'pending' ? 'bg-amber-100 text-amber-700'
                            : res.status === 'rejected' ? 'bg-red-100 text-red-600'
                              : 'bg-slate-100 text-slate-500'}`}>
                      {res.status === 'fulfilled' ? 'Đã Giao Sách'
                        : res.status === 'approved' ? 'Chờ Giao'
                          : res.status === 'pending' ? 'Chờ Duyệt'
                            : res.status === 'rejected' ? 'Từ Chối'
                              : res.status}
                    </span>
                  </div>

                  {/* User info */}
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs flex-shrink-0">
                      {res.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-700 truncate">{res.userId?.name || 'Người dùng hệ thống'}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{res.userId?.studentId || res.userId?.email || ''}</div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                      <div className="text-slate-400 font-black uppercase tracking-wider mb-0.5">Ngày đặt</div>
                      <div className="font-bold text-slate-700">
                        {res.reservationDate ? new Date(res.reservationDate).toLocaleDateString('vi-VN') : '—'}
                      </div>
                    </div>
                    {isApproved && res.expiresAt && (
                      <div className={`rounded-xl p-2.5 border ${isExpired ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                        <div className={`font-black uppercase tracking-wider mb-0.5 ${isExpired ? 'text-red-400' : 'text-blue-400'}`}>
                          Hạn lấy sách
                        </div>
                        <div className={`font-bold ${isExpired ? 'text-red-600' : 'text-blue-700'}`}>
                          {new Date(res.expiresAt).toLocaleDateString('vi-VN')}
                          {isExpired && <span className="block text-[9px] font-black">QUÁ HẠN!</span>}
                        </div>
                      </div>
                    )}
                    {(isPending || isApproved) && res.requestedDueDate && (
                      <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-100">
                        <div className="text-amber-500 font-black uppercase tracking-wider mb-0.5">Dự kiến trả</div>
                        <div className="font-bold text-amber-700">
                          {new Date(res.requestedDueDate).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    )}
                    {isFulfilled && (
                      <div className="bg-teal-50 rounded-xl p-2.5 border border-teal-100">
                        <div className="text-teal-400 font-black uppercase tracking-wider mb-0.5">Đã giao</div>
                        <div className="font-bold text-teal-700">Xem tab Mượn & Trả</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleApproveReservation(res._id)}
                          className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-indigo-500/30 transition flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          Phê duyệt
                        </button>
                        <button
                          onClick={() => handleRejectReservation(res._id)}
                          disabled={actionLoading[res._id]}
                          className="flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                    {isApproved && (
                      <button
                        onClick={() => handleHandoverReservation(res._id)}
                        disabled={actionLoading[res._id]}
                        className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:from-teal-600 hover:to-emerald-600 transition shadow-lg shadow-teal-100 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading[res._id] ? (
                          <span className="material-symbols-outlined animate-spin text-[16px]">autorenew</span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px]">front_hand</span>
                            Giao Sách
                          </>
                        )}
                      </button>
                    )}
                    {isFulfilled && (
                      <div className="flex-1 py-3 bg-teal-50 text-teal-600 border border-teal-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Đã hoàn tất
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderFines = () => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
        <h3 className="text-xl font-black text-rose-900 tracking-tighter uppercase italic">Quản lý khoản phạt (Fines)</h3>
        <div className="px-4 py-2 bg-rose-50 rounded-2xl text-rose-600 font-bold text-xs border border-rose-100">
          Tổng thu dự kiến: {fmt(data.fines.filter(f => f.status === 'pending').reduce((s, f) => s + (f.amount || 0), 0))} đ
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/50 text-left">
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sinh viên</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lý do</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Số tiền</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Ngày nộp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.fines.map(fine => (
              <tr key={fine._id} className="hover:bg-slate-50/50 transition">
                <td className="px-8 py-5">
                  <div className="font-bold text-slate-800">{fine.userId?.name || 'User'}</div>
                  <div className="text-[10px] text-slate-400 font-bold">{fine.userId?.studentId}</div>
                </td>
                <td className="px-4 py-5">
                  <div className="text-xs font-bold text-slate-600 italic">#{fine.reason?.toUpperCase()}</div>
                </td>
                <td className="px-4 py-5 font-black text-rose-600">{fmt(fine.amount)} đ</td>
                <td className="px-4 py-5">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${fine.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {fine.status === 'paid' ? 'Đã thanh toán' : 'Chưa nộp'}
                  </span>
                </td>
                <td className="px-8 py-5 text-right text-[10px] font-bold text-slate-400">
                  {fine.paidAt ? fmtDate(fine.paidAt) : '---'}
                </td>
              </tr>
            ))}
            {data.fines.length === 0 && (
              <tr>
                <td colSpan={5} className="py-20 text-center text-slate-300 font-bold uppercase text-xs">Chưa có khoản phạt nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBookRequests = () => {
    const pending = data.bookRequests.filter(r => r.status === 'Pending').length;

    const statusCfg = {
      Pending: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700' },
      Approved: { label: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-700' },
      Rejected: { label: 'Từ chối', cls: 'bg-red-100 text-red-600' },
      PartiallyApproved: { label: 'Duyệt 1 phần', cls: 'bg-blue-100 text-blue-700' },
    };

    const bookStatusCfg = {
      pending: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
      approved: { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      rejected: { label: 'Từ chối', cls: 'bg-red-50 text-red-600 border-red-200' },
    };

    return (
      <>
        {/* Detail Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-8 text-white relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-20 translate-x-20 blur-2xl" />
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <div className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">Chi tiết phiếu yêu cầu</div>
                    <h2 className="text-2xl font-black tracking-tight">{selectedRequest.lecturer?.name}</h2>
                    <p className="text-emerald-300 text-sm mt-1">{selectedRequest.lecturer?.department || selectedRequest.lecturer?.email}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusCfg[selectedRequest.status]?.cls || 'bg-gray-100 text-gray-500'}`}>
                        {statusCfg[selectedRequest.status]?.label || selectedRequest.status}
                      </span>
                      <span className="text-emerald-400 text-xs font-bold">
                        {new Date(selectedRequest.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedRequest(null)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              {/* Books Table */}
              <div className="flex-1 overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[900px]">
                    <thead className="sticky top-0 bg-slate-50 z-10">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">#</th>
                        <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tên sách / Tác giả</th>
                        <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ISBN / NXB / Năm</th>
                        <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thể loại</th>
                        <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SL / Giá</th>
                        <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lý do</th>
                        <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedRequest.books.map((book, idx) => {
                        const loadKey = `${selectedRequest._id}_${idx}`;
                        const isLoading = bookItemLoading[loadKey];
                        const bCfg = bookStatusCfg[book.bookStatus] || bookStatusCfg.pending;
                        const hasStock = (book.existingStock || 0) > 0;
                        const showRejectInput = rejectInputs[idx] !== undefined;

                        return (
                          <tr key={idx} className={`transition hover:bg-slate-50/80 ${book.bookStatus === 'rejected' ? 'opacity-60' : ''}`}>
                            {/* # */}
                            <td className="px-6 py-4 text-slate-400 font-black text-[11px]">{idx + 1}</td>

                            {/* Title / Author */}
                            <td className="px-4 py-4">
                              <div className="font-bold text-slate-800 max-w-[180px]" title={book.title}>{book.title}</div>
                              <div className="text-[10px] text-slate-400 font-bold mt-0.5">{book.author || '—'}</div>
                              {hasStock && (
                                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-black text-amber-700">
                                  <span className="material-symbols-outlined text-[12px]">warning</span>
                                  Đã có {book.existingStock} cuốn trong kho
                                </div>
                              )}
                            </td>

                            {/* ISBN / Publisher */}
                            <td className="px-4 py-4">
                              <div className="text-[11px] font-bold text-slate-600">{book.isbn || <span className="text-slate-300 italic">Không có ISBN</span>}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{book.publisher || '—'} {book.publish_year ? `(${book.publish_year})` : ''}</div>
                            </td>

                            {/* Category */}
                            <td className="px-4 py-4">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">{book.categoryName || '—'}</span>
                            </td>

                            {/* Qty / Price */}
                            <td className="px-4 py-4 text-center">
                              <div className="font-black text-slate-800 text-sm">{book.quantity}</div>
                              {book.price > 0 && <div className="text-[10px] text-slate-400 font-bold">{Number(book.price).toLocaleString('vi-VN')} đ</div>}
                            </td>

                            {/* Reason */}
                            <td className="px-4 py-4">
                              <div className="text-[11px] text-slate-500 italic max-w-[140px]" title={book.reason}>{book.reason || '—'}</div>
                            </td>

                            {/* Per-book status */}
                            <td className="px-4 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${bCfg.cls}`}>
                                {bCfg.label}
                              </span>
                              {book.rejectReason && (
                                <div className="mt-1 text-[10px] text-red-500 italic max-w-[120px]">{book.rejectReason}</div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4">
                              {book.bookStatus === 'pending' && (
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleBookItemStatus(selectedRequest._id, idx, 'approved', undefined)}
                                      disabled={isLoading}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 transition disabled:opacity-50 active:scale-95"
                                    >
                                      {isLoading ? <span className="material-symbols-outlined animate-spin text-[12px]">autorenew</span> : <span className="material-symbols-outlined text-[14px]">check</span>}
                                      Duyệt
                                    </button>
                                    <button
                                      onClick={() => setRejectInputs(p => ({ ...p, [idx]: p[idx] !== undefined ? undefined : '' }))}
                                      disabled={isLoading}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[10px] font-black hover:bg-rose-100 transition disabled:opacity-50 active:scale-95"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">close</span>
                                      Từ chối
                                    </button>
                                  </div>
                                  {showRejectInput && (
                                    <div className="w-full flex flex-col gap-1.5">
                                      <textarea
                                        value={rejectInputs[idx]}
                                        onChange={e => setRejectInputs(p => ({ ...p, [idx]: e.target.value }))}
                                        placeholder="Lý do từ chối..."
                                        rows={2}
                                        className="w-full max-w-[200px] px-3 py-2 text-xs border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300/50 focus:border-rose-400 resize-none"
                                      />
                                      <button
                                        onClick={() => handleBookItemStatus(selectedRequest._id, idx, 'rejected', rejectInputs[idx])}
                                        disabled={isLoading}
                                        className="self-end flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-[10px] font-black hover:bg-rose-700 transition disabled:opacity-50"
                                      >
                                        Xác nhận từ chối
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                              {book.bookStatus !== 'pending' && (
                                <button
                                  onClick={() => handleBookItemStatus(selectedRequest._id, idx, 'pending', undefined)}
                                  disabled={isLoading}
                                  className="text-[10px] text-slate-400 underline hover:text-slate-600 transition"
                                >
                                  Hoàn tác
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div className="text-xs text-slate-500 font-bold">
                  {selectedRequest.books.filter(b => b.bookStatus === 'approved').length} duyệt ·
                  {selectedRequest.books.filter(b => b.bookStatus === 'rejected').length} từ chối ·
                  {selectedRequest.books.filter(b => b.bookStatus === 'pending').length} chờ
                </div>
                <button onClick={() => setSelectedRequest(null)}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Yêu cầu mua sách từ Giảng viên</h3>
              <p className="text-slate-400 text-xs font-bold mt-1 tracking-widest">
                {data.bookRequests.length} phiếu yêu cầu
                {pending > 0 && <span className="ml-3 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg font-black">{pending} chờ duyệt</span>}
              </p>
            </div>
          </div>

          {data.bookRequests.length === 0 ? (
            <div className="py-24 text-center text-slate-300">
              <span className="material-symbols-outlined text-[64px] block mb-4">inbox</span>
              <p className="font-bold uppercase tracking-widest text-xs">Chưa có phiếu yêu cầu nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/60">
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mã phiếu</th>
                    <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Giảng viên</th>
                    <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Số đầu sách</th>
                    <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Học kỳ</th>
                    <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gửi lúc</th>
                    <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
                    <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.bookRequests.map((req, i) => {
                    const sCfg = statusCfg[req.status] || { label: req.status, cls: 'bg-gray-100 text-gray-500' };
                    const duplicateCount = req.books.filter(b => (b.existingStock || 0) > 0).length;

                    return (
                      <tr key={req._id} className="hover:bg-slate-50/50 transition cursor-pointer" onClick={() => setSelectedRequest(req)}>
                        {/* Mã phiếu */}
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center font-black text-emerald-700 text-sm border border-emerald-100">
                              #{String(i + 1).padStart(2, '0')}
                            </div>
                            {duplicateCount > 0 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black rounded-lg">
                                <span className="material-symbols-outlined text-[12px]">warning</span>
                                {duplicateCount} trùng kho
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Giảng viên */}
                        <td className="px-4 py-5">
                          <div className="font-bold text-slate-800">{req.lecturer?.name || 'Ẩn danh'}</div>
                          <div className="text-[10px] text-slate-400 font-bold mt-0.5">{req.lecturer?.department || req.lecturer?.email}</div>
                        </td>

                        {/* Số sách */}
                        <td className="px-4 py-5 text-center">
                          <div className="text-2xl font-black text-slate-800">{req.books.length}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">đầu sách</div>
                        </td>

                        {/* Học kỳ */}
                        <td className="px-4 py-5">
                          <div className="text-xs font-bold text-slate-600">{req.semester || '—'}</div>
                        </td>

                        {/* Gửi lúc */}
                        <td className="px-4 py-5">
                          <div className="text-xs font-bold text-slate-500">
                            {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(req.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Trạng thái */}
                        <td className="px-4 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sCfg.cls}`}>
                            {sCfg.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-8 py-5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                            Xem & Duyệt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderUsers = () => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50">
        <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Cộng đồng hội viên (Users)</h3>
        <p className="text-slate-400 text-xs font-bold mt-1 tracking-widest">Quản lý hồ sơ và lịch sử mượn trả của từng người</p>
      </div>
      <div className="p-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hội viên</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã số</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thành tích</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tình trạng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.users.map(u => (
              <tr key={u._id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black">{u.name?.charAt(0)?.toUpperCase() || '?'}</div>
                    <div className="font-bold text-slate-700">{u.name || 'Hội viên ẩn danh'}</div>
                  </div>
                </td>
                <td className="px-4 py-5 font-bold text-slate-500">{u.studentId || 'Chưa có'}</td>
                <td className="px-4 py-5">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.role === 'lecturer' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-700'}`}>
                    {u.role === 'lecturer' ? 'Giảng viên' : u.role === 'student' ? 'Sinh viên' : u.role === 'librarian' ? 'Thủ thư' : u.role}
                  </span>
                </td>
                <td className="px-4 py-5 font-bold text-emerald-600 text-[11px]">
                  {data.borrows.filter(b => b.userId?._id === u._id && b.status === 'returned').length} cuốn đã trả
                </td>
                <td className="px-4 py-5 text-right">
                  <div className={`w-2 h-2 rounded-full ml-auto ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBooks = () => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Quản lý kho sách</h3>
          <p className="text-slate-400 text-xs font-bold mt-1 tracking-widest">{data.books.length} đầu sách trong kho</p>
        </div>
        <button
          onClick={() => setShowCreateBookModal(true)}
          className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition shadow-xl active:scale-95 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add_box</span>
          Thêm sách mới
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/50 text-left">
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sách</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tác giả / NXB</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kho / Vị trí</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.books.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(book => (
              <tr key={book._id} className="hover:bg-slate-50/50 transition">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <img
                      src={book.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=2574&auto=format&fit=crop'}
                      className="w-10 h-14 object-cover rounded-lg shadow-sm shrink-0"
                      alt={book.title}
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-sm max-w-[200px] truncate">{book.title}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ISBN: {book.isbn || 'Không có'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-5">
                  <div className="text-xs font-bold text-slate-600">{book.author}</div>
                  <div className="text-[10px] text-slate-400 mt-1 italic">{book.publisher || 'NXB chưa rõ'}</div>
                </td>
                <td className="px-4 py-5">
                  <div className="font-black text-[11px] text-slate-700">
                    {book.available} / {book.quantity} <span className="text-[9px] font-bold text-slate-400 uppercase">sẵn sàng</span>
                  </div>
                  <div className="text-[9px] text-indigo-500 font-black mt-1 uppercase tracking-tighter">
                    <span className="material-symbols-outlined text-[10px] align-middle mr-1">location_on</span>
                    {book.location || 'Chưa xếp chỗ'}
                  </div>
                </td>
                <td className="px-4 py-5">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${book.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {book.status === 'available' ? 'CÓ SẴN' : book.status === 'maintenance' ? 'BẢO TRÌ' : 'HẾT SÁCH'}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/books/${book._id}`}
                      className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-400 transition active:scale-95 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      Xem
                    </Link>
                    <button
                      onClick={() => setEditTarget(book)}
                      className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-slate-900/30 transition active:scale-95 shadow-md shadow-slate-900/10"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Sửa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin" />
        <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-400">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="pb-20 max-w-7xl mx-auto space-y-10">
      {/* ── Return Workflow Modals ── */}
      {returnTarget && <ReturnModal record={returnTarget} onClose={() => setReturnTarget(null)} onSuccess={(res) => { setReturnTarget(null); setReturnResult(res); fetchData(); }} />}
      {returnResult && <ResultModal result={returnResult} onClose={() => setReturnResult(null)} />}
      {showCreateBookModal && <CreateBookModal onClose={() => setShowCreateBookModal(false)} onSuccess={fetchData} />}
      {editTarget && <EditBookModal book={editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchData} />}

      {/* ── Sidebar-driven Content Area ── */}
      <div className="pt-4">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'books' && renderBooks()}
        {activeTab === 'borrows' && renderBorrows()}
        {activeTab === 'reservations' && renderReservations()}
        {activeTab === 'requests' && renderBookRequests()}
        {activeTab === 'fines' && renderFines()}
      </div>
    </div>
  );
};

export default LibrarianDashboard;