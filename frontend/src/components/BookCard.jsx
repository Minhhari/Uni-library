import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenIcon,
  StarIcon,
  CalendarIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const BookCard = ({ book, showRecommendationReason = false }) => {
  const {
    _id,
    title,
    author,
    isbn,
    description,
    category,
    publish_year,
    status,
    cover_image,
    borrowCount,
    recommendationReason,
    strategy,
    semester,
    academicLevel
  } = book;

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-500/20';
      case 'borrowed':
        return 'bg-blue-50 text-blue-600 border border-blue-500/20';
      case 'reserved':
        return 'bg-amber-50 text-amber-600 border border-amber-500/20';
      case 'maintenance':
        return 'bg-red-50 text-red-600 border border-red-500/20';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'SẴN SÀNG';
      case 'borrowed':
        return 'ĐANG MƯỢN';
      case 'reserved':
        return 'ĐÃ ĐẶT';
      case 'maintenance':
        return 'BẢO TRÌ';
      default:
        return 'KHÔNG XÁC ĐỊNH';
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
          <StarSolidIcon
            key={index}
            className={`h-4 w-4 ${index < fullStars
                ? 'text-yellow-400'
                : index === fullStars && hasHalfStar
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating || 0})</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 overflow-hidden group">
      {/* Book Cover */}
      <div className="relative h-48 bg-gray-50 overflow-hidden">
        {cover_image ? (
          <img
            src={cover_image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <BookOpenIcon className="h-16 w-16 text-primary" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {getStatusText(status)}
          </span>
        </div>

        {/* Strategy Badge */}
        {strategy && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {strategy}
            </span>
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
          <Link
            to={`/books/${_id}`}
            className="hover:text-blue-600 transition-colors duration-200"
          >
            {title}
          </Link>
        </h3>

        {/* Author */}
        <p className="text-sm text-gray-600 mb-2 flex items-center">
          <UserIcon className="h-4 w-4 mr-1" />
          {author}
        </p>

        {/* Category */}
        {category && (
          <p className="text-sm text-gray-600 mb-2">
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
              {category.name || category}
            </span>
          </p>
        )}

        {/* Publish Year */}
        {publish_year && (
          <p className="text-sm text-gray-500 mb-2 flex items-center font-medium">
            <CalendarIcon className="h-4 w-4 mr-1 opacity-40" />
            {publish_year}
          </p>
        )}

        {/* Academic Info */}
        {(semester || academicLevel) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {semester && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                <AcademicCapIcon className="h-3 w-3 mr-1" />
                {semester}
              </span>
            )}
            {academicLevel && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                <AcademicCapIcon className="h-3 w-3 mr-1" />
                {academicLevel}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Recommendation Reason */}
        {showRecommendationReason && recommendationReason && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              <span className="font-medium">Why this book?</span> {recommendationReason}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          {borrowCount !== undefined && (
            <span className="flex items-center">
              <StarIcon className="h-4 w-4 mr-1" />
              {borrowCount} {borrowCount === 1 ? 'borrow' : 'borrows'}
            </span>
          )}

          {isbn && (
            <span className="text-xs text-gray-400">
              ISBN: {isbn}
            </span>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <Link
            to={`/books/${_id}`}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
