import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LecturerNavbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-gray-100 z-50 px-8 flex items-center justify-between font-body">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tighter text-emerald-600">LibraFlow</span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-8">
                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        `text-sm font-bold transition-all ${isActive ? 'text-emerald-600 border-b-2 border-emerald-600 pb-1' : 'text-gray-500 hover:text-emerald-600'}`
                    }
                >
                    Explore
                </NavLink>
                <NavLink
                    to="/my-activity"
                    className={({ isActive }) =>
                        `text-sm font-bold transition-all ${isActive ? 'text-emerald-600 border-b-2 border-emerald-600 pb-1' : 'text-gray-500 hover:text-emerald-600'}`
                    }
                >
                    My Activity
                </NavLink>
                <NavLink
                    to="/transactions"
                    className={({ isActive }) =>
                        `text-sm font-bold transition-all ${isActive ? 'text-emerald-600 border-b-2 border-emerald-600 pb-1' : 'text-gray-500 hover:text-emerald-600'}`
                    }
                >
                    Transaction
                </NavLink>
                <NavLink
                    to="/book-requests"
                    className={({ isActive }) =>
                        `text-sm font-bold transition-all ${isActive ? 'text-emerald-600 border-b-2 border-emerald-600 pb-1' : 'text-gray-500 hover:text-emerald-600'}`
                    }
                >
                    Yêu cầu sách
                </NavLink>
            </div>

            {/* Right Icons & Profile */}
            <div className="flex items-center gap-6">
                <button className="text-gray-400 hover:text-emerald-600 transition-colors">
                    <span className="material-symbols-outlined text-2xl">notifications</span>
                </button>
                <button className="text-gray-400 hover:text-emerald-600 transition-colors">
                    <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                </button>

                <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>

                <Link to="/profile" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-emerald-500 transition-all">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                                {user?.name?.charAt(0).toUpperCase() || 'L'}
                            </div>
                        )}
                    </div>
                </Link>
            </div>
        </nav>
    );
};

export default LecturerNavbar;
