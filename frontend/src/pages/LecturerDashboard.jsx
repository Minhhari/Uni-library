import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { bookRequestAPI } from '../services/api';

const LecturerBookRequestPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    // Manual form state
    const [books, setBooks] = useState([{ title: '', major: '', quantity: 1 }]);
    const [semester, setSemester] = useState('Upcoming Semester');
    const [submitLoading, setSubmitLoading] = useState(false);

    // Upload state
    const [file, setFile] = useState(null);

    const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'upload'

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const fetchMyRequests = async () => {
        try {
            setLoading(true);
            const res = await bookRequestAPI.getMyRequests();
            if (res.data?.success) {
                setRequests(res.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải lịch sử:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRow = () => {
        setBooks([...books, { title: '', major: '', quantity: 1 }]);
    };

    const handleRemoveRow = (index) => {
        if (books.length > 1) {
            const newBooks = [...books];
            newBooks.splice(index, 1);
            setBooks(newBooks);
        }
    };

    const handleBookChange = (index, field, value) => {
        const newBooks = [...books];
        newBooks[index][field] = value;
        setBooks(newBooks);
    };

    const submitManualRequest = async (e) => {
        e.preventDefault();
        try {
            setSubmitLoading(true);
            // Validate
            const validBooks = books.filter(b => b.title.trim() !== '' && b.major.trim() !== '');
            if (validBooks.length === 0) {
                toast.warning('Vui lòng điền tên sách và ngành cho ít nhất 1 dòng.');
                return;
            }

            const res = await bookRequestAPI.createRequest({
                books: validBooks,
                semester
            });

            if (res.data?.success) {
                toast.success('Gửi yêu cầu thành công!');
                setBooks([{ title: '', major: '', quantity: 1 }]);
                fetchMyRequests();
            }
        } catch (error) {
            console.error('Lỗi khi gửi:', error);
            toast.error('Gửi yêu cầu thất bại. Vui lòng thử lại.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const submitUploadRequest = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.warning('Vui lòng chọn file Excel.');
            return;
        }

        try {
            setSubmitLoading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('semester', semester);

            const res = await bookRequestAPI.uploadExcel(formData);
            if (res.data?.success) {
                toast.success('Tải file và tạo yêu cầu thành công!');
                setFile(null);
                fetchMyRequests();
            }
        } catch (error) {
            console.error('Lỗi upload:', error);
            toast.error('Upload thất bại. ' + (error.response?.data?.message || ''));
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-16">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Yêu cầu bổ sung sách</h1>
                <p className="text-gray-500">Đề xuất mua sách phục vụ cho học kỳ mới. Yêu cầu sẽ được chuyển đến Thư viện viên phê duyệt.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* TRÁI: FORM YÊU CẦU */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100">
                            <button
                                className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'manual' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                                onClick={() => setActiveTab('manual')}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-lg">edit_document</span>
                                    <span>Nhập thủ công</span>
                                </div>
                            </button>
                            <button
                                className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'upload' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                                onClick={() => setActiveTab('upload')}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-lg">upload_file</span>
                                    <span>Tải lên Excel</span>
                                </div>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Học kỳ / Giai đoạn</label>
                                <input
                                    type="text"
                                    value={semester}
                                    onChange={(e) => setSemester(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    placeholder="VD: Học kỳ 1 năm 2026-2027"
                                />
                            </div>

                            {activeTab === 'manual' ? (
                                <form onSubmit={submitManualRequest}>
                                    <div className="space-y-4 mb-6">
                                        <div className="grid grid-cols-12 gap-4 px-2 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            <div className="col-span-6">Tên sách</div>
                                            <div className="col-span-3">Ngành</div>
                                            <div className="col-span-2 text-center">SL</div>
                                            <div className="col-span-1"></div>
                                        </div>
                                        {books.map((book, index) => (
                                            <div key={index} className="grid grid-cols-12 gap-4 items-center animate-slide-up">
                                                <div className="col-span-6">
                                                    <input
                                                        type="text"
                                                        value={book.title}
                                                        onChange={(e) => handleBookChange(index, 'title', e.target.value)}
                                                        className="w-full px-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                                                        placeholder="Nhập tên sách..."
                                                        required
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <input
                                                        type="text"
                                                        value={book.major}
                                                        onChange={(e) => handleBookChange(index, 'major', e.target.value)}
                                                        className="w-full px-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                                        placeholder="VD: CNTT"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={book.quantity}
                                                        onChange={(e) => handleBookChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                                        className="w-full px-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-center font-bold"
                                                    />
                                                </div>
                                                <div className="col-span-1 flex justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRow(index)}
                                                        className={`p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors ${books.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        disabled={books.length === 1}
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={handleAddRow}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span> Thêm dòng
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={submitLoading}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-50"
                                        >
                                            {submitLoading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">send</span>}
                                            Gửi Yêu Cầu
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={submitUploadRequest}>
                                    <div className="border-2 border-dashed border-gray-200 bg-gray-50 rounded-2xl p-8 text-center hover:border-emerald-400 transition-colors mb-6 group relative">
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            onChange={(e) => setFile(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-4xl text-emerald-500">upload_file</span>
                                        </div>
                                        <p className="text-gray-900 font-bold mb-1">Kéo thả hoặc nhấn để tải lên file Excel</p>
                                        <p className="text-sm text-gray-400">Chỉ hỗ trợ .xlsx, .xls</p>

                                        {file && (
                                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold animate-fade-in border border-emerald-100">
                                                <span className="material-symbols-outlined text-[18px]">description</span>
                                                {file.name}
                                                <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }} className="hover:text-rose-500 ml-2">
                                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 flex items-start gap-4">
                                        <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
                                        <div>
                                            <h4 className="text-sm font-bold text-blue-900 mb-1">Hướng dẫn tệp Excel</h4>
                                            <p className="text-xs text-blue-700 leading-relaxed">
                                                Tệp Excel của bạn cần chứa dòng tiêu đề với các cột: <strong className="font-bold">Tên sách</strong>, <strong className="font-bold">Ngành</strong>, <strong className="font-bold">Số lượng</strong>. Hệ thống sẽ tự động quét và bóc tách dữ liệu từ các cột này.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-6 border-t border-gray-100">
                                        <button
                                            type="submit"
                                            disabled={submitLoading || !file}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-50"
                                        >
                                            {submitLoading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">upload</span>}
                                            Tải Lên Cập Nhật
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* PHẢI: LỊCH SỬ YÊU CẦU */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-900">Lịch sử của bạn</h2>
                            <span className="material-symbols-outlined text-gray-400">history</span>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="flex justify-center p-8">
                                    <span className="material-symbols-outlined animate-spin text-emerald-500 text-3xl">progress_activity</span>
                                </div>
                            ) : requests.length > 0 ? (
                                <div className="space-y-4">
                                    {requests.map(req => (
                                        <div key={req._id} className="p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow bg-gray-50/50 relative overflow-hidden group">
                                            {/* Status Badge */}
                                            <div className="absolute top-4 right-4 flex items-center gap-1">
                                                {req.status === 'Pending' && <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider rounded-md border border-amber-100">Chờ duyệt</span>}
                                                {req.status === 'Approved' && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-md border border-emerald-100">Đã duyệt</span>}
                                                {req.status === 'Rejected' && <span className="px-2.5 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wider rounded-md border border-rose-100">Từ chối</span>}
                                            </div>

                                            <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                                                {req.semester || 'Học kỳ mới'}
                                            </div>

                                            <div className="text-sm font-bold text-gray-900 mb-1">
                                                {req.books.length} sách được đề xuất
                                            </div>

                                            <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                                                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                                {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                                            </div>

                                            <div className="space-y-1 mt-3 pt-3 border-t border-gray-100/50 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
                                                {req.books.map((b, i) => (
                                                    <div key={i} className="flex justify-between items-center text-xs">
                                                        <span className="text-gray-700 truncate mr-2" title={b.title}>• {b.title}</span>
                                                        <span className="text-gray-400 font-bold flex-shrink-0">x{b.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {req.note && (
                                                <div className="mt-3 text-xs bg-rose-50 text-rose-700 p-2 rounded relative before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-rose-500 overflow-hidden">
                                                    <strong className="font-bold opacity-75">Ghi chú:</strong> {req.note}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 px-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="material-symbols-outlined text-gray-300 text-3xl">inbox</span>
                                    </div>
                                    <p className="text-gray-500 font-medium text-sm">Chưa có yêu cầu nào.</p>
                                    <p className="text-gray-400 text-xs mt-1">Các yêu cầu của bạn sẽ xuất hiện tại đây</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LecturerBookRequestPage;
