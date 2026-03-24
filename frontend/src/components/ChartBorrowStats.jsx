import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const ChartBorrowStats = ({ timeRange = 'week' }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadChartData();
  }, [timeRange]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      // Mock data - in real app, this would come from API
      const mockData = {
        week: [
          { day: 'Mon', borrows: 45, returns: 38 },
          { day: 'Tue', borrows: 52, returns: 41 },
          { day: 'Wed', borrows: 38, returns: 45 },
          { day: 'Thu', borrows: 65, returns: 52 },
          { day: 'Fri', borrows: 48, returns: 38 },
          { day: 'Sat', borrows: 28, returns: 22 },
          { day: 'Sun', borrows: 15, returns: 18 }
        ],
        month: [
          { day: 'Week 1', borrows: 245, returns: 198 },
          { day: 'Week 2', borrows: 312, returns: 287 },
          { day: 'Week 3', borrows: 278, returns: 265 },
          { day: 'Week 4', borrows: 389, returns: 342 }
        ],
        year: [
          { day: 'Jan', borrows: 1245, returns: 1198 },
          { day: 'Feb', borrows: 1087, returns: 1056 },
          { day: 'Mar', borrows: 1456, returns: 1387 },
          { day: 'Apr', borrows: 1678, returns: 1598 },
          { day: 'May', borrows: 1834, returns: 1765 },
          { day: 'Jun', borrows: 2145, returns: 2087 }
        ]
      };

      const data = mockData[timeRange] || mockData.week;
      setChartData(data);

      // Calculate statistics
      const totalBorrows = data.reduce((sum, item) => sum + item.borrows, 0);
      const totalReturns = data.reduce((sum, item) => sum + item.returns, 0);
      const avgBorrows = Math.round(totalBorrows / data.length);
      const avgReturns = Math.round(totalReturns / data.length);
      const peakDay = data.reduce((max, item) => 
        item.borrows > max.borrows ? item : max, data[0]
      );

      setStats({
        totalBorrows,
        totalReturns,
        avgBorrows,
        avgReturns,
        peakDay: peakDay.day,
        peakBorrows: peakDay.borrows
      });

    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxValue = () => {
    return Math.max(...chartData.map(item => Math.max(item.borrows, item.returns)));
  };

  const getBarHeight = (value) => {
    const maxValue = getMaxValue();
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Borrow Statistics</h3>
          <p className="text-sm text-gray-600">
            {timeRange === 'week' ? 'Last 7 days' :
             timeRange === 'month' ? 'Last 4 weeks' : 'Last 6 months'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadChartData()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChartBarIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <div className="flex items-end justify-between h-64 px-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex items-end justify-center space-x-1" style={{ height: '240px' }}>
                {/* Borrows Bar */}
                <div className="flex-1 bg-blue-500 rounded-t relative group cursor-pointer hover:bg-blue-600 transition-colors">
                  <div 
                    className="w-full bg-blue-600 rounded-t transition-all duration-300"
                    style={{ height: `${getBarHeight(item.borrows)}%` }}
                    title={`Borrows: ${item.borrows}`}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap transition-opacity">
                      {item.borrows} borrows
                    </div>
                  </div>
                </div>
                
                {/* Returns Bar */}
                <div className="flex-1 bg-green-500 rounded-t relative group cursor-pointer hover:bg-green-600 transition-colors">
                  <div 
                    className="w-full bg-green-600 rounded-t transition-all duration-300"
                    style={{ height: `${getBarHeight(item.returns)}%` }}
                    title={`Returns: ${item.returns}`}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap transition-opacity">
                      {item.returns} returns
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Day Label */}
              <div className="mt-2 text-xs text-gray-600 font-medium">
                {item.day}
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Borrows</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Returns</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Borrows</p>
          <p className="text-lg font-semibold text-gray-900">{stats.totalBorrows || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Returns</p>
          <p className="text-lg font-semibold text-gray-900">{stats.totalReturns || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Avg Daily Borrows</p>
          <p className="text-lg font-semibold text-gray-900">{stats.avgBorrows || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Avg Daily Returns</p>
          <p className="text-lg font-semibold text-gray-900">{stats.avgReturns || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Peak Day</p>
          <p className="text-lg font-semibold text-blue-600">
            {stats.peakDay} ({stats.peakBorrows || 0})
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChartBorrowStats;
