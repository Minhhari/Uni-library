import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { bookRequestAPI } from '../services/api';

// ─── Constants ──────────────────────────────────────────────────────────────────
const COLUMNS = [
    { key: 'title', label: 'Tên Sách', required: true },
    { key: 'author', label: 'Tác Giả', required: true },
    { key: 'isbn', label: 'Mã ISBN', required: true },
    { key: 'publisher', label: 'Nhà Xuất Bản', required: true },
    { key: 'publish_year', label: 'Năm XB', required: true },
    { key: 'price', label: 'Giá Tiền Dự Kiến', required: true },
    { key: 'quantity', label: 'Số Lượng', required: true },
    { key: 'categoryName', label: 'Thể Loại', required: true },
    { key: 'reason', label: 'Lý do yêu cầu', required: true },
];

const REQUIRED_KEYS = COLUMNS.filter(c => c.required).map(c => c.key);

// ─── Helper: generate xlsx template client-side ──────────────────────────────
const downloadTemplate = async () => {
    const { utils, writeFile } = await import('xlsx');
    const headers = COLUMNS.map(c => c.label);
    const exampleRow = [
        'Lập trình Python nâng cao',
        'Nguyễn Văn A',
        '978-604-1234-56-7',
        'NXB Đại học Quốc gia',
        2023,
        250000,
        5,
        'Khoa học máy tính',
        'Môn học Lập trình Python - HK2 2025-2026',
    ];
    const ws = utils.aoa_to_sheet([headers, exampleRow]);

    // Column widths
    ws['!cols'] = [22, 18, 16, 20, 8, 14, 8, 18, 30].map(w => ({ wch: w }));

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Danh sách sách');
    writeFile(wb, 'Template_Yêu_Cầu_Sách.xlsx');
};

// ─── Helper: validate a parsed row ──────────────────────────────────────────
const validateRow = (row) => {
    const errors = [];
    COLUMNS.forEach(c => {
        if (c.required) {
            const val = row[c.key];
            if (c.key === 'quantity') {
                const qty = Number(val);
                if (!qty || qty < 1) errors.push(`Số lượng không hợp lệ`);
            } else if (c.key === 'price' || c.key === 'publish_year') {
                if (val === undefined || val === null || String(val).trim() === '') errors.push(`Thiếu ${c.label}`);
            } else {
                if (!val?.toString().trim()) errors.push(`Thiếu ${c.label}`);
            }
        }
    });
    return errors;
};

// ─── StatusBadge for request history ────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const cfg = {
        Pending: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
        Approved: { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        Rejected: { label: 'Từ chối', cls: 'bg-rose-50 text-rose-600 border-rose-100' },
        PartiallyApproved: { label: 'Duyệt một phần', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
    }[status] || { label: status, cls: 'bg-gray-50 text-gray-500 border-gray-100' };
    return (
        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md border ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const LecturerBookRequestPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [semester, setSemester] = useState('Học kỳ 2 năm 2025-2026');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('upload'); // 'manual' | 'upload'

    // Upload flow state
    const [file, setFile] = useState(null);
    const [previewRows, setPreviewRows] = useState(null); // null = not parsed yet
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Manual form
    const [books, setBooks] = useState([{
        title: '', author: '', isbn: '', publisher: '',
        publish_year: '', price: '', quantity: 1,
        categoryName: '', reason: '',
    }]);

    useEffect(() => { fetchMyRequests(); }, []);

    const fetchMyRequests = async () => {
        try {
            setLoading(true);
            const res = await bookRequestAPI.getMyRequests();
            if (res.data?.success) setRequests(res.data.data);
        } catch (e) {
            console.error('Lỗi khi tải lịch sử:', e);
        } finally {
            setLoading(false);
        }
    };

    // ── Manual form handlers ────────────────────────────────────────────────
    const handleBookChange = (index, field, value) => {
        const newBooks = [...books];
        newBooks[index][field] = value;
        setBooks(newBooks);
    };

    const submitManualRequest = async (e) => {
        e.preventDefault();
        const validBooks = books.filter(b => validateRow(b).length === 0);
        if (validBooks.length !== books.length) {
            toast.warning('Vui lòng điền ĐẦY ĐỦ tất cả các trường cho mỗi cuốn sách.');
            return;
        }
        try {
            setSubmitLoading(true);
            const payload = validBooks.map(b => ({
                ...b,
                quantity: Number(b.quantity) || 1,
                price: Number(b.price) || 0,
                publish_year: Number(b.publish_year) || undefined,
            }));
            const res = await bookRequestAPI.createRequest({ books: payload, semester });
            if (res.data?.success) {
                toast.success('Gửi yêu cầu thành công!');
                setBooks([{ title: '', author: '', isbn: '', publisher: '', publish_year: '', price: '', quantity: 1, categoryName: '', reason: '' }]);
                fetchMyRequests();
            }
        } catch (e) {
            toast.error('Gửi yêu cầu thất bại. Vui lòng thử lại.');
        } finally {
            setSubmitLoading(false);
        }
    };

    // ── Upload / Preview handlers ───────────────────────────────────────────
    const parseFile = async (f) => {
        if (!f) return;
        setFile(f);
        try {
            const { read, utils } = await import('xlsx');
            const buffer = await f.arrayBuffer();
            const wb = read(buffer, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const raw = utils.sheet_to_json(ws, { defval: '' });

            const rows = raw.map(row => ({
                title: (row['Tên Sách'] || row['Ten Sach'] || row['Title'] || '').toString().trim(),
                author: (row['Tác Giả'] || row['Tac Gia'] || row['Author'] || '').toString().trim(),
                isbn: (row['Mã ISBN'] || row['Ma ISBN'] || row['ISBN'] || '').toString().trim(),
                publisher: (row['Nhà Xuất Bản'] || row['Nha Xuat Ban'] || row['Publisher'] || '').toString().trim(),
                publish_year: (row['Năm XB'] || row['Nam XB'] || row['Publish Year'] || '').toString().trim(),
                price: (row['Giá Tiền Dự Kiến'] || row['Gia Tien Du Kien'] || row['Price'] || '').toString().trim(),
                quantity: (row['Số Lượng'] || row['So Luong'] || row['Quantity'] || '1').toString().trim(),
                categoryName: (row['Thể Loại'] || row['The Loai'] || row['Category'] || '').toString().trim(),
                reason: (row['Lý do yêu cầu'] || row['Ly do yeu cau'] || row['Reason'] || '').toString().trim(),
            }));

            setPreviewRows(rows);
        } catch (err) {
            toast.error('Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng.');
            setPreviewRows(null);
        }
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) parseFile(f);
    };

    const resetUpload = () => {
        setFile(null);
        setPreviewRows(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const submitUploadRequest = async () => {
        if (!previewRows || previewRows.length === 0) return;
        const hasErrors = previewRows.some(r => validateRow(r).length > 0);
        if (hasErrors) {
            toast.warning('Vui lòng sửa các dòng lỗi (bôi đỏ) trước khi gửi.');
            return;
        }
        try {
            setSubmitLoading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('semester', semester);
            const res = await bookRequestAPI.uploadExcel(formData);
            if (res.data?.success) {
                toast.success(`Tải lên thành công ${previewRows.length} sách!`);
                resetUpload();
                fetchMyRequests();
            }
        } catch (e) {
            toast.error('Gửi thất bại. ' + (e.response?.data?.message || ''));
        } finally {
            setSubmitLoading(false);
        }
    };

    const allValid = previewRows && previewRows.length > 0 && previewRows.every(r => validateRow(r).length === 0);

    return (
        <div className="animate-fade-in pb-16">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Yêu cầu bổ sung sách</h1>
                <p className="text-gray-500">Đề xuất mua sách phục vụ cho học kỳ mới. Yêu cầu sẽ được chuyển đến Thư viện viên phê duyệt.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: FORM */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100">
                            {[
                                { id: 'upload', icon: 'upload_file', label: 'Tải lên Excel' },
                                { id: 'manual', icon: 'edit_document', label: 'Nhập thủ công' },
                            ].map(tab => (
                                <button key={tab.id}
                                    className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === tab.id ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                                    onClick={() => setActiveTab(tab.id)}>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                                        <span>{tab.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="p-6">
                            {/* Semester field - shared */}
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Học kỳ / Giai đoạn</label>
                                <input type="text" value={semester} onChange={e => setSemester(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    placeholder="VD: Học kỳ 1 năm 2026-2027" />
                            </div>

                            {/* === UPLOAD TAB === */}
                            {activeTab === 'upload' && (
                                <div>
                                    {!previewRows ? (
                                        /* Step 1: Choose file */
                                        <>
                                            {/* Download template */}
                                            <div className="mb-4 flex items-center justify-between">
                                                <p className="text-sm font-semibold text-gray-700">Bước 1: Tải file mẫu, điền thông tin, rồi upload lên</p>
                                                <button
                                                    onClick={downloadTemplate}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm font-bold hover:bg-blue-100 transition"
                                                >
                                                    <span className="material-symbols-outlined text-lg">download</span>
                                                    Tải file mẫu (.xlsx)
                                                </button>
                                            </div>

                                            {/* Required fields note */}
                                            <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 flex gap-2">
                                                <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">info</span>
                                                <div>
                                                    <strong>Trường bắt buộc (*): </strong>
                                                    {COLUMNS.filter(c => c.required).map(c => c.label).join(', ')}
                                                    <br />
                                                    <span className="opacity-70">Tên cột trong file phải khớp chính xác với file mẫu.</span>
                                                </div>
                                            </div>

                                            {/* Drag-drop zone */}
                                            <div
                                                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors relative cursor-pointer group ${dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-gray-50 hover:border-emerald-400'}`}
                                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                                onDragLeave={() => setDragOver(false)}
                                                onDrop={handleFileDrop}
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <input ref={fileInputRef} type="file" accept=".xlsx,.xls"
                                                    onChange={e => parseFile(e.target.files[0])}
                                                    className="hidden" />
                                                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                    <span className="material-symbols-outlined text-4xl text-emerald-500">upload_file</span>
                                                </div>
                                                <p className="text-gray-900 font-bold mb-1">Kéo thả hoặc bấm để chọn file Excel</p>
                                                <p className="text-sm text-gray-400">Hỗ trợ .xlsx, .xls</p>
                                            </div>
                                        </>
                                    ) : (
                                        /* Step 2: Preview & Validate */
                                        <>
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="text-sm font-black text-gray-900">Bước 2: Xem trước dữ liệu</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        <span className="font-bold text-gray-700">{file?.name}</span> — {previewRows.length} dòng
                                                        {allValid
                                                            ? <span className="ml-2 text-emerald-600 font-bold">✅ Tất cả hợp lệ</span>
                                                            : <span className="ml-2 text-rose-600 font-bold">⚠️ {previewRows.filter(r => validateRow(r).length > 0).length} dòng lỗi</span>
                                                        }
                                                    </p>
                                                </div>
                                                <button onClick={resetUpload}
                                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                                                    <span className="material-symbols-outlined text-sm">refresh</span>
                                                    Chọn file khác
                                                </button>
                                            </div>

                                            {/* Preview Table */}
                                            <div className="overflow-x-auto rounded-xl border border-gray-100 mb-6">
                                                <table className="w-full text-xs min-w-[800px]">
                                                    <thead>
                                                        <tr className="bg-gray-50 text-left">
                                                            <th className="px-3 py-3 text-gray-400 font-black uppercase tracking-wider w-8">#</th>
                                                            {COLUMNS.map(c => (
                                                                <th key={c.key} className="px-3 py-3 text-gray-500 font-black uppercase tracking-wider whitespace-nowrap">
                                                                    {c.label}{c.required && <span className="text-rose-500 ml-0.5">*</span>}
                                                                </th>
                                                            ))}
                                                            <th className="px-3 py-3 text-gray-400 font-black uppercase tracking-wider">Trạng thái</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {previewRows.map((row, i) => {
                                                            const errors = validateRow(row);
                                                            const hasError = errors.length > 0;
                                                            return (
                                                                <tr key={i} className={hasError ? 'bg-rose-50' : 'bg-white hover:bg-gray-50/50'}>
                                                                    <td className="px-3 py-2.5 text-gray-400 font-bold">{i + 1}</td>
                                                                    {COLUMNS.map(c => (
                                                                        <td key={c.key} className={`px-3 py-2.5 max-w-[120px] ${hasError && c.required && !row[c.key] ? 'text-rose-600 font-bold' : 'text-gray-700'}`}>
                                                                            <span className="truncate block" title={row[c.key] || '—'}>{row[c.key] || <span className="text-gray-300 italic">—</span>}</span>
                                                                        </td>
                                                                    ))}
                                                                    <td className="px-3 py-2.5">
                                                                        {hasError
                                                                            ? <span className="flex items-center gap-1 text-rose-600 font-bold whitespace-nowrap">
                                                                                <span className="material-symbols-outlined text-sm">error</span>
                                                                                {errors[0]}
                                                                            </span>
                                                                            : <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                                                                Hợp lệ
                                                                            </span>
                                                                        }
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Submit */}
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={submitUploadRequest}
                                                    disabled={submitLoading || !allValid}
                                                    className={`flex items-center gap-2 px-8 py-3 text-sm font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                                        ${allValid
                                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200'
                                                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                                                >
                                                    {submitLoading
                                                        ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                                        : <span className="material-symbols-outlined text-sm">rocket_launch</span>}
                                                    {allValid ? 'Gửi Yêu Cầu Cho Thủ Thư' : `Còn ${previewRows.filter(r => validateRow(r).length > 0).length} dòng lỗi`}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* === MANUAL TAB === */}
                            {activeTab === 'manual' && (
                                <form onSubmit={submitManualRequest}>
                                    <div className="space-y-6 mb-6">
                                        {books.map((book, index) => (
                                            <div key={index} className="relative p-5 bg-gray-50 rounded-2xl border border-gray-100 animate-fade-in">
                                                {/* Row header */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Sách #{index + 1}</span>
                                                    <button type="button" onClick={() => {
                                                        if (books.length > 1) setBooks(books.filter((_, i) => i !== index));
                                                    }} disabled={books.length === 1}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition disabled:opacity-30">
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {COLUMNS.map(col => (
                                                        <div key={col.key} className={col.key === 'reason' ? 'sm:col-span-2' : ''}>
                                                            <label className="block text-xs font-bold text-gray-600 mb-1">
                                                                {col.label}{col.required && <span className="text-rose-500 ml-0.5">*</span>}
                                                            </label>
                                                            <input
                                                                type={['publish_year', 'price', 'quantity'].includes(col.key) ? 'number' : 'text'}
                                                                min={col.key === 'quantity' ? 1 : undefined}
                                                                value={book[col.key]}
                                                                onChange={e => handleBookChange(index, col.key, e.target.value)}
                                                                required={col.required}
                                                                placeholder={col.required ? `${col.label} (bắt buộc)` : col.label}
                                                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <button type="button"
                                            onClick={() => setBooks([...books, { title: '', author: '', isbn: '', publisher: '', publish_year: '', price: '', quantity: 1, categoryName: '', reason: '' }])}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition">
                                            <span className="material-symbols-outlined text-sm">add</span> Thêm sách
                                        </button>
                                        <button type="submit" disabled={submitLoading}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-50">
                                            {submitLoading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">send</span>}
                                            Gửi Yêu Cầu
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: HISTORY */}
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
                                        <div key={req._id} className="p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow bg-gray-50/50 relative overflow-hidden">
                                            <div className="absolute top-4 right-4">
                                                <StatusBadge status={req.status} />
                                            </div>
                                            <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide pr-24">
                                                {req.semester || 'Học kỳ mới'}
                                            </div>
                                            <div className="text-sm font-bold text-gray-900 mb-1">
                                                {req.books.length} sách đề xuất
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                                                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                                {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                                            </div>
                                            <div className="space-y-1 mt-3 pt-3 border-t border-gray-100/50 max-h-[100px] overflow-y-auto pr-2">
                                                {req.books.map((b, i) => {
                                                    const bookCfg = {
                                                        approved: 'text-emerald-600',
                                                        rejected: 'text-rose-500 line-through',
                                                        pending: 'text-gray-700',
                                                    }[b.bookStatus] || 'text-gray-700';
                                                    return (
                                                        <div key={i} className="flex justify-between items-center text-xs">
                                                            <span className={`truncate mr-2 ${bookCfg}`} title={b.title}>• {b.title}</span>
                                                            <span className="text-gray-400 font-bold flex-shrink-0">x{b.quantity}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {req.note && (
                                                <div className="mt-3 text-xs bg-rose-50 text-rose-700 p-2 rounded pl-3 border-l-2 border-rose-400">
                                                    <strong>Ghi chú:</strong> {req.note}
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
