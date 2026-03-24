import React, { useState, useEffect, useCallback } from 'react';
import { recommendationAPI } from '../services/api';
import { BookCard, LoadingSpinner, ErrorMessage } from '../components';
import { 
  BookOpenIcon, 
  StarIcon, 
  AcademicCapIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const RecommendationPage = () => {
  const [recommendations, setRecommendations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('comprehensive');
  const [semesterInfo, setSemesterInfo] = useState(null);
  const [filters, setFilters] = useState({
    limit: 10,
    includePersonalized: true,
    includePopular: true,
    includeSemester: true,
    includeCollaborative: true,
    includeCategory: true
  });

  // Debounced API call
  const debouncedLoadRecommendations = useCallback(
    debounce(() => {
      loadRecommendations();
    }, 500),
    [activeTab, filters.limit, filters.includePersonalized, filters.includePopular, filters.includeSemester, filters.includeCollaborative, filters.includeCategory]
  );

  useEffect(() => {
    loadSemesterInfo();
    debouncedLoadRecommendations();
  }, [activeTab, filters.limit, filters.includePersonalized, filters.includePopular, filters.includeSemester, filters.includeCollaborative, filters.includeCategory]);

  // Simple debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const loadSemesterInfo = async () => {
    try {
      const response = await recommendationAPI.getSemesterInfo();
      setSemesterInfo(response.data.data);
    } catch (err) {
      console.error('Error loading semester info:', err);
    }
  };

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      const params = { limit: filters.limit };

      switch (activeTab) {
        case 'comprehensive':
          response = await recommendationAPI.getRecommendations(filters);
          break;
        case 'personalized':
          response = await recommendationAPI.getPersonalized(params);
          break;
        case 'popular':
          response = await recommendationAPI.getPopular(params);
          break;
        case 'collaborative':
          response = await recommendationAPI.getCollaborative(params);
          break;
        case 'semester':
          response = await recommendationAPI.getSemester(params);
          break;
        case 'academic':
          response = await recommendationAPI.getAcademic(params);
          break;
        default:
          response = await recommendationAPI.getRecommendations(filters);
      }

      setRecommendations(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load recommendations');
      console.error('Error loading recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getTabIcon = (tabName) => {
    const icons = {
      comprehensive: ChartBarIcon,
      personalized: UserGroupIcon,
      popular: StarIcon,
      collaborative: UserGroupIcon,
      semester: CalendarIcon,
      academic: AcademicCapIcon
    };
    return icons[tabName] || BookOpenIcon;
  };

  const getTabLabel = (tabName) => {
    const labels = {
      comprehensive: 'Comprehensive',
      personalized: 'For You',
      popular: 'Popular',
      collaborative: 'Similar Users',
      semester: 'This Semester',
      academic: 'Academic Progress'
    };
    return labels[tabName] || tabName;
  };

  const renderRecommendationSection = (title, books, strategy) => {
    if (!books || books.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
          <p className="text-gray-500 text-center py-8">No recommendations available</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {books[0]?.strategy && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {books[0].strategy}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {books.map((book, index) => (
            <BookCard 
              key={book._id || `book-${index}`} 
              book={book}
              showRecommendationReason={true}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderComprehensiveView = () => {
    const sections = [];
    
    if (recommendations.personalized) {
      sections.push({
        title: 'Personalized for You',
        books: recommendations.personalized,
        strategy: 'user-history'
      });
    }
    
    if (recommendations.popular) {
      sections.push({
        title: 'Popular Books',
        books: recommendations.popular,
        strategy: 'popularity'
      });
    }
    
    if (recommendations.semester) {
      sections.push({
        title: 'This Semester',
        books: recommendations.semester,
        strategy: 'semester-based'
      });
    }
    
    if (recommendations.collaborative) {
      sections.push({
        title: 'Users Like You Also Read',
        books: recommendations.collaborative,
        strategy: 'collaborative'
      });
    }
    
    if (recommendations.category) {
      sections.push({
        title: 'Academic Progress',
        books: recommendations.category,
        strategy: 'academic-progress'
      });
    }

    return (
      <div className="space-y-6">
        {recommendations.metadata && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Recommendation Info</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Current Semester:</span>
                <p className="font-medium text-blue-900">{semesterInfo?.semesterName || 'Loading...'}</p>
              </div>
              <div>
                <span className="text-blue-700">Department:</span>
                <p className="font-medium text-blue-900">{recommendations.metadata.userDepartment}</p>
              </div>
              <div>
                <span className="text-blue-700">User Role:</span>
                <p className="font-medium text-blue-900">{recommendations.metadata.userRole}</p>
              </div>
              <div>
                <span className="text-blue-700">Strategies Used:</span>
                <p className="font-medium text-blue-900">{recommendations.metadata.strategies?.length || 0}</p>
              </div>
            </div>
          </div>
        )}
        
        {sections.map((section, index) => (
          <div key={index}>
            {renderRecommendationSection(section.title, section.books, section.strategy)}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage 
          message={error} 
          onRetry={loadRecommendations}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Recommendations</h1>
          <p className="text-gray-600">
            Discover your next favorite book based on your reading history and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['comprehensive', 'personalized', 'popular', 'collaborative', 'semester', 'academic'].map((tab) => {
                const Icon = getTabIcon(tab);
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon
                      className={`mr-2 h-5 w-5 ${
                        activeTab === tab ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {getTabLabel(tab)}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Filters for comprehensive view */}
        {activeTab === 'comprehensive' && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Filter Strategies</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.keys(filters).map((key) => {
                if (key === 'limit') return null;
                return (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters[key]}
                      onChange={(e) => handleFilterChange(key, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {key.replace('include', '').replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of recommendations
              </label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'comprehensive' ? (
            renderComprehensiveView()
          ) : (
            renderRecommendationSection(
              getTabLabel(activeTab),
              Array.isArray(recommendations) ? recommendations : [],
              activeTab
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationPage;
