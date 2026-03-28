import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookAPI, borrowAPI, fineAPI } from '../services/api';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState({
    activeLoans: 0,
    nextDeadline: 'None',
    accountBalance: '0'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all books for "Explore"
        const booksRes = await bookAPI.getBooks({ limit: 12 });
        setBooks(booksRes.data.data || []);

        // Fetch user stats from existing borrowAPI and fineAPI
        const myBooksRes = await borrowAPI.getMyBooks();
        const myBooks = myBooksRes.data || [];

        const activeLoans = myBooks.filter(b => b.status === 'approved' || b.status === 'borrowed' || b.status === 'waiting_for_pickup').length;

        const nextDeadlineBook = myBooks
          .filter(b => b.dueDate && (b.status === 'approved' || b.status === 'borrowed' || b.status === 'waiting_for_pickup'))
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

        const nextDeadline = nextDeadlineBook
          ? new Date(nextDeadlineBook.dueDate).toLocaleDateString('en-US', { month: 'SHORT', day: 'numeric' }).toUpperCase()
          : 'None';

        const finesRes = await fineAPI.getMyFines();
        // fineController returns { success: true, data: { fines: [...], summary: {...} } }
        const totalFine = finesRes.data?.data?.summary?.totalOutstanding || 0;

        setStats({
          activeLoans,
          nextDeadline,
          accountBalance: totalFine.toLocaleString()
        });
      } catch (error) {
        console.error('Error fetching student dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pt-4 font-body pb-20">
      {/* Hero Section */}
      <section className="text-left space-y-6">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-on-surface mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'Minh'} 👋
          </h1>
          <p className="text-on-surface-variant text-lg">
            The digital gallery of knowledge is at your fingertips. What will you discover today?
          </p>
        </div>

        {/* Big Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = e.target.search.value;
            window.location.href = `/books?search=${encodeURIComponent(q)}`;
          }}
          className="relative max-w-3xl"
        >
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40">search</span>
          <input
            name="search"
            type="text"
            placeholder="Search your library, authors, or ISBN..."
            className="w-full pl-14 pr-6 py-5 bg-surface-container-low border border-surface-dim rounded-full text-on-surface focus:ring-4 focus:ring-primary/10 focus:bg-white outline-none transition-all shadow-sm text-lg"
          />
        </form>
      </section>

      {/* Stats Row */}
      {(stats.activeLoans > 0 || stats.nextDeadline !== 'None' || stats.accountBalance !== '0') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.activeLoans > 0 && (
            <div className="bg-primary/10 border border-primary/20 p-8 rounded-[32px] flex items-start gap-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                <span className="material-symbols-outlined filled">menu_book</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-primary/60 tracking-[0.1em] uppercase block mb-1">Active Loans</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-primary leading-none">{stats.activeLoans}</span>
                  <span className="text-sm font-bold text-primary/80">Books Borrowed</span>
                </div>
              </div>
            </div>
          )}

          {stats.nextDeadline !== 'None' && (
            <div className="bg-[#FDF2F2] border border-rose-100/50 p-8 rounded-[32px] flex items-start gap-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-sm">
                <span className="material-symbols-outlined filled">calendar_month</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-rose-700/60 tracking-[0.1em] uppercase block mb-1">Next Deadline</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-rose-900 leading-none">1</span>
                  <span className="text-sm font-bold text-rose-800">Due {stats.nextDeadline}</span>
                </div>
              </div>
            </div>
          )}

          {stats.accountBalance !== '0' && (
            <div className="bg-[#EFF6FF] border border-blue-100/50 p-8 rounded-[32px] flex items-start gap-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                <span className="material-symbols-outlined filled">payments</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-blue-700/60 tracking-[0.1em] uppercase block mb-1">Account Balance</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-blue-900 leading-none">{stats.accountBalance}</span>
                  <span className="text-sm font-bold text-blue-800">VND Fine</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendation Row */}
      <section className="bg-primary rounded-[40px] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-primary/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
        <div className="relative z-10 space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Personalized Recommendations</h2>
          <p className="text-white/70 text-lg">Based on your reading history and academic interests.</p>
        </div>
        <Link
          to="/recommendations"
          className="relative z-10 px-10 py-5 bg-white text-primary font-black rounded-2xl hover:bg-white/90 hover:scale-105 transition-all shadow-xl active:scale-95 flex items-center gap-3"
        >
          <span className="material-symbols-outlined">auto_awesome</span>
          See Recommendations
        </Link>
      </section>

      {/* Explore All Books */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tight text-on-surface">Explore Collection</h2>
          <Link to="/books" className="text-primary font-black text-sm hover:underline tracking-tight">View All Books</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {books.map((book) => (
            <Link to={`/books/${book._id}`} key={book._id} className="group cursor-pointer">
              <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden mb-4 shadow-sm group-hover:shadow-2xl transition-all duration-500 border border-surface-dim">
                <img
                  src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=2574&auto=format&fit=crop'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt={book.title}
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-primary rounded-lg text-[10px] font-black tracking-widest uppercase shadow-sm">
                    {book.category?.name || 'GENERAL'}
                  </span>
                </div>
              </div>
              <h4 className="font-black text-on-surface group-hover:text-primary transition-colors leading-tight mb-1 line-clamp-2">
                {book.title}
              </h4>
              <p className="text-on-surface-variant/60 text-xs font-bold truncate">{book.author}</p>
              <p className="text-on-surface-variant/40 text-[10px] truncate opacity-80">{book.publisher}</p>
              <p className="text-on-surface-variant/30 text-[10px] truncate">{book.publish_year}</p>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
};

export default StudentDashboard;
