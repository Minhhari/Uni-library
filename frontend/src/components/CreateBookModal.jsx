import React, { useState, useEffect } from 'react';
import { bookAPI } from '../services/api';
import { toast } from 'react-toastify';

const CreateBookModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        category: '',
        isbn: '',
        publisher: '',
        publish_year: new Date().getFullYear(),
        description: '',
        cover_image: '',
        quantity: 1,
        location: ''
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingCats, setFetchingCats] = useState(true);

    useEffect(() => {
        const loadCats = async () => {
            try {
                const res = await bookAPI.getCategories();
                if (res.data.success) {
                    setCategories(res.data.data);
                }
            } catch (err) {
                console.error('Failed to load categories', err);
                toast.error('Không thể tải danh sách danh mục');
            } finally {
                setFetchingCats(false);
            }
        };
        loadCats();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantity' || name === 'publish_year' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await bookAPI.addBook(formData);
            if (res.data.success) {
                toast.success('Thêm sách mới thành công!');
                onSuccess && onSuccess(res.data.data);
                onClose();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi thêm sách');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-10 animate-in fade-in zoom-in-95 duration-300 my-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Thêm sách mới</h2>
                        <p className="text-slate-400 text-xs font-bold mt-1 tracking-widest uppercase">Nhập thông tin chi tiết vào kho lưu trữ</p>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-2xl hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-900">
                        <span className="material-symbols-outlined text-[28px]">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên sách</label>
                        <input
                            required
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Nhập tiêu đề sách..."
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tác giả</label>
                        <input
                            required
                            name="author"
                            value={formData.author}
                            onChange={handleChange}
                            placeholder="Tên tác giả..."
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Danh mục</label>
                        <select
                            required
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium appearance-none"
                        >
                            <option value="">Chọn danh mục...</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã ISBN</label>
                        <input
                            required
                            name="isbn"
                            value={formData.isbn}
                            onChange={handleChange}
                            placeholder="Ví dụ: 978-..."
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nhà xuất bản</label>
                        <input
                            required
                            name="publisher"
                            value={formData.publisher}
                            onChange={handleChange}
                            placeholder="NXB..."
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Năm xuất bản</label>
                        <input
                            required
                            type="number"
                            name="publish_year"
                            value={formData.publish_year}
                            onChange={handleChange}
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số lượng nhập</label>
                        <input
                            required
                            type="number"
                            name="quantity"
                            min="1"
                            value={formData.quantity}
                            onChange={handleChange}
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium"
                        />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Ảnh bìa</label>
                        <input
                            name="cover_image"
                            value={formData.cover_image}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium"
                        />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả tóm tắt</label>
                        <textarea
                            name="description"
                            rows="3"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Nội dung chính của sách..."
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium resize-none"
                        />
                    </div>

                    <div className="md:col-span-2 flex gap-4 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition active:scale-95"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading || fetchingCats}
                            className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Đang lưu...' : 'Xác nhận thêm sách'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBookModal;
