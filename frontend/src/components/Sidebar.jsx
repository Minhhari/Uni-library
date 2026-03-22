import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: 'dashboard' },
        { name: 'Library', path: '/books', icon: 'menu_book' },
        { name: 'My Loans', path: '/loans', icon: 'history' },
        { name: 'Transactions', path: '/transactions', icon: 'receipt_long' },
        { name: 'Reports', path: '/reports', icon: 'bar_chart' },
    ];

    if (user?.role === 'admin' || user?.role === 'librarian') {
        navItems.push(
            { name: 'Admin Panel', path: '/admin', icon: 'admin_panel_settings' },
            { name: 'Users', path: '/users', icon: 'group' }
        );
    }

    return (
        <aside className="bg-slate-900 dark:bg-slate-950 h-screen w-64 fixed left-0 top-0 flex flex-col py-8 shadow-xl z-50 transition-all font-body">
            {/* Logo */}
            <div className="px-8 mb-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">L</div>
                <div className="flex flex-col">
                    <span className="text-2xl font-black tracking-tighter text-white leading-none">LibraFlow</span>
                    <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase mt-1">Systems</span>
                </div>
            </div>

            {/* User Profile Card */}
            <div className="px-6 mb-8">
                <div className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/20 backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary-container/20 flex items-center justify-center text-primary-fixed font-black border border-primary/20">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            user?.name?.charAt(0).toUpperCase() || 'U'
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-white text-sm font-bold truncate leading-tight">{user?.name || 'User'}</span>
                        <span className="text-slate-500 text-[10px] truncate uppercase font-bold tracking-widest mt-0.5">ID: {user?._id?.slice(-6).toUpperCase() || '---'}</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar scroll-smooth">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-6 py-3.5 transition-all duration-300 group ${isActive
                                ? 'text-emerald-400 font-bold border-l-4 border-emerald-500 bg-slate-800/60'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                            {item.icon}
                        </span>
                        <span className="tracking-tight text-sm font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer Actions */}
            <div className="mt-auto border-t border-slate-800/50 pt-6 px-2">
                <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                        `flex items-center gap-4 px-6 py-3.5 transition-all duration-300 rounded-xl ${isActive
                            ? 'text-emerald-400 font-bold bg-slate-800/60'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                        }`
                    }
                >
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                    <span className="tracking-tight text-sm font-medium">Settings</span>
                </NavLink>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-4 px-6 py-3.5 text-slate-400 hover:text-error hover:bg-error/5 transition-all duration-300 rounded-xl text-left"
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span className="tracking-tight text-sm font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
