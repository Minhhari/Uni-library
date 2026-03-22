import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Books Borrowed', value: '2', icon: 'book', color: 'text-primary', border: 'border-primary' },
    { label: 'Due in 3 Days', value: '1', icon: 'event_busy', color: 'text-tertiary', border: 'border-tertiary' },
    { label: 'Outstanding Fine', value: '15,000 VND', icon: 'payments', color: 'text-secondary', border: 'border-secondary' },
  ];

  const currentlyBorrowing = [
    {
      title: 'The Psychology of Money',
      author: 'Morgan Housel',
      tag: 'ECONOMICS',
      dueDate: 'June 15, 2024',
      image: 'https://images.unsplash.com/photo-1592492159418-39f319320569?q=80&w=2670&auto=format&fit=crop'
    },
    {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      tag: 'CLASSICS',
      dueDate: 'July 02, 2024',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=2574&auto=format&fit=crop'
    },
  ];

  const recommendations = [
    { title: 'The Art of Innovation', author: 'Tom Kelley', tag: 'DESIGN', status: 'AVAILABLE', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=2574&auto=format&fit=crop' },
    { title: 'Astrophysics', author: 'Neil deGrasse Tyson', tag: 'SCIENCE', status: 'BORROWED', image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2672&auto=format&fit=crop' },
    { title: 'Selected Poems', author: 'Langston Hughes', tag: 'POETRY', status: 'AVAILABLE', image: 'https://images.unsplash.com/photo-1512428559083-a401a304453a?q=80&w=2670&auto=format&fit=crop' },
    { title: 'Midnight Library', author: 'Matt Haig', tag: 'FICTION', status: 'AVAILABLE', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=2674&auto=format&fit=crop' },
    { title: 'Sapiens', author: 'Yuval Noah Harari', tag: 'HISTORY', status: 'AVAILABLE', image: 'https://images.unsplash.com/photo-1589519160732-57fc498494f8?q=80&w=2670&auto=format&fit=crop' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section */}
      <section>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">
          Welcome back, {user?.name?.split(' ')[0] || 'Curator'} 👋
        </h1>
        <p className="text-on-surface-variant text-lg">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </section>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-surface-container-low p-8 rounded-3xl flex flex-col justify-between border-b-4 ${stat.border} shadow-sm hover:shadow-md transition-all hover:-translate-y-1`}>
            <span className={`material-symbols-outlined ${stat.color} mb-4 filled`}>{stat.icon}</span>
            <div>
              <span className="text-4xl font-black text-on-surface block mb-1">{stat.value}</span>
              <span className="text-on-surface-variant font-medium">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Currently Borrowing */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Currently Borrowing</h2>
          <Link to="/loans" className="text-primary font-semibold text-sm hover:underline">View All History</Link>
        </div>
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4">
          {currentlyBorrowing.map((book, i) => (
            <div key={i} className="flex-none w-[450px] bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/10 flex gap-6 glass-card group">
              <img
                src={book.image}
                className="w-32 h-44 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-500"
                alt={book.title}
              />
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1 h-4 bg-primary rounded-full"></span>
                    <span className="text-[10px] font-bold text-primary tracking-widest uppercase">{book.tag}</span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface leading-tight mb-1">{book.title}</h3>
                  <p className="text-on-surface-variant text-sm">{book.author}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-4">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>Due: {book.dueDate}</span>
                  </div>
                  <button className="w-full py-3 btn-primary text-sm">Return Now</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended for You */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Recommended for You</h2>
          <div className="flex gap-2">
            <button className="p-2 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-primary-container/20 transition-colors">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="p-2 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-primary-container/20 transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {recommendations.map((book, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
                <img
                  src={book.image}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt={book.title}
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-primary tracking-widest uppercase shadow-sm">
                    {book.tag}
                  </span>
                </div>
                <div className="absolute bottom-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-md ${book.status === 'AVAILABLE' ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'
                    }`}>
                    {book.status}
                  </span>
                </div>
              </div>
              <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                {book.title}
              </h4>
              <p className="text-on-surface-variant text-sm truncate">{book.author}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contextual FAB */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-primary to-primary-container text-white rounded-3xl shadow-2xl flex items-center justify-center hover:scale-110 hover:rotate-3 transition-all active:scale-95 group z-50">
        <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform filled">qr_code_scanner</span>
      </button>
    </div>
  );
};

export default HomePage;
