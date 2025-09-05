"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BlogArticle } from '@/types/blog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Calendar, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ArticleCardProps {
  article: BlogArticle;
  className?: string;
  showViews?: boolean;
  priority?: boolean; // For image loading priority
}

export function ArticleCard({ 
  article, 
  className = '',
  showViews = false,
  priority = false 
}: ArticleCardProps) {
  const categoryColor = article.category.color || 'pumpkin';
  
  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`}>
      <Link href={`/blog/${article.category.slug}/${article.slug}`} className="block">
        {/* Featured Image */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-olivine-100 to-zomp-100">
          {article.featuredImage ? (
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-olivine-200 to-zomp-200">
              <div className="text-center text-charcoal-600">
                <div className="w-16 h-16 mx-auto mb-2 bg-white rounded-full flex items-center justify-center">
                  <svg 
                    className="w-8 h-8 text-charcoal-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium">Raw Feeding Article</p>
              </div>
            </div>
          )}
          
          {/* Featured Badge */}
          {article.featured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-pumpkin text-white font-semibold px-3 py-1">
                Featured
              </Badge>
            </div>
          )}
          
          {/* Category Badge */}
          <div className="absolute top-3 right-3">
            <Badge 
              className={`bg-${categoryColor} text-white font-medium px-2 py-1 text-xs`}
              style={{
                backgroundColor: `var(--${categoryColor})`,
                color: 'white'
              }}
            >
              {article.category.name}
            </Badge>
          </div>
        </div>

        <CardHeader className="pb-3">
          <h3 className="text-xl font-heading font-bold text-charcoal-900 line-clamp-2 group-hover:text-pumpkin transition-colors duration-200">
            {article.title}
          </h3>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Article Excerpt */}
          <p className="text-charcoal-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {article.excerpt}
          </p>

          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-500 mb-4">
            {/* Author */}
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{article.author.name}</span>
            </div>

            {/* Reading Time */}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{article.readingTime} min read</span>
            </div>

            {/* Published Date */}
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDistanceToNow(article.publishedAt, { addSuffix: true })}</span>
            </div>

            {/* Views (if enabled) */}
            {showViews && article.views && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{article.views} views</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200 transition-colors"
                >
                  #{tag}
                </Badge>
              ))}
              {article.tags.length > 3 && (
                <Badge 
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-charcoal-100 text-charcoal-600"
                >
                  +{article.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        {/* Hover Effect Indicator */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-pumpkin to-sunglow transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </Link>
    </Card>
  );
}

// Skeleton component for loading states
export function ArticleCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <div className="h-48 w-full bg-charcoal-200" />
      
      <CardHeader className="pb-3">
        <div className="h-6 bg-charcoal-200 rounded mb-2" />
        <div className="h-6 bg-charcoal-200 rounded w-3/4" />
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-charcoal-200 rounded" />
          <div className="h-4 bg-charcoal-200 rounded" />
          <div className="h-4 bg-charcoal-200 rounded w-2/3" />
        </div>

        <div className="flex gap-4 mb-4">
          <div className="h-3 bg-charcoal-200 rounded w-16" />
          <div className="h-3 bg-charcoal-200 rounded w-16" />
          <div className="h-3 bg-charcoal-200 rounded w-20" />
        </div>

        <div className="flex gap-1">
          <div className="h-5 bg-charcoal-200 rounded w-12" />
          <div className="h-5 bg-charcoal-200 rounded w-16" />
          <div className="h-5 bg-charcoal-200 rounded w-14" />
        </div>
      </CardContent>
    </Card>
  );
}