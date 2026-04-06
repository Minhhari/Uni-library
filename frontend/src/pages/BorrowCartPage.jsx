import React, { useState, useEffect } from 'react';
import { useBorrowCart } from '../context/BorrowCartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const BorrowCartPage = () => {
    const { cartItems, removeFromCart, clearCart, count } = useBorrowCart();
    const { isAuthenticated, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [maxBooks, setMaxBooks] = useState(5);
    const [activeBorrows, setActiveBorrows] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLimits = async () => {
            if (isAuthenticated) {
                try {
                    const token = localStorage.getItem('lms_token');
                    const [settingsRes, borrowsRes] = await Promise.all([
                        fetch(`${API_URL}/users/settings/public`, {
                            headers: { Authorization: `Bearer ${token}` }
                        }),
                        fetch(`${API_URL}/borrow/my-books`, {
                            headers: { Authorization: `Bearer ${token}` }
                        })
                    ]);
                    
                    const settingsData = await settingsRes.json();
                    if (settingsData.success) {
                        setMaxBooks(Number(settingsData.settings.maxBooksPerUser) || 5);
                    }

                    const borrowsData = await borrowsRes.json();
                    if (borrowsData.success) {
                        const active = borrowsData.data.filter(b => 
                            ['pending', 'approved', 'waiting_for_pickup'].includes(b.status)
                        ).length;
                        setActiveBorrows(active);
                    }
                } catch (err) {
                    console.error('Failed to fetch limits');
                }
            }
        };
        fetchLimits();
    }, [isAuthenticated]);

    const handleBorrowAll = async () => {
        if (!isAuthenticated) {
            toast.error('Bạn cần đăng nhập để mượn sách.');
            return;
        }

        if (activeBorrows + count > maxBooks) {
            toast.error(`Tổng số sách mượn (${activeBorrows + count}) vượt quá giới hạn cho phép (${maxBooks}).`);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('lms_token');
            const items = cartItems.map(item => ({
                bookId: item._id,
                requestedDueDate: item.requestedDueDate
            }));

            const res = await fetch(`${API_URL}/borrow/request-batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ items }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Gửi yêu cầu mượn thành công!');
                clearCart();
                navigate('/my-activity');
            } else {
                toast.error(data.message || 'Không thể gửi yêu cầu mượn sách.');
            }
        } catch (err) {
            toast.error('Lỗi kết nối server.');
        } finally {
            setLoading(false);
        }
    };

    const remainingSlots = maxBooks - activeBorrows;

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-500">
            <header className="mb-12 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Giỏ mượn sách</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                        {count} quyển trong danh sách — Còn trống {remainingSlots - count} chỗ trong giới hạn {maxBooks} quyển
                    </p>
                </div>
                <Link to="/books" className="text-primary font-black text-sm flex items-center gap-2 hover:underline">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Tiếp tục tìm sách
                </Link>
            </header>

            {cartItems.length === 0 ? (
                <div className="bg-slate-50 rounded-[2.5rem] py-24 text-center border-2 border-dashed border-slate-100">
                    <span className="material-symbols-outlined text-[80px] text-slate-200 mb-6 block">import_contacts</span>
                    <h3 className="text-xl font-bold text-slate-400 mb-8">Bạn chưa thêm quyển sách nào vào danh sách mượn</h3>
                    <Link 
                        to="/books" 
                        className="px-10 py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all inline-flex items-center gap-3"
                    >
                        <span className="material-symbols-outlined">explore</span>
                        Khám phá kho sách
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* List */}
                    <div className="md:col-span-2 space-y-4">
                        {cartItems.map((item) => (
                            <div key={item._id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex gap-6 group relative">
                                <img src={item.cover_image} alt={item.title} className="w-24 h-36 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-500" />
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h3 className="text-xl font-black text-slate-900 mb-1 truncate">{item.title}</h3>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">{item.author}</p>
                                    
                                    <div className="flex items-center gap-6">
                                        <div className="flex-1 bg-slate-50 rounded-xl px-4 py-2 border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày trả dự kiến</p>
                                            <p className="font-bold text-slate-700 text-sm">{new Date(item.requestedDueDate).toLocaleDateString('vi-VN')}</p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => removeFromCart(item._id)}
                                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100"
                                        title="Xóa khỏi danh sách"
                                    >
                                        <span className="material-symbols-outlined text-xl">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="md:col-span-1">
                        <div className="bg-white rounded-[2.5rem] p-8 sticky top-24 shadow-xl border border-slate-100 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16" />
                            
                            <h2 className="text-2xl font-black mb-8 relative z-10 text-slate-900">Tổng quát</h2>
                            
                            <div className="space-y-6 mb-10 relative z-10">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Số lượng</span>
                                    <span className="text-2xl font-black text-slate-900">{count} quyển</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Slot còn lại</span>
                                    <span className="text-emerald-600 font-bold">{remainingSlots - count} / {maxBooks}</span>
                                </div>
                            </div>

                            <button
                                disabled={loading || count === 0}
                                onClick={handleBorrowAll}
                                className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap text-base"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                                ) : (
                                    <span className="material-symbols-outlined text-xl flex-shrink-0">send</span>
                                )}
                                <span>Xác nhận mượn </span>
                            </button>
                            
                            <p className="mt-6 text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                Đơn mượn sẽ được chuyển đến Thủ thư. Vui lòng theo dõi trạng thái tại mục Hoạt động.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BorrowCartPage;