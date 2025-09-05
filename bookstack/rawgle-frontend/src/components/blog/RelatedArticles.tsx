"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogArticle } from '@/types/blog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight, Lightbulb } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RelatedArticlesProps {
  articles: BlogArticle[];
  className?: string;
  title?: string;
}

export function RelatedArticles({ 
  articles, 
  className = '',
  title = "Related Articles"
}: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-charcoal-900">
          <Lightbulb className="w-5 h-5 text-sunglow" />
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {articles.map((article, index) => (
          <RelatedArticleItem 
            key={article.id} 
            article={article} 
            index={index}
          />
        ))}
        
        {articles.length >= 3 && (
          <div className="pt-4 border-t border-charcoal-200">
            <Link 
              href="/blog"
              className="inline-flex items-center gap-2 text-pumpkin hover:text-pumpkin-600 font-medium transition-colors group"
            >
              Browse All Articles
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RelatedArticleItemProps {
  article: BlogArticle;
  index: number;
}

function RelatedArticleItem({ article, index }: RelatedArticleItemProps) {
  const categoryColor = article.category.color || 'pumpkin';
  
  return (
    <Link 
      href={`/blog/${article.category.slug}/${article.slug}`}
      className="group block"
    >
      <div className="flex gap-4 p-3 rounded-lg transition-all duration-200 hover:bg-olivine-50 hover:shadow-sm">
        {/* Article Image */}
        <div className="relative w-20 h-16 rounded-md overflow-hidden flex-shrink-0 bg-gradient-to-br from-olivine-100 to-zomp-100">
          {article.featuredImage ? (
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-charcoal-600">
                  {index + 1}
                </span>
              </div>
            </div>
          )}
          
          {/* Index Badge for items without images */}
          {!article.featuredImage && (
            <div className="absolute top-1 left-1">
              <div className="w-5 h-5 bg-charcoal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
            </div>
          )}
        </div>

        {/* Article Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium text-charcoal-900 line-clamp-2 text-sm leading-tight group-hover:text-pumpkin transition-colors">
              {article.title}
            </h4>
            <Badge 
              className={`flex-shrink-0 text-xs px-2 py-0.5 bg-${categoryColor} text-white`}
              style={{
                backgroundColor: `var(--${categoryColor})`,
                color: 'white'
              }}
            >
              {article.category.name}
            </Badge>
          </div>
          
          <p className="text-xs text-charcoal-600 line-clamp-2 mb-2 leading-relaxed">
            {article.excerpt}
          </p>
          
          <div className="flex items-center gap-3 text-xs text-charcoal-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{article.readingTime} min</span>
            </div>
            <span>•</span>
            <span>{formatDistanceToNow(article.publishedAt, { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Compact version for sidebar use
export function RelatedArticlesCompact({ 
  articles, 
  className = '',
  title = "You Might Also Like"
}: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="font-heading font-semibold text-charcoal-900 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-sunglow" />
        {title}
      </h4>
      
      <div className="space-y-2">
        {articles.map((article, index) => (
          <Link 
            key={article.id}
            href={`/blog/${article.category.slug}/${article.slug}`}
            className="group block p-2 rounded-md transition-colors hover:bg-olivine-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-charcoal-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-charcoal-600 group-hover:bg-pumpkin group-hover:text-white transition-colors">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="text-sm font-medium text-charcoal-900 line-clamp-2 group-hover:text-pumpkin transition-colors leading-tight">
                  {article.title}
                </h5>
                <div className="flex items-center gap-2 mt-1 text-xs text-charcoal-500">
                  <Clock className="w-3 h-3" />
                  <span>{article.readingTime} min read</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="pt-2 border-t border-charcoal-200">
        <Link 
          href="/blog"
          className="inline-flex items-center gap-2 text-xs text-pumpkin hover:text-pumpkin-600 font-medium transition-colors group"
        >
          More Articles
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

// Skeleton component for loading states
export function RelatedArticlesSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-charcoal-200 rounded" />
          <div className="h-6 bg-charcoal-200 rounded w-32" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex gap-4 p-3">
            <div className="w-20 h-16 bg-charcoal-200 rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div className="h-4 bg-charcoal-200 rounded flex-1" />
                <div className="h-5 bg-charcoal-200 rounded w-16 flex-shrink-0" />
              </div>
              <div className="space-y-1">
                <div className="h-3 bg-charcoal-200 rounded" />
                <div className="h-3 bg-charcoal-200 rounded w-3/4" />
              </div>
              <div className="flex gap-3">
                <div className="h-3 bg-charcoal-200 rounded w-12" />
                <div className="h-3 bg-charcoal-200 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}