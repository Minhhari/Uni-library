import React, { useState, useEffect } from 'react';
import { DashboardCard, ChartBorrowStats } from '../components';
import {
  UserGroupIcon,
  BookOpenIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { userAPI, bookAPI, borrowAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLocation, Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [myBooks, setMyBooks] = useState([]);

  const isLoansPage = location.pathname === '/loans';
  const isReservationsPage = location.pathname === '/reservations';

  useEffect(() => {
    loadDashboardData();
  }, [user, location.pathname]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      if (user?.role === 'admin') {
        await loadAdminStats();
      } else if (user?.role === 'librarian') {
        await loadLibrarianStats();
      } else if (user?.role === 'student' || user?.role === 'lecturer') {
        await loadStudentStats();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminStats = async () => {
    try {
      // Get users count
      const usersResponse = await userAPI.getAllUsers({ limit: 1 });
      const totalUsers = usersResponse.data.total || 0;

      // Get books count
      const booksResponse = await bookAPI.getBooks({ limit: 1 });
      const totalBooks = booksResponse.data.total || 0;

      // Get borrow statistics
      const borrowStats = await getBorrowStatistics();

      setStats({
        totalUsers,
        totalBooks,
        activeBorrows: borrowStats.active,
        pendingRequests: borrowStats.pending,
        overdueReturns: borrowStats.overdue,
        totalRevenue: borrowStats.revenue
      });

      setRecentActivities(borrowStats.recent || []);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  };

  const loadLibrarianStats = async () => {
    try {
      const borrowStats = await getBorrowStatistics();

      setStats({
        pendingRequests: borrowStats.pending,
        activeBorrows: borrowStats.active,
        dueToday: borrowStats.dueToday,
        overdueReturns: borrowStats.overdue,
        processedToday: borrowStats.processedToday
      });

      setRecentActivities(borrowStats.recent || []);
    } catch (error) {
      console.error('Error loading librarian stats:', error);
    }
  };

  const loadStudentStats = async () => {
    try {
      const myBooksResponse = await borrowAPI.getMyBooks();
      const booksList = myBooksResponse.data || [];
      setMyBooks(booksList);

      const activeBorrows = booksList.filter(book =>
        book.status === 'approved' || book.status === 'borrowed' || book.status === 'waiting_for_pickup'
      ).length;

      const overdueBooks = booksList.filter(book =>
        book.status === 'approved' &&
        new Date(book.dueDate) < new Date()
      ).length;

      const reservedBooks = booksList.filter(book =>
        book.status === 'reserved'
      ).length;

      setStats({
        activeBorrows,
        overdueBooks,
        reservedBooks,
        totalBorrows: booksList.length
      });

      setRecentActivities(booksList.slice(0, 5));
    } catch (error) {
      console.error('Error loading student stats:', error);
    }
  };

  const getBorrowStatistics = async () => {
    // This would be a real API call to get statistics
    // For now, return mock data
    return {
      active: 45,
      pending: 12,
      overdue: 8,
      revenue: 2500000,
      dueToday: 5,
      processedToday: 18,
      recent: [
        {
          id: 1,
          type: 'borrow',
          user: 'Nguyễn Văn A',
          book: 'Lập trình Java',
          time: '2 giờ trước',
          status: 'approved'
        },
        {
          id: 2,
          type: 'return',
          user: 'Trần Thị B',
          book: 'Cấu trúc dữ liệu',
          time: '3 giờ trước',
          status: 'completed'
        },
        {
          id: 3,
          type: 'request',
          user: 'Lê Văn C',
          book: 'Máy học cơ bản',
          time: '5 giờ trước',
          status: 'pending'
        }
      ]
    };
  };

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Users"
          value={stats.totalUsers || 0}
          icon={UserGroupIcon}
          color="blue"
          change={12}
          changeType="increase"
        />
        <DashboardCard
          title="Total Books"
          value={stats.totalBooks || 0}
          icon={BookOpenIcon}
          color="green"
          change={8}
          changeType="increase"
        />
        <DashboardCard
          title="Active Borrows"
          value={stats.activeBorrows || 0}
          icon={DocumentTextIcon}
          color="yellow"
          change={-3}
          changeType="decrease"
        />
        <DashboardCard
          title="Total Revenue"
          value={`₫${((stats.totalRevenue || 0) / 1000000).toFixed(1)}M`}
          icon={CurrencyDollarIcon}
          color="purple"
          change={15}
          changeType="increase"
        />
      </div>

      {/* Chart Section */}
      <ChartBorrowStats timeRange="week" />

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          title="Pending Requests"
          value={stats.pendingRequests || 0}
          icon={ClockIcon}
          color="yellow"
        />
        <DashboardCard
          title="Overdue Returns"
          value={stats.overdueReturns || 0}
          icon={ExclamationTriangleIcon}
          color="red"
        />
        <DashboardCard
          title="Completed Today"
          value={stats.processedToday || 0}
          icon={CheckCircleIcon}
          color="green"
        />
      </div>
    </div>
  );

  const renderLibrarianDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Pending Requests"
          value={stats.pendingRequests || 0}
          icon={ClockIcon}
          color="yellow"
        />
        <DashboardCard
          title="Active Borrows"
          value={stats.activeBorrows || 0}
          icon={DocumentTextIcon}
          color="blue"
        />
        <DashboardCard
          title="Due Today"
          value={stats.dueToday || 0}
          icon={ExclamationTriangleIcon}
          color="red"
        />
      </div>

      {/* Chart Section */}
      <ChartBorrowStats timeRange="week" />

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="Overdue Returns"
          value={stats.overdueReturns || 0}
          icon={ExclamationTriangleIcon}
          color="red"
        />
        <DashboardCard
          title="Processed Today"
          value={stats.processedToday || 0}
          icon={CheckCircleIcon}
          color="green"
        />
      </div>
    </div>
  );

  const renderStudentDashboard = () => {
    const activeLoans = myBooks.filter(b => b.status === 'approved' || b.status === 'borrowed' || b.status === 'waiting_for_pickup');
    const reservations = myBooks.filter(b => b.status === 'reserved');
    const others = myBooks.filter(b => !['approved', 'borrowed', 'waiting_for_pickup', 'reserved'].includes(b.status));

    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-body max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-0">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">My Activity</h1>
          <p className="text-gray-500 font-medium">Welcome back, {user?.name}! Here's what's happening today.</p>
        </div>

        {/* Stats Row */}
        {(stats.activeBorrows > 0 || stats.overdueBooks > 0 || stats.reservedBooks > 0 || stats.totalBorrows > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.activeBorrows > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 group-hover:text-blue-500 transition-colors">Active Borrows</p>
                  <h3 className="text-3xl font-black text-gray-900 leading-none">{stats.activeBorrows}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                  <span className="material-symbols-outlined filled">description</span>
                </div>
              </div>
            )}

            {stats.overdueBooks > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 group-hover:text-rose-500 transition-colors">Overdue Books</p>
                  <h3 className="text-3xl font-black text-gray-900 leading-none">{stats.overdueBooks}</h3>
                </div>
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                  <span className="material-symbols-outlined filled">warning</span>
                </div>
              </div>
            )}

            {stats.reservedBooks > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 group-hover:text-amber-500 transition-colors">Reserved Books</p>
                  <h3 className="text-3xl font-black text-gray-900 leading-none">{stats.reservedBooks}</h3>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                  <span className="material-symbols-outlined filled">schedule</span>
                </div>
              </div>
            )}

            {stats.totalBorrows > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 group-hover:text-emerald-500 transition-colors">Total Borrows</p>
                  <h3 className="text-3xl font-black text-gray-900 leading-none">{stats.totalBorrows}</h3>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                  <span className="material-symbols-outlined filled">leaderboard</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Combined Lists Section */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 px-2 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-emerald-500 rounded-full"></span>
            Library Status
          </h2>

          <div className="space-y-12">
            {/* Active Loans Area */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  Active Loans
                  <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{activeLoans.length}</span>
                </h3>
              </div>

              {activeLoans.length === 0 ? (
                <p className="text-gray-400 text-sm italic py-4">No active loans at this time.</p>
              ) : (
                <div className="space-y-3">
                  {activeLoans.map((item, index) => (
                    <div key={index} className="group hover:bg-gray-50/50 p-4 rounded-2xl transition-all border border-transparent hover:border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <div>
                          <p className="font-extrabold text-gray-900 group-hover:text-emerald-600 transition-colors">{item.bookId?.title || item.title}</p>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                            Due: {new Date(item.dueDate).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100/50">
                        {item.status === 'waiting_for_pickup' ? 'CHỜ LẤY SÁCH' : item.status === 'approved' ? 'ĐANG MƯỢN' : item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reservations Area */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  My Reservations
                  <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{reservations.length}</span>
                </h3>
              </div>

              {reservations.length === 0 ? (
                <p className="text-gray-400 text-sm italic py-4">No pending reservations.</p>
              ) : (
                <div className="space-y-3">
                  {reservations.map((item, index) => (
                    <div key={index} className="group hover:bg-gray-50/50 p-4 rounded-2xl transition-all border border-transparent hover:border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                        <div>
                          <p className="font-extrabold text-gray-900 group-hover:text-amber-600 transition-colors">{item.bookId?.title || item.title}</p>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Reserved on: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-100/50">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History Summary Area */}
            {others.length > 0 && (
              <div className="space-y-6 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">Other Activity</h3>
                </div>
                <div className="space-y-3">
                  {others.slice(0, 3).map((item, index) => (
                    <div key={index} className="p-4 rounded-2xl flex items-center justify-between border border-transparent">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <div>
                          <p className="font-extrabold text-gray-900">{item.bookId?.title || item.title}</p>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Completed</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-gray-200">
                        {item.status === 'expired' ? 'HỦY DO QUÁ HẠN LẤY' : item.status === 'returned' ? 'ĐÃ TRẢ' : item.status === 'rejected' ? 'BỊ TỪ CHỐI' : item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRecentActivities = () => {
    if (!recentActivities || recentActivities.length === 0) {
      return null;
    }

    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${activity.status === 'approved' || activity.status === 'completed' ? 'bg-green-500' :
                  activity.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                <div>
                  <p className="font-medium text-gray-900">
                    {activity.user && `${activity.user} - `}
                    {activity.book}
                  </p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${activity.status === 'approved' || activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                }`}>
                {activity.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Hide for students as they have an integrated header in renderStudentDashboard */}
        {!(user?.role === 'student' || user?.role === 'lecturer' || user?.role === 'user' || !user?.role) && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user?.role === 'admin' ? 'Admin Dashboard' : 'Librarian Dashboard'}
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.name}! Here's what's happening today.
            </p>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="space-y-6">
          {user?.role === 'admin' && renderAdminDashboard()}
          {user?.role === 'librarian' && renderLibrarianDashboard()}
          {(user?.role === 'student' || user?.role === 'lecturer' || user?.role === 'user' || !user?.role) && renderStudentDashboard()}

          {/* Recent Activities - Admin/Librarian only */}
          {(user?.role === 'admin' || user?.role === 'librarian') && renderRecentActivities()}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
