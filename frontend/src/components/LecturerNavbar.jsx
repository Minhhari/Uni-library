import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const LecturerNavbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-b border-surface-dim z-50 px-8 flex items-center justify-between font-body transition-all">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors duration-500">
                    <span className="material-symbols-outlined text-primary group-hover:text-white transition-colors">library_books</span>
                </div>
                <span className="text-2xl font-black tracking-tighter text-on-surface">LibraFlow</span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-10">
                {[
                    { to: '/books', label: 'Explore' },
                    { to: '/my-activity', label: 'My Activity' },
                    { to: '/transactions', label: 'Transaction' },
                    { to: '/book-requests', label: 'Yêu cầu sách' }
                ].map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `text-sm font-black tracking-tight transition-all relative py-2 ${isActive
                                ? 'text-primary'
                                : 'text-on-surface-variant hover:text-primary'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {item.label}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full animate-in fade-in zoom-in duration-300"></span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>

            {/* Right Icons & Profile */}
            <div className="flex items-center gap-6">
                <NotificationDropdown />
                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-on-surface-variant/60 hover:text-red-600 font-black text-xs uppercase tracking-widest transition-all px-4 py-2 rounded-xl hover:bg-red-50/50"
                    title="Logout"
                >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Logout
                </button>

                <div className="h-8 w-[1px] bg-surface-dim mx-2"></div>

                <Link to="/profile" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all shadow-sm group-hover:shadow-lg duration-300">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase">
                                {user?.name?.charAt(0) || 'L'}
                            </div>
                        )}
                    </div>
                </Link>
            </div>
        </nav>
    );
};

export default LecturerNavbar;
