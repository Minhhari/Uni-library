import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookAPI } from '../services/api';
import { LoadingSpinner, ErrorMessage, CreateBookModal } from '../components';

const BookListPage = () => {
    const [selectedGenre, setSelectedGenre] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [allBooks, setAllBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        loadBooks();
    }, []);

    const loadBooks = async () => {
        try {
            setLoading(true);
            const response = await bookAPI.getBooks();
            const booksData = response.data.data || [];
            setAllBooks(booksData);
            setFilteredBooks(booksData);

            // Extract unique categories from books
            const uniqueCategories = [...new Set(booksData.map(book => book.category?.name).filter(Boolean))];
            setCategories(['All', ...uniqueCategories]);
        } catch (err) {
            setError('Failed to load books');
            console.error('Error loading books:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = allBooks;
        if (selectedGenre !== 'All') {
            filtered = filtered.filter(b => b.category?.name === selectedGenre);
        }
        if (searchQuery) {
            filtered = filtered.filter(b =>
                b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.author.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        setFilteredBooks(filtered);
    }, [selectedGenre, searchQuery, allBooks]);

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
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
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

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex gap-2 flex-wrap pb-2 no-scrollbar">
                    {categories.map(genre => (
                        <button
                            key={genre}
                            onClick={() => setSelectedGenre(genre)}
                            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${selectedGenre === genre
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                                }`}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>

            {filteredBooks.length === 0 ? (
                <div className="py-20 text-center">
                    <span className="material-symbols-outlined text-8xl text-on-surface-variant/20 mb-4">search_off</span>
                    <h3 className="text-2xl font-bold text-on-surface-variant">No books found</h3>
                    <p className="text-on-surface-variant/60 mt-2">Try adjusting your filters or search keywords.</p>
                    <button
                        onClick={() => { setSelectedGenre('All'); setSearchQuery('') }}
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
                                    src={book.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=2574&auto=format&fit=crop'}
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
                            <p className="text-on-surface-variant text-xs truncate px-1 opacity-70 mb-3">{book.author}</p>
                            <div className="flex items-center justify-between px-1 mt-auto">
                                <span className={`text-[9px] font-black border px-2 py-0.5 rounded-md uppercase tracking-widest ${book.status === 'AVAILABLE'
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

            {/* Pagination Placeholder */}
            <footer className="pt-12 flex justify-center border-t border-surface-container-low">
                <div className="flex items-center gap-2">
                    <button className="w-12 h-12 rounded-2xl bg-surface-container-low text-on-surface-variant flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all shadow-sm">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <div className="flex gap-1 px-4">
                        <button className="w-10 h-10 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 border border-primary">1</button>
                        <button className="w-10 h-10 rounded-xl bg-surface-container-low text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-colors">2</button>
                        <button className="w-10 h-10 rounded-xl bg-surface-container-low text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-colors">3</button>
                    </div>
                    <button className="w-12 h-12 rounded-2xl bg-surface-container-low text-on-surface-variant flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all shadow-sm">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default BookListPage;
