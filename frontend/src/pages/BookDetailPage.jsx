import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const BookDetailPage = () => {
    const { id } = useParams();
    const [showBorrowModal, setShowBorrowModal] = useState(false);
    const [selectedCopy, setSelectedCopy] = useState('0429');

    // Hardcoded for demo/design purposes
    const book = {
        title: 'Echoes of the Void: A Curator\'s Journey',
        author: 'Elena S. Thorne',
        tag: 'SCI-FI ANTHOLOGY',
        status: 'AVAILABLE',
        isbn: '978-3-16-148410-0',
        publisher: 'Lumina Press',
        year: '2023',
        pages: '432',
        category: 'Literature',
        location: 'Aisle 4, Shelf C-12',
        description: 'In "Echoes of the Void," award-winning author Elena S. Thorne takes us on a breathtaking journey through the outer rim of the Magellanic clouds. This anthology captures the silence of space not as an absence, but as a presence—a living, breathing entity that speaks to those who dare to listen.',
        copies: [
            { id: '0429', condition: 'Pristine', status: 'AVAILABLE' },
            { id: '0811', condition: 'Good', status: 'AVAILABLE' },
            { id: '1102', condition: 'Fair', status: 'BORROWED' }
        ],
        toc: [
            { id: '01', title: 'The Silent Pulse', page: '04' },
            { id: '02', title: 'Remnants of Helios-7', page: '42' },
            { id: '03', title: 'The Archivist\'s Burden', page: '89' },
            { id: '04', title: 'Glass Cities in Vacuum', page: '134' }
        ],
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=2574&auto=format&fit=crop'
    };

    return (
        <div className="flex flex-col gap-12 animate-in fade-in transition-all duration-700">
            {/* Hero Banner Area */}
            <section className="-mt-10 -mx-10 relative h-[400px] bg-surface flex items-center justify-center overflow-hidden border-b border-surface-container-low shadow-sm">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/40 to-surface z-10 blur-3xl"></div>
                    <img
                        src={book.image}
                        className="w-full h-full object-cover blur-3xl opacity-30 transform scale-125"
                        alt="Blur background"
                    />
                </div>

                <div className="relative z-20 flex flex-col md:flex-row items-center gap-12 max-w-7xl px-8 w-full">
                    <div className="shrink-0 transform -rotate-3 hover:rotate-0 transition-all duration-500 shadow-2xl p-2 bg-white rounded-3xl group">
                        <img
                            src={book.image}
                            className="w-56 h-80 object-cover rounded-2xl shadow-inner group-hover:scale-105 transition-transform"
                            alt={book.title}
                        />
                    </div>
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase rounded-full">{book.tag}</span>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black tracking-widest uppercase rounded-full border border-emerald-500/20">{book.status}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight text-on-surface drop-shadow-sm">{book.title}</h1>
                        <div className="flex items-center gap-4 justify-center md:justify-start">
                            <span className="text-on-surface-variant font-bold text-xl opacity-80">By {book.author}</span>
                            <span className="w-1.5 h-1.5 bg-outline-variant/30 rounded-full"></span>
                            <span className="text-on-surface-variant/60 font-medium">Edition: {book.year}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Action Bar */}
            <section className="relative z-30 -mt-20">
                <div className="bg-white/80 backdrop-blur-3xl p-8 rounded-[40px] shadow-2xl border border-white/60 flex flex-col lg:flex-row items-center justify-between gap-8 group">
                    <div className="flex flex-col md:flex-row items-center gap-8 px-4">
                        <div className="flex items-center gap-4">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-2xl font-black text-on-surface flex items-baseline gap-1">
                                3 <span className="text-sm font-bold text-on-surface-variant/40">of 5 copies available</span>
                            </span>
                        </div>
                        <div className="h-10 w-[1px] bg-outline-variant/20 hidden md:block"></div>
                        <div className="flex items-center gap-2 text-on-surface-variant font-bold group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">location_on</span>
                            <span>{book.location}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <button
                            onClick={() => setShowBorrowModal(true)}
                            className="flex-1 lg:flex-none px-12 py-5 bg-gradient-to-r from-primary to-primary-container text-white font-black rounded-3xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
                        >
                            <span className="material-symbols-outlined text-2xl">auto_stories</span>
                            Borrow Now
                        </button>
                        <button className="w-16 h-16 bg-surface-container-low text-on-surface-variant flex items-center justify-center rounded-3xl hover:bg-surface-container-high hover:text-primary transition-all shadow-sm">
                            <span className="material-symbols-outlined text-2xl">bookmark_add</span>
                        </button>
                        <button className="hidden sm:block px-8 py-5 bg-surface-container-low text-on-surface font-bold rounded-3xl hover:bg-primary/5 transition-all w-40 text-center">
                            Reserve
                        </button>
                    </div>
                </div>
            </section>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 pb-20 mt-4">
                <div className="lg:col-span-2 space-y-12">
                    <div>
                        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                            Description
                        </h2>
                        <div className="text-on-surface-variant/80 text-xl leading-relaxed space-y-6">
                            <p>{book.description}</p>
                            <p>As she travels through the remnants of forgotten civilizations, she discovers that the void isn't just empty space; it's a repository of everything that ever was.</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-black mb-8">Table of Contents</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {book.toc.map(item => (
                                <div key={item.id} className="group p-5 bg-surface-container-low/40 rounded-3xl border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-6">
                                        <span className="text-primary/30 font-black text-2xl group-hover:text-primary transition-colors">{item.id}</span>
                                        <span className="font-bold text-on-surface opacity-80 group-hover:opacity-100">{item.title}</span>
                                    </div>
                                    <span className="text-xs font-black text-on-surface-variant/40 group-hover:text-primary transition-colors uppercase tracking-widest">Page {item.page}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Metadata */}
                <div className="space-y-8">
                    <div className="bg-surface-container-low/40 rounded-[32px] p-8 border border-white/40 shadow-sm space-y-8">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-2xl">book_2</span>
                                </div>
                                <div>
                                    <p className="text-[10px] text-on-surface-variant opacity-50 font-black uppercase tracking-widest mb-0.5">Format</p>
                                    <p className="font-bold text-on-surface tracking-tight">Hardcover, {book.pages} Pages</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-2xl">category</span>
                                </div>
                                <div>
                                    <p className="text-[10px] text-on-surface-variant opacity-50 font-black uppercase tracking-widest mb-0.5">Genre</p>
                                    <p className="font-bold text-on-surface tracking-tight">{book.category}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-2xl">translate</span>
                                </div>
                                <div>
                                    <p className="text-[10px] text-on-surface-variant opacity-50 font-black uppercase tracking-widest mb-0.5">Language</p>
                                    <p className="font-bold text-on-surface tracking-tight">English (Original)</p>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-outline-variant/10"></div>

                        <div>
                            <p className="text-[10px] text-on-surface-variant opacity-50 font-black uppercase tracking-widest mb-4">Reading Tags</p>
                            <div className="flex flex-wrap gap-2">
                                {['Space', 'Philosophy', 'Nebula Awards', 'Memory'].map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-white rounded-xl text-xs font-bold text-on-surface-variant/80 border border-outline-variant/10 hover:border-primary/40 hover:text-primary transition-all cursor-pointer">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary/10 to-primary-container/5 rounded-[32px] p-8 border border-primary/20 shadow-sm relative overflow-hidden group">
                        <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-8xl opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">verified</span>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary text-xl filled">verified</span>
                            <h3 className="font-black text-primary tracking-tight">Staff Pick</h3>
                        </div>
                        <p className="text-primary/80 font-medium italic leading-relaxed text-sm">"A hauntingly beautiful examination of what we leave behind. The prose feels as vast as the setting itself."</p>
                        <p className="mt-6 font-black text-[10px] text-primary/40 uppercase tracking-widest">— Marcus, Senior Curator</p>
                    </div>
                </div>
            </div>

            {/* Borrow Modal Overlay */}
            {showBorrowModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-on-background/40 backdrop-blur-xl animate-in fade-in"
                        onClick={() => setShowBorrowModal(false)}
                    ></div>
                    <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in duration-500 border border-white/60">
                        <div className="p-8 border-b border-surface-container-low flex justify-between items-center bg-surface-container-low/20">
                            <h2 className="text-2xl font-black tracking-tight">Confirm Borrow</h2>
                            <button
                                onClick={() => setShowBorrowModal(false)}
                                className="w-12 h-12 rounded-2xl hover:bg-surface-container-high transition-all flex items-center justify-center text-on-surface-variant"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-10 space-y-10">
                            <div className="flex gap-6 p-6 bg-surface-container-low/40 rounded-[32px] border border-white/40">
                                <img
                                    src={book.image}
                                    className="w-20 h-28 object-cover rounded-2xl shadow-xl transform -rotate-2"
                                    alt="Book Thumbnail"
                                />
                                <div className="flex flex-col justify-center">
                                    <p className="text-xl font-black text-on-surface mb-1 tracking-tight">{book.title}</p>
                                    <p className="text-on-surface-variant font-bold opacity-60">By {book.author}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Select Copy</p>
                                    <span className="text-[9px] font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-full border border-primary/20">3 Available</span>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {book.copies.filter(c => c.status === 'AVAILABLE').map(copy => (
                                        <label
                                            key={copy.id}
                                            className={`flex items-center justify-between p-5 rounded-[24px] cursor-pointer transition-all border-2 ${selectedCopy === copy.id
                                                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5'
                                                    : 'border-surface-container-low bg-surface hover:border-primary/20 hover:bg-white'
                                                }`}
                                            onClick={() => setSelectedCopy(copy.id)}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-black text-on-surface tracking-tight">Copy #{copy.id}</span>
                                                <span className={`text-[10px] font-bold ${selectedCopy === copy.id ? 'text-primary' : 'text-on-surface-variant/40'}`}>Condition: {copy.condition}</span>
                                            </div>
                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedCopy === copy.id ? 'border-primary' : 'border-outline-variant/30'
                                                }`}>
                                                {selectedCopy === copy.id && <div className="w-4 h-4 bg-primary rounded-full animate-in zoom-in"></div>}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Due Date Policy</p>
                                <div className="flex items-center justify-between p-6 bg-surface-container-low/60 rounded-[28px] border border-white/60">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined filled">calendar_today</span>
                                        </div>
                                        <span className="font-bold text-on-surface">14 Days Standard Loan</span>
                                    </div>
                                    <span className="material-symbols-outlined text-on-surface-variant opacity-20">info</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-surface-container-low/40 flex flex-col gap-5 border-t border-surface-container-low">
                            <p className="text-[10px] text-center text-on-surface-variant/60 font-medium px-4">By confirming, you agree to our Digital Curator Policy and academic return guidelines.</p>
                            <button
                                className="w-full py-6 bg-gradient-to-r from-primary to-primary-container text-white font-black rounded-[28px] shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.95] transition-all text-xl tracking-tight"
                                onClick={() => {
                                    alert('Success! Your curated book is ready for pickup.');
                                    setShowBorrowModal(false);
                                }}
                            >
                                Confirm Borrow
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookDetailPage;
