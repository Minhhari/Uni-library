import React, { useState, useEffect } from 'react';
import { bookAPI, uploadAPI } from '../services/api';
import { toast } from 'react-toastify';

const EditBookModal = ({ book, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: book.title || '',
        author: book.author || '',
        category: book.category?._id || book.category || '',
        isbn: book.isbn || '',
        publisher: book.publisher || '',
        publish_year: book.publish_year || new Date().getFullYear(),
        description: book.description || '',
        quantity: book.quantity || 1,
        location: book.location || '',
        status: book.status || 'available'
    });

    const [coverFile, setCoverFile] = useState(null);
    const [previewFiles, setPreviewFiles] = useState([]);
    // To show existing images
    const [existingCover, setExistingCover] = useState(book.cover_image || '');
    const [existingPreviews, setExistingPreviews] = useState(book.previewImages || []);

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
            const processedData = { ...formData };

            // 1. Upload Cover Image (if new one selected)
            if (coverFile) {
                const coverData = new FormData();
                coverData.append('image', coverFile);
                const coverRes = await uploadAPI.uploadSingle(coverData);
                if (coverRes.data.success) {
                    processedData.cover_image = coverRes.data.data;
                }
            } else {
                processedData.cover_image = existingCover;
            }

            // 2. Upload Preview Images (if new ones selected)
            if (previewFiles.length > 0) {
                const previewData = new FormData();
                previewFiles.forEach(file => {
                    previewData.append('images', file);
                });
                const previewRes = await uploadAPI.uploadMultiple(previewData);
                if (previewRes.data.success) {
                    // Combine or replace? In this case, we'll replace for simplicity unless user wants to manage individual previews
                    processedData.previewImages = previewRes.data.data;
                }
            } else {
                processedData.previewImages = existingPreviews;
            }

            // 3. Update Book
            const res = await bookAPI.updateBook(book._id, processedData);
            if (res.data.success) {
                toast.success('Cập nhật thông tin sách thành công!');
                onSuccess && onSuccess(res.data.data);
                onClose();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sách');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-10 animate-in fade-in zoom-in-95 duration-300 my-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Chỉnh sửa sách</h2>
                        <p className="text-slate-400 text-xs font-bold mt-1 tracking-widest uppercase">Cập nhật thông tin cho cuốn "{book.title}"</p>
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số lượng tổng</label>
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

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vị trí kệ</label>
                        <input
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Ví dụ: Kệ A1, Tầng 2"
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium appearance-none"
                        >
                            <option value="available">Có sẵn</option>
                            <option value="maintenance">Bảo trì</option>
                            <option value="lost">Mất sách</option>
                        </select>
                    </div>

                    <div className="md:col-span-2 space-y-2 mt-2">
                        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Ảnh bìa hiện tại</label>
                        <div className="flex items-end gap-6 p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                            {existingCover ? (
                                <img src={existingCover} alt="Current Cover" className="w-24 h-36 object-cover rounded-2xl shadow-lg" />
                            ) : (
                                <div className="w-24 h-36 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined text-4xl">image</span>
                                </div>
                            )}
                            <div className="flex-1 space-y-3">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Thay đổi ảnh bìa (Tùy chọn)</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setCoverFile(e.target.files[0])}
                                    className="w-full text-xs font-bold text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-2 mt-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ảnh phụ lục / Đọc thử (Tối đa 5 ảnh)</label>

                        {/* Show existing previews */}
                        {existingPreviews.length > 0 && !previewFiles.length && (
                            <div className="flex gap-2 mb-4 overflow-x-auto p-2">
                                {existingPreviews.map((url, idx) => (
                                    <div key={idx} className="relative group shrink-0">
                                        <img src={url} className="w-16 h-24 object-cover rounded-xl border border-slate-200 outline outline-2 outline-transparent group-hover:outline-emerald-500 transition-all" alt={`preview-${idx}`} />
                                    </div>
                                ))}
                                <div className="flex items-center px-4 text-[10px] text-slate-400 font-bold italic">
                                    (Ảnh hiện tại)
                                </div>
                            </div>
                        )}

                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                    const files = Array.from(e.target.files);
                                    if (files.length > 5) {
                                        toast.warning('Chỉ được chọn tối đa 5 ảnh!');
                                        e.target.value = ''; // Reset
                                    } else {
                                        setPreviewFiles(files);
                                    }
                                }}
                                className="w-full text-xs font-bold text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/5 file:text-primary hover:file:bg-primary/10"
                            />
                            <p className="text-[10px] text-slate-400 mt-3 ml-1 font-bold italic">* Lưu ý: Tải lên ảnh mới sẽ thay thế toàn bộ ảnh phụ lục cũ.</p>
                        </div>
                    </div>

                    <div className="md:col-span-2 flex gap-4 mt-8">
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
                            className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditBookModal;
