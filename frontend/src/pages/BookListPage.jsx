import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookAPI } from '../services/api';
import { LoadingSpinner, ErrorMessage, CreateBookModal } from '../components';

const BookListPage = () => {
    const [selectedGenre, setSelectedGenre] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAuthor, setFilterAuthor] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterPublisher, setFilterPublisher] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [allBooks, setAllBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState(['All']);
    const [rawCategories, setRawCategories] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalBooks, setTotalBooks] = useState(0);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadBooks();
    }, [page, selectedGenre, searchQuery, filterAuthor, filterYear, filterPublisher]);

    const loadCategories = async () => {
        try {
            const res = await bookAPI.getCategories();
            if (res.data?.success) {
                setRawCategories(res.data.data);
                setCategories(['All', ...res.data.data.map(c => c.name)]);
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
                category: selectedGenre === 'All' ? undefined : rawCategories.find(c => c.name === selectedGenre)?._id,
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
            setError('Failed to load books');
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
        setSelectedGenre('All');
        setSearchQuery('');
        setFilterAuthor('');
        setFilterYear('');
        setFilterPublisher('');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LoadingSpinner />
            </div>
        );
    }

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
                    <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Browse Collection</h1>
                    <p className="text-on-surface-variant text-lg">Discover your next academic adventure among {allBooks.length} titles</p>
                </div>
                {user?.role === 'librarian' && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">add_box</span>
                        Thêm sách mới
                    </button>
                )}
            </header>

            {/* Create Modal */}
            {showCreateModal && <CreateBookModal onClose={() => setShowCreateModal(false)} onSuccess={loadBooks} />}

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
                {(hasAdvancedFilter || searchQuery || selectedGenre !== 'All') && (
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
            {(searchQuery || hasAdvancedFilter || selectedGenre !== 'All') && (
                <p className="text-sm text-on-surface-variant font-medium">
                    Tìm thấy <span className="font-black text-primary">{totalBooks}</span> sách
                </p>
            )}

            {/* ── Book Grid ── */}
            {filteredBooks.length === 0 ? (
                <div className="py-20 text-center">
                    <span className="material-symbols-outlined text-8xl text-on-surface-variant/20 mb-4">search_off</span>
                    <h3 className="text-2xl font-bold text-on-surface-variant">No books found</h3>
                    <p className="text-on-surface-variant/60 mt-2">Try adjusting your filters or search keywords.</p>
                    <button
                        onClick={clearAllFilters}
                        className="mt-6 px-8 py-3 bg-surface-container-high text-primary font-bold rounded-2xl hover:bg-primary/10 transition-colors"
                    >
                        Reset All Filters
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
                                            {book.category?.name || 'GENERAL'}
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button className="w-full py-2 bg-white text-on-surface text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        Quick View
                                    </button>
                                </div>
                            </div>
                            <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors leading-tight mb-1 truncate px-1">
                                {book.title}
                            </h4>
                            <p className="text-on-surface-variant text-xs truncate px-1 opacity-70 mb-1">{book.author}</p>
                            {book.publish_year && (
                                <p className="text-on-surface-variant/50 text-[10px] truncate px-1 mb-2">{book.publish_year}</p>
                            )}
                            <div className="flex items-center justify-between px-1 mt-auto">
                                <span className={`text-[9px] font-black border px-2 py-0.5 rounded-md uppercase tracking-widest ${book.status === 'available'
                                    ? 'border-emerald-500/30 text-emerald-600 bg-emerald-50'
                                    : 'border-on-surface-variant/20 text-on-surface-variant bg-surface-container-low'
                                    }`}>
                                    {book.status}
                                </span>
                                <span className="material-symbols-outlined text-on-surface-variant/40 text-lg group-hover:text-primary transition-colors">arrow_forward_ios</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
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
