'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Eye, Heart, BookOpen, User } from 'lucide-react';
import type { KnowledgeBaseArticle } from '@/types/knowledgeBase';

interface ArticleCardProps {
  article: KnowledgeBaseArticle;
  showExcerpt?: boolean;
  className?: string;
}

export default function ArticleCard({ 
  article, 
  showExcerpt = true, 
  className = '' 
}: ArticleCardProps) {
  const formatCategory = (category: string) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'raw-feeding-basics': 'bg-blue-100 text-blue-800',
      'food-safety': 'bg-red-100 text-red-800',
      'nutritional-guidance': 'bg-green-100 text-green-800',
      'breed-specific': 'bg-purple-100 text-purple-800',
      'success-stories': 'bg-yellow-100 text-yellow-800',
      'health-conditions': 'bg-orange-100 text-orange-800',
      'preparation-tips': 'bg-indigo-100 text-indigo-800',
      'scientific-research': 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <article className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden ${className}`}>
      {article.featured_image_url && (
        <div className="relative h-48 bg-gray-200">
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          {article.featured && (
            <span className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 text-xs font-semibold rounded">
              Featured
            </span>
          )}
          {article.sticky && (
            <span className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 text-xs font-semibold rounded">
              Pinned
            </span>
          )}
        </div>
      )}

      <div className="p-6">
        {/* Category and Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(article.category)}`}>
            {formatCategory(article.category)}
          </span>
          {article.subcategory && (
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
              {formatCategory(article.subcategory)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          <Link 
            href={`/knowledge-base/${article.slug}`}
            className="hover:text-blue-600 transition-colors"
          >
            {article.title}
          </Link>
        </h3>

        {/* Excerpt */}
        {showExcerpt && article.excerpt && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {article.excerpt}
          </p>
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {article.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded"
              >
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs text-gray-500">
                +{article.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Meta Information */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            {article.author_name && (
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                <span>{article.author_name}</span>
              </div>
            )}
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{article.reading_time_minutes} min read</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {article.view_count > 0 && (
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                <span>{article.view_count.toLocaleString()}</span>
              </div>
            )}
            {article.like_count > 0 && (
              <div className="flex items-center">
                <Heart className="w-4 h-4 mr-1" />
                <span>{article.like_count}</span>
              </div>
            )}
          </div>
        </div>

        {/* Published Date */}
        <div className="mt-3 text-xs text-gray-400">
          {article.published_at ? (
            <>Published {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</>
          ) : (
            <>Created {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}</>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <Link
            href={`/knowledge-base/${article.slug}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Read Article
          </Link>
        </div>
      </div>
    </article>
  );
}