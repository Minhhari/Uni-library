import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const ROLE_LABELS = {
    admin: 'Quản trị viên',
    librarian: 'Thủ thư',
    lecturer: 'Giảng viên',
    student: 'Sinh viên',
};

const Topbar = ({ onSearch }) => {
    const { user } = useAuth();

    return (
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl flex justify-end items-center h-16 px-8 ml-64 border-b border-surface-container-low/50 transition-all font-body">
            {/* Actions & Profile */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 mr-2 px-1">
                    <NotificationDropdown />

                    <button className="w-10 h-10 hover:bg-surface-container-high rounded-full flex items-center justify-center transition-all group overflow-hidden" title="Thống kê">
                        <span className="material-symbols-outlined text-on-surface-variant/60 group-hover:text-primary transition-colors text-xl">
                            leaderboard
                        </span>
                    </button>
                </div>

                <div className="h-8 w-[1px] bg-outline-variant/20 mx-2"></div>

                <div className="flex items-center gap-3 pl-2 group cursor-pointer" title="Thông tin cá nhân">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-black text-on-surface tracking-tighter leading-tight transition-colors group-hover:text-primary">{user?.name || 'Thành viên'}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-[0.1em] opacity-60 leading-none mt-0.5">{ROLE_LABELS[user?.role] || user?.role || 'Học viên'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary-container/10 flex items-center justify-center text-primary font-black border-2 border-primary/20 shadow-md group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
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
