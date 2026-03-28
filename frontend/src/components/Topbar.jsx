import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const Topbar = ({ onSearch }) => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        if (onSearch) onSearch(e.target.value);
    };

    return (
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl flex justify-between items-center h-16 px-8 ml-64 border-b border-surface-container-low/50 transition-all font-body">
            {/* Command Search Bar */}
            <div className="flex-1 max-w-2xl flex justify-center">
                <div className="relative flex items-center w-full max-w-xl group">
                    <span className="material-symbols-outlined absolute left-4 text-on-surface-variant/40 group-focus-within:text-primary transition-colors text-xl">
                        search
                    </span>
                    <input
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full pl-12 pr-12 py-2 bg-surface-container-low/60 border-none rounded-full text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-on-surface-variant/40 shadow-inner"
                        placeholder="Search the collection... (Cmd + K)"
                        type="text"
                    />
                    <div className="absolute right-3 flex items-center gap-1 opacity-20 group-focus-within:opacity-0 transition-opacity">
                        <span className="text-[10px] font-black px-1.5 py-0.5 border border-on-surface-variant rounded-md">⌘</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 border border-on-surface-variant rounded-md">K</span>
                    </div>
                </div>
            </div>

            {/* Actions & Profile */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 mr-2 px-1">
                    <NotificationDropdown />

                    <button className="w-10 h-10 hover:bg-surface-container-high rounded-full flex items-center justify-center transition-all group overflow-hidden" title="Toggle Theme">
                        <span className="material-symbols-outlined text-on-surface-variant/60 group-hover:text-primary transition-colors">
                            dark_mode
                        </span>
                    </button>

                    <button className="w-10 h-10 hover:bg-surface-container-high rounded-full flex items-center justify-center transition-all group overflow-hidden" title="Statistics">
                        <span className="material-symbols-outlined text-on-surface-variant/60 group-hover:text-primary transition-colors">
                            leaderboard
                        </span>
                    </button>
                </div>

                <div className="h-8 w-[1px] bg-outline-variant/20 mx-2"></div>

                <div className="flex items-center gap-3 pl-2 group cursor-pointer" title="Profile Details">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-black text-on-surface tracking-tighter leading-tight transition-colors group-hover:text-primary">{user?.name || 'Curator'}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-[0.1em] opacity-60 leading-none mt-0.5">{user?.role || 'Student'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary-container/10 flex items-center justify-center text-primary font-black border-2 border-primary/20 shadow-md group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
                        ) : (
                            user?.name?.charAt(0).toUpperCase() || 'U'
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
