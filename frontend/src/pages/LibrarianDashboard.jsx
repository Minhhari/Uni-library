import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CreateBookModal } from '../components';

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
  const [actionLoading, setActionLoading] = useState({});

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

  const handleUpdateRequestStatus = async (id, status) => {
    try {
      await api.put(`/book-requests/${id}/status`, { status });
      toast.success(`Đã cập nhật trạng thái: ${status}`);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi');
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
                  <button onClick={() => setActiveTab('requests')} className="px-4 py-2 bg-white text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-emerald-100 transition">Xem</button>
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

  const renderBorrows = () => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">Nhật ký mượn & trả</h3>
          <p className="text-slate-400 text-xs font-bold mt-1 tracking-widest">{data.borrows.length} lượt giao dịch</p>
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/50 text-left">
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Người mượn</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sách</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dự kiến trả</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.borrows.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(rec => {
              const statusKey = isOverdue(rec.dueDate, rec.status) ? 'overdue' : rec.status;
              const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
              return (
                <tr key={rec._id} className="hover:bg-slate-50/50 transition">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 text-[11px] font-black">
                        {rec.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{rec.userId?.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{rec.userId?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-semibold text-slate-700 max-w-[200px] truncate">{rec.bookId?.title}</div>
                  </td>
                  <td className="px-4 py-5">
                    <div className={`font-black text-[11px] ${isOverdue(rec.dueDate, rec.status) ? 'text-rose-500' : 'text-slate-500'}`}>
                      {fmtDate(rec.dueDate)}
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest ${cfg.bg}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {rec.status === 'pending' && (
                        <>
                          <button onClick={() => handleApproveBorrow(rec._id)} className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition shadow-lg shadow-emerald-100">
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          </button>
                          <button
                            onClick={() => handleRejectBorrow(rec._id)}
                            disabled={actionLoading[rec._id]}
                            className="w-8 h-8 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-300 transition disabled:opacity-50"
                          >
                            {actionLoading[rec._id] ? (
                              <span className="material-symbols-outlined animate-spin text-[16px]">autorenew</span>
                            ) : (
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            )}
                          </button>
                        </>
                      )}
                      {rec.status === 'approved' && (
                        <button onClick={() => setReturnTarget(rec)} className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-lg shadow-slate-200">
                          <span className="material-symbols-outlined text-[16px]">assignment_return</span>
                          Nhận sách
                        </button>
                      )}
                      {rec.status === 'returned' && (
                        <span className="text-[10px] font-black text-slate-300 uppercase italic">Hoàn tất</span>
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
  );

  const renderReservations = () => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50">
        <h3 className="text-xl font-black text-indigo-900 tracking-tighter uppercase">Danh sách đặt chỗ (Reservations)</h3>
        <p className="text-slate-400 text-xs font-bold mt-1 tracking-widest">Xử lý khi sách về hoặc cho phép mượn ưu tiên</p>
      </div>
      <div className="p-8">
        {data.reservations.length === 0 ? (
          <div className="text-center py-20 text-slate-300">
            <span className="material-symbols-outlined text-[64px] block mb-4">bookmark_add</span>
            <p className="font-bold uppercase tracking-widest text-xs">Không có yêu cầu đặt trước nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.reservations.map(res => (
              <div key={res._id} className="p-6 rounded-3xl border border-slate-100 hover:border-indigo-200 transition bg-white shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                      #{res.queuePosition || 0}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 truncate max-w-[150px]">{res.bookId?.title}</div>
                      <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Hạng {res.queuePosition} trong hàng đợi</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${res.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {res.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl font-bold">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  {res.userId?.name || res.userId?.fullName}
                </div>
                <div className="flex gap-2 mt-auto">
                  {res.status === 'pending' && (
                    <button onClick={() => handleApproveReservation(res._id)} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition">Phê duyệt</button>
                  )}
                  <button className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition">Hủy bỏ</button>
                </div>
              </div>
            ))}
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

  const renderBookRequests = () => (
    <div className="bg-emerald-900 rounded-[2rem] shadow-2xl overflow-hidden text-white">
      <div className="p-10 border-b border-white/10">
        <h3 className="text-2xl font-black tracking-tighter uppercase italic">Yêu cầu từ Giảng viên (Lecturer Requests)</h3>
        <p className="text-emerald-400 text-xs font-bold mt-2 tracking-widest opacity-80 underline underline-offset-4">Danh sách sách cần bổ sung cho học kỳ tới</p>
      </div>
      <div className="p-10">
        <div className="grid grid-cols-1 gap-6">
          {data.bookRequests.map(req => (
            <div key={req._id} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/[0.08] transition relative group">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
                      <span className="material-symbols-outlined text-[32px]">campaign</span>
                    </div>
                    <div>
                      <div className="text-lg font-black">{req.lecturer?.name}</div>
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{req.lecturer?.department}</div>
                    </div>
                    <span className={`ml-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg
                      ${req.status === 'Approved' ? 'bg-emerald-500 text-white' : req.status === 'Rejected' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-amber-900'}`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {req.books?.map((b, i) => (
                      <span key={i} className="px-4 py-2 bg-white/10 rounded-xl text-[11px] font-bold border border-white/5 group-hover:bg-white/20 transition-colors">
                        {b.title} <span className="opacity-50 ml-1">x {b.quantity}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {req.status === 'Pending' && (
                    <>
                      <button onClick={() => handleUpdateRequestStatus(req._id, 'Approved')} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-xl shadow-emerald-500/20 active:scale-95">Duyệt nhập</button>
                      <button onClick={() => handleUpdateRequestStatus(req._id, 'Rejected')} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest text-xs transition active:scale-95">Từ chối</button>
                    </>
                  )}
                  {req.status !== 'Pending' && (
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Ghi chú xử lý</div>
                      <div className="text-sm font-bold italic">"{req.note || 'Đã xử lý xong'}"</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {data.bookRequests.length === 0 && (
            <div className="py-20 text-center text-white/20 font-black uppercase tracking-[0.3em]">Hệ thống chưa có yêu cầu mua sách nào</div>
          )}
        </div>
      </div>
    </div>
  );

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
                    <div className="font-bold text-slate-700">{u.name || 'Anonymous'}</div>
                  </div>
                </td>
                <td className="px-4 py-5 font-bold text-slate-500">{u.studentId || 'N/A'}</td>
                <td className="px-4 py-5">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.role === 'lecturer' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-700'}`}>
                    {u.role}
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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin" />
        <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-400">Loading Universe...</p>
      </div>
    );
  }

  return (
    <div className="pb-20 max-w-7xl mx-auto space-y-10">
      {/* ── Return Workflow Modals ── */}
      {returnTarget && <ReturnModal record={returnTarget} onClose={() => setReturnTarget(null)} onSuccess={(res) => { setReturnTarget(null); setReturnResult(res); fetchData(); }} />}
      {returnResult && <ResultModal result={returnResult} onClose={() => setReturnResult(null)} />}
      {showCreateBookModal && <CreateBookModal onClose={() => setShowCreateBookModal(false)} onSuccess={fetchData} />}

      {/* ── Sidebar-driven Content Area ── */}
      <div className="pt-4">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'borrows' && renderBorrows()}
        {activeTab === 'reservations' && renderReservations()}
        {activeTab === 'requests' && renderBookRequests()}
        {activeTab === 'fines' && renderFines()}
      </div>
    </div>
  );
};

export default LibrarianDashboard;