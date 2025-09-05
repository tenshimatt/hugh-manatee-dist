"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BlogArticle } from '@/types/blog';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Calendar, ArrowRight, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeaturedArticleProps {
  article: BlogArticle;
  className?: string;
  showViews?: boolean;
}

export function FeaturedArticle({ 
  article, 
  className = '',
  showViews = false 
}: FeaturedArticleProps) {
  const categoryColor = article.category.color || 'pumpkin';
  
  return (
    <div className={`group relative overflow-hidden rounded-xl bg-gradient-to-r from-charcoal-900 to-charcoal-800 text-white ${className}`}>
      <Link href={`/blog/${article.category.slug}/${article.slug}`} className="block">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          {article.featuredImage ? (
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-olivine-600/30 to-zomp-600/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal-900/80 to-charcoal-800/60" />
        </div>

        {/* Content */}
        <div className="relative p-8 md:p-12 min-h-[400px] flex flex-col justify-between">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Badge className="bg-pumpkin text-white font-bold px-4 py-2 text-sm">
                ⭐ Featured Article
              </Badge>
              <Badge 
                className={`bg-${categoryColor} text-white font-medium px-3 py-1`}
                style={{
                  backgroundColor: `var(--${categoryColor})`,
                  color: 'white'
                }}
              >
                {article.category.name}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4 leading-tight group-hover:text-sunglow transition-colors duration-300">
              {article.title}
            </h1>
            
            <p className="text-lg md:text-xl text-gray-200 mb-6 leading-relaxed max-w-3xl">
              {article.excerpt}
            </p>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
              {/* Author */}
              <div className="flex items-center gap-2">
                {article.author.avatar ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={article.author.avatar}
                      alt={article.author.name}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-charcoal-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <span className="font-medium">{article.author.name}</span>
              </div>

              {/* Reading Time */}
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{article.readingTime} min read</span>
              </div>

              {/* Published Date */}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDistanceToNow(article.publishedAt, { addSuffix: true })}</span>
              </div>

              {/* Views (if enabled) */}
              {showViews && article.views && (
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{article.views} views</span>
                </div>
              )}
            </div>

            {/* Read More Button */}
            <div className="flex items-center gap-2 text-sunglow font-semibold group-hover:text-white transition-colors duration-300">
              <span>Read Full Article</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </div>

        {/* Tags Overlay */}
        {article.tags.length > 0 && (
          <div className="absolute top-6 right-6">
            <div className="flex flex-wrap gap-1 max-w-48">
              {article.tags.slice(0, 2).map((tag, index) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="text-xs px-2 py-1 bg-white/20 text-white backdrop-blur-sm border-white/30"
                >
                  #{tag}
                </Badge>
              ))}
              {article.tags.length > 2 && (
                <Badge 
                  variant="secondary"
                  className="text-xs px-2 py-1 bg-white/20 text-white backdrop-blur-sm border-white/30"
                >
                  +{article.tags.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-pumpkin/10 to-sunglow/10 pointer-events-none" />
      </Link>
    </div>
  );
}

// Skeleton component for loading states  
export function FeaturedArticleSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse overflow-hidden rounded-xl bg-charcoal-200 min-h-[400px] ${className}`}>
      <div className="p-8 md:p-12 h-full flex flex-col justify-between">
        <div>
          <div className="flex gap-3 mb-6">
            <div className="h-8 bg-charcoal-300 rounded-full w-32" />
            <div className="h-8 bg-charcoal-300 rounded-full w-24" />
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="h-12 bg-charcoal-300 rounded w-full" />
            <div className="h-12 bg-charcoal-300 rounded w-4/5" />
          </div>
          
          <div className="space-y-3">
            <div className="h-6 bg-charcoal-300 rounded w-full" />
            <div className="h-6 bg-charcoal-300 rounded w-3/4" />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="h-4 bg-charcoal-300 rounded w-20" />
            <div className="h-4 bg-charcoal-300 rounded w-16" />
            <div className="h-4 bg-charcoal-300 rounded w-24" />
          </div>
          <div className="h-6 bg-charcoal-300 rounded w-32" />
        </div>
      </div>
    </div>
  );
}