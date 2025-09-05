"use client";

import React from 'react';
import Link from 'next/link';
import { BlogCategory } from '@/types/blog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ChevronRight } from 'lucide-react';

interface CategorySidebarProps {
  categories: BlogCategory[];
  currentCategory?: string;
  className?: string;
}

export function CategorySidebar({ 
  categories, 
  currentCategory,
  className = '' 
}: CategorySidebarProps) {
  return (
    <Card className={`sticky top-6 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-charcoal-900">
          <FileText className="w-5 h-5 text-pumpkin" />
          Categories
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* All Articles Link */}
          <Link 
            href="/blog"
            className={`group flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-olivine-50 hover:shadow-sm ${
              !currentCategory ? 'bg-olivine-100 border border-olivine-200' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                !currentCategory ? 'bg-olivine-500' : 'bg-charcoal-300 group-hover:bg-olivine-400'
              }`} />
              <span className={`font-medium ${
                !currentCategory ? 'text-olivine-900' : 'text-charcoal-700 group-hover:text-charcoal-900'
              }`}>
                All Articles
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs bg-charcoal-100 text-charcoal-600">
                {categories.reduce((total, cat) => total + (cat.articleCount || 0), 0)}
              </Badge>
              <ChevronRight className={`w-4 h-4 transition-colors ${
                !currentCategory ? 'text-olivine-600' : 'text-charcoal-400 group-hover:text-olivine-500'
              }`} />
            </div>
          </Link>

          {/* Individual Categories */}
          {categories.map((category) => {
            const isActive = currentCategory === category.slug;
            const categoryColorClass = `${category.color || 'pumpkin'}`;
            
            return (
              <Link 
                key={category.id}
                href={`/blog/category/${category.slug}`}
                className={`group flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:shadow-sm ${
                  isActive 
                    ? `bg-${categoryColorClass}-50 border border-${categoryColorClass}-200` 
                    : 'hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: isActive ? `var(--${categoryColorClass}-50, #fef3f2)` : undefined,
                  borderColor: isActive ? `var(--${categoryColorClass}-200, #fecaca)` : undefined
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-3 h-3 rounded-full ${
                      isActive 
                        ? `bg-${categoryColorClass}` 
                        : `bg-charcoal-300 group-hover:bg-${categoryColorClass}`
                    }`}
                    style={{
                      backgroundColor: isActive 
                        ? `var(--${categoryColorClass})` 
                        : undefined
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${
                      isActive 
                        ? `text-${categoryColorClass}-900` 
                        : 'text-charcoal-700 group-hover:text-charcoal-900'
                    }`}>
                      {category.name}
                    </div>
                    {category.description && (
                      <div className="text-xs text-charcoal-500 mt-1 line-clamp-2 leading-relaxed">
                        {category.description}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-2">
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-charcoal-100 text-charcoal-600 flex-shrink-0"
                  >
                    {category.articleCount || 0}
                  </Badge>
                  <ChevronRight 
                    className={`w-4 h-4 transition-colors flex-shrink-0 ${
                      isActive 
                        ? `text-${categoryColorClass}-600` 
                        : 'text-charcoal-400 group-hover:text-charcoal-600'
                    }`}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Category Summary */}
        <div className="mt-6 pt-4 border-t border-charcoal-200">
          <div className="text-center text-sm text-charcoal-600">
            <div className="font-medium mb-1">
              {categories.length} Categories
            </div>
            <div className="text-xs text-charcoal-500">
              {categories.reduce((total, cat) => total + (cat.articleCount || 0), 0)} Total Articles
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mobile-friendly category filter component
export function CategoryFilter({ 
  categories, 
  currentCategory, 
  className = '' 
}: CategorySidebarProps) {
  return (
    <div className={`overflow-x-auto pb-2 ${className}`}>
      <div className="flex gap-2 min-w-max px-1">
        {/* All Articles Filter */}
        <Link href="/blog">
          <Badge 
            variant={!currentCategory ? "default" : "secondary"}
            className={`px-4 py-2 whitespace-nowrap cursor-pointer transition-colors ${
              !currentCategory 
                ? 'bg-olivine-600 hover:bg-olivine-700 text-white' 
                : 'bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-700'
            }`}
          >
            All Articles ({categories.reduce((total, cat) => total + (cat.articleCount || 0), 0)})
          </Badge>
        </Link>

        {/* Category Filters */}
        {categories.map((category) => {
          const isActive = currentCategory === category.slug;
          const categoryColorClass = category.color || 'pumpkin';
          
          return (
            <Link key={category.id} href={`/blog/category/${category.slug}`}>
              <Badge 
                variant={isActive ? "default" : "secondary"}
                className={`px-4 py-2 whitespace-nowrap cursor-pointer transition-colors ${
                  isActive 
                    ? `bg-${categoryColorClass} hover:bg-${categoryColorClass} text-white` 
                    : 'bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-700'
                }`}
                style={{
                  backgroundColor: isActive ? `var(--${categoryColorClass})` : undefined,
                  color: isActive ? 'white' : undefined
                }}
              >
                {category.name} ({category.articleCount || 0})
              </Badge>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Skeleton component for loading states
export function CategorySidebarSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`sticky top-6 animate-pulse ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-charcoal-200 rounded" />
          <div className="h-6 bg-charcoal-200 rounded w-24" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {[...Array(9)].map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-3 h-3 bg-charcoal-200 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-charcoal-200 rounded w-32" />
                  <div className="h-3 bg-charcoal-200 rounded w-48" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 bg-charcoal-200 rounded w-8" />
                <div className="w-4 h-4 bg-charcoal-200 rounded" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-charcoal-200">
          <div className="text-center space-y-1">
            <div className="h-4 bg-charcoal-200 rounded w-20 mx-auto" />
            <div className="h-3 bg-charcoal-200 rounded w-24 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}