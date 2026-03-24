import React from 'react';
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

const DashboardCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  change, 
  changeType,
  subtitle,
  trend = false 
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      iconBg: 'bg-green-100'
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      iconBg: 'bg-red-100'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
      iconBg: 'bg-purple-100'
    }
  };

  const currentColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 border ${currentColor.border} hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && change !== undefined && (
            <div className="flex items-center mt-2">
              {changeType === 'increase' ? (
                <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 1.414z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`text-sm font-medium ${
                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(change)}% from last month
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${currentColor.iconBg} ml-4`}>
          {typeof Icon === 'string' ? (
            <span className="material-symbols-outlined text-[20px]">{Icon}</span>
          ) : (
            <Icon className={`h-6 w-6 ${currentColor.text}`} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
