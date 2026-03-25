import React, { useEffect, useState } from 'react';
import { recommendationAPI } from '../services/api';
import { BookCard, LoadingSpinner, ErrorMessage } from '../components';

const RecommendationPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await recommendationAPI.getPersonalized({
        limit: 10,
      });

      setBooks(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const renderBooks = () => {
    if (!books.length) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-gray-500 text-center py-8">
            No recommendations available
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">For You</h2>
          <button
            onClick={loadRecommendations}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
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
        <ErrorMessage message={error} onRetry={loadRecommendations} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Recommended For You
          </h1>
          <p className="text-gray-600">
            Discover books tailored to your interests
          </p>
        </div>

        {/* Content */}
        {renderBooks()}
      </div>
    </div>
  );
};

export default RecommendationPage;
