import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { bookAPI, borrowAPI } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const BookDetailPage = () => {
    const { id } = useParams();
    const { isAuthenticated } = useAuth();

    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showBorrowModal, setShowBorrowModal] = useState(false);

    // Borrow state
    const [borrowLoading, setBorrowLoading] = useState(false);
    const [borrowResult, setBorrowResult] = useState(null);

    // Reserve state
    const [reserveLoading, setReserveLoading] = useState(false);
    const [reserveResult, setReserveResult] = useState(null);

    // Fetch book details from real API
    useEffect(() => {
        const fetchBook = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_URL}/books/details/${id}`);
                const data = await res.json();
                if (data.success) {
                    setBook(data.data);
                } else {
                    setError(data.message || 'Không tìm thấy sách.');
                }
            } catch (err) {
                setError('Lỗi kết nối server. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };
        fetchBook();
    }, [id]);

    // Borrow Now → POST /api/borrow/request
    const handleBorrow = async () => {
        if (!isAuthenticated) {
            setBorrowResult({ success: false, message: 'Bạn cần đăng nhập để mượn sách.' });
            return;
        }
        setBorrowLoading(true);
        setBorrowResult(null);
        try {
            const token = localStorage.getItem('lms_token');
            const res = await fetch(`${API_URL}/borrow/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ bookId: id }),
            });
            const data = await res.json();
            if (res.ok) {
                setBorrowResult({ success: true, message: data.message || 'Yêu cầu mượn sách đã được gửi!' });
            } else {
                setBorrowResult({ success: false, message: data.message || 'Không thể gửi yêu cầu mượn sách.' });
            }
        } catch (err) {
            setBorrowResult({ success: false, message: 'Lỗi kết nối server.' });
        } finally {
            setBorrowLoading(false);
        }
    };

    // Reserve → POST /api/reservation
    const handleReserve = async () => {
        if (!isAuthenticated) {
            setReserveResult({ success: false, message: 'Bạn cần đăng nhập để đặt trước sách.' });
            return;
        }
        setReserveLoading(true);
        setReserveResult(null);
        try {
            const token = localStorage.getItem('lms_token');
            const res = await fetch(`${API_URL}/reservation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ bookId: id }),
            });
            const data = await res.json();
            if (res.ok) {
                setReserveResult({ success: true, message: data.message || 'Đặt trước sách thành công!' });
            } else {
                setReserveResult({ success: false, message: data.message || 'Không thể đặt trước sách.' });
            }
        } catch (err) {
            setReserveResult({ success: false, message: 'Lỗi kết nối server.' });
        } finally {
            setReserveLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-on-surface-variant font-medium">Đang tải thông tin sách...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <span className="material-symbols-outlined text-6xl text-error">menu_book</span>
                    <p className="text-xl font-bold text-on-surface">{error}</p>
                    <Link to="/books" className="inline-block px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:opacity-90 transition">
                        Quay lại danh sách sách
                    </Link>
                </div>
            </div>
        );
    }

    const isAvailable = book.available > 0 && book.status === 'available';
    const coverImage = book.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=2574&auto=format&fit=crop';
    const categoryName = book.category?.name || 'Chưa phân loại';
    const statusLabel = isAvailable ? 'AVAILABLE' : book.status === 'maintenance' ? 'MAINTENANCE' : 'UNAVAILABLE';
    const statusColor = isAvailable
        ? 'bg-emerald-50 text-emerald-600 border border-emerald-500/20'
        : 'bg-red-50 text-red-600 border border-red-500/20';

    return (
        <div className="flex flex-col gap-12 animate-in fade-in transition-all duration-700">
            {/* Hero Banner */}
            <section className="-mt-10 -mx-10 relative h-[400px] bg-surface flex items-center justify-center overflow-hidden border-b border-surface-container-low shadow-sm">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/40 to-surface z-10 blur-3xl"></div>
                    <img src={coverImage} className="w-full h-full object-cover blur-3xl opacity-30 transform scale-125" alt="bg" />
                </div>
                <div className="relative z-20 flex flex-col md:flex-row items-center gap-12 max-w-7xl px-8 w-full">
                    <div className="shrink-0 transform -rotate-3 hover:rotate-0 transition-all duration-500 shadow-2xl p-2 bg-white rounded-3xl group">
                        <img src={coverImage} className="w-56 h-80 object-cover rounded-2xl shadow-inner group-hover:scale-105 transition-transform" alt={book.title} />
                    </div>
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase rounded-full">{categoryName}</span>
                            <span className={`px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-full ${statusColor}`}>{statusLabel}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight text-on-surface drop-shadow-sm">{book.title}</h1>
                        <div className="flex items-center gap-4 justify-center md:justify-start flex-wrap">
                            <span className="text-on-surface-variant font-bold text-xl opacity-80">By {book.author}</span>
                            <span className="w-1.5 h-1.5 bg-outline-variant/30 rounded-full"></span>
                            <span className="text-on-surface-variant/60 font-medium">Năm: {book.publish_year}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Action Bar */}
            <section className="relative z-30 -mt-20">
                <div className="bg-white/80 backdrop-blur-3xl p-8 rounded-[40px] shadow-2xl border border-white/60 flex flex-col lg:flex-row items-center justify-between gap-8 group">
                    <div className="flex flex-col md:flex-row items-center gap-8 px-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-4 h-4 rounded-full shadow-lg ${isAvailable ? 'bg-emerald-500 animate-pulse shadow-emerald-500/50' : 'bg-red-400'}`}></div>
                            <span className="text-2xl font-black text-on-surface flex items-baseline gap-1">
                                {book.available}
                                <span className="text-sm font-bold text-on-surface-variant/40">of {book.quantity} copies available</span>
                            </span>
                        </div>
                        {book.location && (
                            <>
                                <div className="h-10 w-[1px] bg-outline-variant/20 hidden md:block"></div>
                                <div className="flex items-center gap-2 text-on-surface-variant font-bold group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">location_on</span>
                                    <span>{book.location}</span>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        {/* Borrow Now */}
                        <button
                            onClick={() => { setBorrowResult(null); setShowBorrowModal(true); }}
                            disabled={!isAvailable}
                            className={`flex-1 lg:flex-none px-12 py-5 font-black rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3 text-lg ${isAvailable
                                ? 'bg-gradient-to-r from-primary to-primary-container text-white hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] shadow-primary/20'
                                : 'bg-surface-container-low text-on-surface-variant cursor-not-allowed opacity-60'}`}
                        >
                            <span className="material-symbols-outlined text-2xl">auto_stories</span>
                            Borrow Now
                        </button>

                        {/* Reserve */}
                        <button
                            onClick={handleReserve}
                            disabled={reserveLoading}
                            className="hidden sm:flex items-center gap-2 px-8 py-5 bg-surface-container-low text-on-surface font-bold rounded-3xl hover:bg-primary/5 transition-all w-44 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {reserveLoading
                                ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                : <span className="material-symbols-outlined text-xl">bookmark_add</span>}
                            Reserve
                        </button>
                    </div>
                </div>

                {/* Reserve feedback */}
                {reserveResult && (
                    <div className={`mt-4 px-6 py-4 rounded-2xl text-sm font-bold ${reserveResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {reserveResult.success ? '✓ ' : '✗ '}{reserveResult.message}
                    </div>
                )}
            </section>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 pb-20 mt-4">
                <div className="lg:col-span-2 space-y-12">
                    <div>
                        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                            Mô tả
                        </h2>
                        <div className="text-on-surface-variant/80 text-xl leading-relaxed">
                            {book.description
                                ? <p>{book.description}</p>
                                : <p className="italic text-on-surface-variant/40">Chưa có mô tả cho cuốn sách này.</p>}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    <div className="bg-surface-container-low/40 rounded-[32px] p-8 border border-white/40 shadow-sm space-y-6">
                        <MetaRow icon="book_2" label="ISBN" value={book.isbn} />
                        <MetaRow icon="business" label="Nhà xuất bản" value={book.publisher} />
                        <MetaRow icon="calendar_today" label="Năm xuất bản" value={book.publish_year} />
                        <MetaRow icon="category" label="Thể loại" value={categoryName} />
                        {book.location && <MetaRow icon="location_on" label="Vị trí" value={book.location} />}
                        <MetaRow
                            icon={isAvailable ? 'check_circle' : 'cancel'}
                            label="Trạng thái kho"
                            value={`${book.available}/${book.quantity} cuốn còn lại`}
                            valueClass={isAvailable ? 'text-emerald-600' : 'text-red-500'}
                        />
                    </div>
                </div>
            </div>

            {/* Borrow Modal */}
            {showBorrowModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-on-background/40 backdrop-blur-xl animate-in fade-in"
                        onClick={() => { setShowBorrowModal(false); setBorrowResult(null); }}
                    ></div>
                    <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in duration-500 border border-white/60">
                        <div className="p-8 border-b border-surface-container-low flex justify-between items-center bg-surface-container-low/20">
                            <h2 className="text-2xl font-black tracking-tight">Xác nhận mượn sách</h2>
                            <button onClick={() => { setShowBorrowModal(false); setBorrowResult(null); }} className="w-12 h-12 rounded-2xl hover:bg-surface-container-high transition-all flex items-center justify-center text-on-surface-variant">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="flex gap-6 p-6 bg-surface-container-low/40 rounded-[32px] border border-white/40">
                                <img src={coverImage} className="w-20 h-28 object-cover rounded-2xl shadow-xl transform -rotate-2" alt="Book Thumbnail" />
                                <div className="flex flex-col justify-center gap-2">
                                    <p className="text-xl font-black text-on-surface tracking-tight">{book.title}</p>
                                    <p className="text-on-surface-variant font-bold opacity-60">By {book.author}</p>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg w-fit ${isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                        {book.available} cuốn còn lại
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-surface-container-low/60 rounded-[28px] border border-white/60">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined filled">calendar_today</span>
                                    </div>
                                    <span className="font-bold text-on-surface">Thời hạn mượn: 10 tuần (70 ngày)</span>
                                </div>
                            </div>

                            {borrowResult && (
                                <div className={`px-6 py-4 rounded-2xl text-sm font-bold ${borrowResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {borrowResult.success ? '✓ ' : '✗ '}{borrowResult.message}
                                </div>
                            )}
                        </div>

                        <div className="p-10 bg-surface-container-low/40 flex flex-col gap-5 border-t border-surface-container-low">
                            <p className="text-[10px] text-center text-on-surface-variant/60 font-medium px-4">
                                Bằng cách xác nhận, bạn đồng ý với chính sách mượn sách của thư viện.
                            </p>
                            {!borrowResult?.success ? (
                                <button
                                    disabled={borrowLoading}
                                    onClick={handleBorrow}
                                    className="w-full py-6 bg-gradient-to-r from-primary to-primary-container text-white font-black rounded-[28px] shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.95] transition-all text-xl tracking-tight flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                                >
                                    {borrowLoading
                                        ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        : <span className="material-symbols-outlined text-2xl">auto_stories</span>}
                                    {borrowLoading ? 'Đang gửi yêu cầu...' : 'Xác nhận mượn sách'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setShowBorrowModal(false); setBorrowResult(null); }}
                                    className="w-full py-6 bg-surface-container-low text-on-surface font-black rounded-[28px] hover:bg-surface-container-high transition-all text-xl tracking-tight"
                                >
                                    Đóng
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MetaRow = ({ icon, label, value, valueClass = '' }) => (
    <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div>
            <p className="text-[10px] text-on-surface-variant opacity-50 font-black uppercase tracking-widest mb-0.5">{label}</p>
            <p className={`font-bold text-on-surface tracking-tight ${valueClass}`}>{value}</p>
        </div>
    </div>
);

export default BookDetailPage;