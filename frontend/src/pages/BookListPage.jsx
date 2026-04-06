import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookAPI } from '../services/api';
import { LoadingSpinner, ErrorMessage, CreateBookModal } from '../components';

const DirectBulkImportPreviewModal = ({ dataRows, onClose, onConfirm, submitting }) => {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-white/10">
                <div className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-indigo-800 p-8 shrink-0 text-white relative flex justify-between items-start">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-20 translate-x-16 blur-2xl" />
                    <div className="absolute bottom-0 left-10 w-32 h-32 bg-indigo-500/20 rounded-full translate-y-16 blur-xl" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                            <span className="material-symbols-outlined text-[32px] text-indigo-200">table_chart</span>
                        </div>
                        <div>
                            <div className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Xác nhận báo cáo Excel</div>
                            <h2 className="text-2xl font-black tracking-tight leading-tight">Xem trước {dataRows.length} sách mới</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition shrink-0 relative z-10">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-slate-50/80 border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sách & Tác Giả</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mã ISBN / Thể Loại</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">NXB & Năm</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Tồn Kho</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Giá Tiền (VNĐ)</th>
                                        <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vị Trí Kệ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {dataRows.map((item, i) => (
                                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-800 text-sm max-w-[250px] truncate" title={item.title}>{item.title}</div>
                                                <div className="text-[11px] font-semibold text-slate-500 mt-1 max-w-[250px] truncate" title={item.author}>{item.author || 'Chưa rõ tác giả'}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-xs font-bold text-slate-600">{item.isbn || 'Chưa có ISBN'}</div>
                                                <div className="inline-block mt-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-wider">
                                                    {item.categoryName || 'Chưa phân loại'}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-xs font-bold text-slate-600 truncate max-w-[150px]" title={item.publisher}>{item.publisher || 'NXB chưa rõ'}</div>
                                                <div className="text-[11px] text-slate-400 font-semibold mt-1">Năm: {item.publish_year || '—'}</div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-black text-sm border border-emerald-100">
                                                    {item.quantity}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-emerald-600 text-sm">{Number(item.price).toLocaleString('vi-VN')}</div>
                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">VNĐ / Cuốn</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 font-black text-teal-700 text-xs bg-teal-50 px-2 py-1 rounded-lg border border-teal-100 w-fit">
                                                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                    {item.location || 'Chưa xếp'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-white border-t border-slate-200 flex gap-4 shrink-0 items-center justify-between">
                    <div className="text-xs font-bold text-slate-500">
                        Hệ thống sẽ cập nhật số lượng nếu trùng ISBN, hoặc tạo sách mới.
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} disabled={submitting} className="px-8 py-3 border-2 border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 disabled:opacity-50">
                            Hủy / Quay lại
                        </button>
                        <button onClick={onConfirm} disabled={submitting} className="flex gap-2 justify-center items-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:shadow-indigo-500/30 transition active:scale-95 disabled:opacity-50 min-w-[200px]">
                            {submitting ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">cloud_upload</span>}
                            {submitting ? 'Đang thêm sách...' : 'Xác nhận Thêm Sách'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BookListPage = () => {
    const [selectedGenre, setSelectedGenre] = useState('Tất cả');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAuthor, setFilterAuthor] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterPublisher, setFilterPublisher] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [allBooks, setAllBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState(['Tất cả']);
    const [rawCategories, setRawCategories] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalBooks, setTotalBooks] = useState(0);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { user } = useAuth();

    // Direct bulk add state
    const [directBulkImporting, setDirectBulkImporting] = useState(false);
    const [directBulkPreviewData, setDirectBulkPreviewData] = useState(null);
    const directBulkFileInputRef = useRef(null);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadBooks();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [page, selectedGenre, searchQuery, filterAuthor, filterYear, filterPublisher]);

    const loadCategories = async () => {
        try {
            const res = await bookAPI.getCategories();
            if (res.data?.success) {
                setRawCategories(res.data.data);
                setCategories(['Tất cả', ...res.data.data.map(c => c.name)]);
            }
        } catch (err) {
            console.error('Error loading categories:', err);
        }
    };

    const loadBooks = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 12,
                search: searchQuery,
                category: selectedGenre === 'Tất cả' ? undefined : rawCategories.find(c => c.name === selectedGenre)?._id,
                author: filterAuthor,
                year_from: filterYear,
                year_to: filterYear,
                publisher: filterPublisher
            };
            const response = await bookAPI.getBooks(params);

            if (response.data?.success) {
                setAllBooks(response.data.data || []);
                setTotalPages(response.data.totalPages || 1);
                setTotalBooks(response.data.total || 0);
            }
        } catch (err) {
            setError('Không thể tải danh sách sách');
            console.error('Error loading books:', err);
        } finally {
            setLoading(false);
        }
    };

    // We now use server-side filtering, so filteredBooks just returns allBooks
    const filteredBooks = allBooks;

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const handleGenreChange = (genre) => {
        setSelectedGenre(genre);
        setPage(1);
    };

    const hasAdvancedFilter = filterAuthor || filterYear || filterPublisher;

    const clearAllFilters = () => {
        setSelectedGenre('Tất cả');
        setSearchQuery('');
        setFilterAuthor('');
        setFilterYear('');
        setFilterPublisher('');
    };

    const handleDirectBulkImportUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws);

            const items = rows.map(row => ({
                title: (row['Tên Sách'] || row['Title'] || '').toString().trim(),
                author: (row['Tác Giả'] || row['Author'] || '').toString().trim(),
                isbn: (row['Mã ISBN'] || row['ISBN'] || '').toString().trim(),
                publisher: (row['Nhà Xuất Bản'] || row['Publisher'] || '').toString().trim(),
                publish_year: parseInt(row['Năm XB'] || row['Publish Year'], 10) || undefined,
                price: parseFloat(row['Giá Tiền (đồng) *'] || row['Giá Tiền Dự Kiến'] || row['Giá Tiền'] || row['Price']) || 0,
                quantity: parseInt(row['Số Lượng'] || row['Quantity'], 10) || 1,
                categoryName: (row['Thể Loại'] || row['Category'] || '').toString().trim(),
                location: (row['Mã Vị Trí *'] || row['Mã Vị Trí'] || row['Vị trí'] || row['Location'] || '').toString().trim(),
            })).filter(b => b.title);

            if (items.length === 0) {
                toast.error('Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra lại file.');
                return;
            }

            setDirectBulkPreviewData(items);
        } catch (err) {
            toast.error('Lỗi đọc file Excel.');
            console.error(err);
        }
    };

    const confirmDirectBulkImport = async () => {
        if (!directBulkPreviewData) return;
        setDirectBulkImporting(true);
        try {
            const res = await bookAPI.bulkAddBooks(directBulkPreviewData);
            const { imported, failed, failures } = res.data.data;
            toast.success(`Thêm thành công: ${imported} sách!`);
            if (failed > 0) toast.warning(`${failed} sách thất bại: ${failures.map(f => f.title).join(', ')}`);
            setDirectBulkPreviewData(null);
            loadBooks(); // refresh
        } catch (err) {
            toast.error(err.response?.data?.message || 'Thêm sách thất bại.');
        } finally {
            setDirectBulkImporting(false);
        }
    };

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <ErrorMessage message={error} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Khám phá bộ sưu tập</h1>
                    <p className="text-on-surface-variant text-lg">Khám phá tri thức mới trong số {allBooks.length} tựa sách</p>
                </div>
                {user?.role === 'librarian' && (
                    <div className="flex items-center gap-3">
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            ref={directBulkFileInputRef}
                            onChange={handleDirectBulkImportUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => directBulkFileInputRef.current?.click()}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-emerald-700 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm shadow-emerald-500/10 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-lg">upload_file</span>
                            Nhập bằng Excel
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-lg">add_box</span>
                            Thêm sách mới
                        </button>
                    </div>
                )}
            </header>

            {/* Create Modal */}
            {showCreateModal && <CreateBookModal onClose={() => setShowCreateModal(false)} onSuccess={loadBooks} />}

            {/* Direct Bulk Import Preview Modal */}
            {directBulkPreviewData && (
                <DirectBulkImportPreviewModal
                    dataRows={directBulkPreviewData}
                    onClose={() => setDirectBulkPreviewData(null)}
                    onConfirm={confirmDirectBulkImport}
                    submitting={directBulkImporting}
                />
            )}

            {/* ── Search + Advanced Filter ── */}
            <div className="bg-white rounded-2xl border border-surface-container-low shadow-sm overflow-hidden">
                {/* Main search bar */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-container-low">
                    <span className="material-symbols-outlined text-on-surface-variant/50">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Tìm theo tên sách..."
                        className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant/40 font-medium outline-none text-sm"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-on-surface-variant/40 hover:text-on-surface transition-colors">
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    )}
                    <div className="h-5 w-px bg-outline-variant/30" />
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showAdvanced || hasAdvancedFilter ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                    >
                        <span className="material-symbols-outlined text-base">tune</span>
                        Bộ lọc nâng cao
                        {hasAdvancedFilter && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block ml-0.5" />
                        )}
                    </button>
                </div>

                {/* Advanced Filters Panel */}
                {showAdvanced && (
                    <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-surface-container-lowest animate-in slide-in-from-top-2 duration-200">
                        {/* Author */}
                        <div>
                            <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5">Tác giả</label>
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-outline-variant/20 rounded-xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                <span className="material-symbols-outlined text-on-surface-variant/40 text-base">person</span>
                                <input
                                    type="text"
                                    value={filterAuthor}
                                    onChange={e => setFilterAuthor(e.target.value)}
                                    placeholder="Tìm theo tác giả..."
                                    className="flex-1 bg-transparent text-sm text-on-surface outline-none font-medium placeholder:text-on-surface-variant/30"
                                />
                                {filterAuthor && (
                                    <button onClick={() => setFilterAuthor('')}>
                                        <span className="material-symbols-outlined text-sm text-on-surface-variant/40 hover:text-on-surface">close</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Year */}
                        <div>
                            <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5">Năm xuất bản</label>
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-outline-variant/20 rounded-xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                <span className="material-symbols-outlined text-on-surface-variant/40 text-base">calendar_today</span>
                                <input
                                    type="text"
                                    value={filterYear}
                                    onChange={e => setFilterYear(e.target.value)}
                                    placeholder="VD: 2023"
                                    className="flex-1 bg-transparent text-sm text-on-surface outline-none font-medium placeholder:text-on-surface-variant/30"
                                    maxLength={4}
                                />
                                {filterYear && (
                                    <button onClick={() => setFilterYear('')}>
                                        <span className="material-symbols-outlined text-sm text-on-surface-variant/40 hover:text-on-surface">close</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Publisher */}
                        <div>
                            <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5">Nhà xuất bản</label>
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-outline-variant/20 rounded-xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                <span className="material-symbols-outlined text-on-surface-variant/40 text-base">business</span>
                                <input
                                    type="text"
                                    value={filterPublisher}
                                    onChange={e => setFilterPublisher(e.target.value)}
                                    placeholder="Tìm theo NXB..."
                                    className="flex-1 bg-transparent text-sm text-on-surface outline-none font-medium placeholder:text-on-surface-variant/30"
                                />
                                {filterPublisher && (
                                    <button onClick={() => setFilterPublisher('')}>
                                        <span className="material-symbols-outlined text-sm text-on-surface-variant/40 hover:text-on-surface">close</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Category Chips ── */}
            <div className="flex items-center gap-3 flex-wrap">
                {categories.map(genre => (
                    <button
                        key={genre}
                        onClick={() => handleGenreChange(genre)}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${selectedGenre === genre
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                            }`}
                    >
                        {genre}
                    </button>
                ))}
                {(hasAdvancedFilter || searchQuery || selectedGenre !== 'Tất cả') && (
                    <button
                        onClick={clearAllFilters}
                        className="px-4 py-2 rounded-full text-sm font-bold text-on-surface-variant/60 hover:text-red-500 hover:bg-red-50 transition-all flex items-center gap-1.5 border border-outline-variant/20"
                    >
                        <span className="material-symbols-outlined text-base">filter_alt_off</span>
                        Xóa bộ lọc
                    </button>
                )}
            </div>

            {/* ── Results count ── */}
            {(searchQuery || hasAdvancedFilter || selectedGenre !== 'Tất cả') && !loading && (
                <p className="text-sm text-on-surface-variant font-medium">
                    Tìm thấy <span className="font-black text-primary">{totalBooks}</span> sách
                </p>
            )}

            {/* ── Book Grid ── */}
            {loading ? (
                <div className="py-20 flex justify-center">
                    <LoadingSpinner />
                </div>
            ) : filteredBooks.length === 0 ? (
                <div className="py-20 text-center">
                    <span className="material-symbols-outlined text-8xl text-on-surface-variant/20 mb-4">search_off</span>
                    <h3 className="text-2xl font-bold text-on-surface-variant">Không tìm thấy sách</h3>
                    <p className="text-on-surface-variant/60 mt-2">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
                    <button
                        onClick={clearAllFilters}
                        className="mt-6 px-8 py-3 bg-surface-container-high text-primary font-bold rounded-2xl hover:bg-primary/10 transition-colors"
                    >
                        Đặt lại bộ lọc
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-12">
                    {filteredBooks.map((book) => (
                        <Link to={`/books/${book._id}`} key={book._id} className="group flex flex-col cursor-pointer">
                            <div className="relative aspect-[3/4.5] rounded-3xl overflow-hidden mb-5 shadow-sm group-hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2">
                                <img
                                    src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=2574&auto=format&fit=crop'}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    alt={book.title}
                                />
                                <div className="absolute top-4 left-4">
                                    <div className="flex flex-col gap-1.5 overflow-hidden">
                                        <span className="w-1 h-3 bg-primary rounded-full mb-1"></span>
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-black text-primary tracking-widest uppercase shadow-sm">
                                            {book.category?.name || 'CHUNG'}
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button className="w-full py-2 bg-white text-on-surface text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        Xem nhanh
                                    </button>
                                </div>
                            </div>
                            <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors leading-tight mb-1 truncate px-1">
                                {book.title}
                            </h4>
                            <p className="text-on-surface-variant text-xs truncate px-1 opacity-70 mb-1">{book.author}</p>
                            <p className="text-on-surface-variant/60 text-[10px] truncate px-1 mb-1 font-medium italic uppercase tracking-wider">{book.publisher}</p>
                            {book.publish_year && (
                                <p className="text-on-surface-variant/50 text-[10px] truncate px-1 mb-2">{book.publish_year}</p>
                            )}
                            <div className="flex items-center justify-between px-1 mt-auto">
                                <span className={`text-[9px] font-black border px-2 py-0.5 rounded-md uppercase tracking-widest ${book.status === 'available'
                                    ? 'border-emerald-500/30 text-emerald-600 bg-emerald-50'
                                    : 'border-on-surface-variant/20 text-on-surface-variant bg-surface-container-low'
                                    }`}>
                                    {book.status === 'available' ? 'CÓ SẴN' : book.status === 'maintenance' ? 'BẢO TRÌ' : 'HẾT SÁCH'}
                                </span>
                                <span className="material-symbols-outlined text-on-surface-variant/40 text-lg group-hover:text-primary transition-colors">arrow_forward_ios</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <footer className="pt-12 flex justify-center border-t border-surface-container-low">
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="w-12 h-12 rounded-2xl bg-surface-container-low text-on-surface-variant flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <div className="flex gap-1 px-4">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setPage(i + 1)}
                                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${page === i + 1
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 border border-primary'
                                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="w-12 h-12 rounded-2xl bg-surface-container-low text-on-surface-variant flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default BookListPage;
