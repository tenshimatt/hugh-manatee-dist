"use client";

import React, { useState } from 'react';
import { BlogArticle, BlogCategory } from '@/types/blog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FeaturedArticle } from './FeaturedArticle';
import { ArticleCard, ArticleCardSkeleton } from './ArticleCard';
import { CategorySidebar, CategoryFilter } from './CategorySidebar';
import { ArticleSearch } from './ArticleSearch';
import { 
  BookOpen, 
  Search, 
  Filter,
  Grid,
  List,
  Calendar,
  TrendingUp,
  Users,
  ChevronDown
} from 'lucide-react';

interface BlogHomepageProps {
  featuredArticles: BlogArticle[];
  recentArticles: BlogArticle[];
  categories: BlogCategory[];
  allArticles: BlogArticle[];
  className?: string;
}

export function BlogHomepage({ 
  featuredArticles, 
  recentArticles, 
  categories, 
  allArticles,
  className = '' 
}: BlogHomepageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSearch, setShowSearch] = useState(false);
  const [articlesToShow, setArticlesToShow] = useState(6);
  const [loading, setLoading] = useState(false);

  const handleLoadMore = async () => {
    setLoading(true);
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setArticlesToShow(prev => prev + 6);
    setLoading(false);
  };

  const displayedArticles = recentArticles.slice(0, articlesToShow);
  const hasMore = articlesToShow < recentArticles.length;

  // Calculate some stats for the header
  const totalArticles = allArticles.length;
  const totalAuthors = new Set(allArticles.map(article => article.author.id)).size;
  const totalViews = allArticles.reduce((sum, article) => sum + (article.views || 0), 0);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-olivine-50 to-zomp-50 ${className}`}>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-charcoal-900 to-charcoal-800 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <BookOpen className="w-12 h-12 text-sunglow" />
              <h1 className="text-4xl md:text-6xl font-heading font-bold">
                Raw Feeding Hub
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed max-w-3xl mx-auto">
              Your comprehensive resource for species-appropriate nutrition. 
              Expert guidance, practical tips, and real success stories to help your pet thrive on a raw diet.
            </p>

            {/* Stats */}
            <div className="flex justify-center items-center gap-8 md:gap-12 mb-8 text-sm md:text-base">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-sunglow">{totalArticles}</div>
                <div className="text-gray-300">Articles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-sunglow">{totalAuthors}</div>
                <div className="text-gray-300">Experts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-sunglow">{totalViews.toLocaleString()}</div>
                <div className="text-gray-300">Views</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => setShowSearch(true)}
                className="bg-pumpkin hover:bg-pumpkin-600 text-white font-semibold px-8 py-3 text-lg"
              >
                <Search className="w-5 h-5 mr-2" />
                Search Articles
              </Button>
              <Button 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-charcoal-900 font-semibold px-8 py-3 text-lg"
                onClick={() => {
                  const featuredSection = document.getElementById('featured-articles');
                  featuredSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Featured Content
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section (Expandable) */}
      {showSearch && (
        <section className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-heading font-bold text-charcoal-900">
                  Search Articles
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowSearch(false)}
                  className="text-charcoal-600 hover:text-charcoal-900"
                >
                  Hide Search
                </Button>
              </div>
              <ArticleSearch 
                articles={allArticles}
                categories={categories}
                showFilters={true}
              />
            </div>
          </div>
        </section>
      )}

      {/* Mobile Category Filter */}
      <section className="bg-white border-b shadow-sm md:hidden">
        <div className="container mx-auto px-4 py-4">
          <CategoryFilter categories={categories} />
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:w-80 flex-shrink-0">
            <CategorySidebar categories={categories} />
            
            {/* Quick Links Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-charcoal-900">
                  <Users className="w-5 h-5 text-olivine" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a 
                  href="#getting-started" 
                  className="block text-charcoal-700 hover:text-pumpkin transition-colors"
                >
                  → Getting Started Guide
                </a>
                <a 
                  href="#safety" 
                  className="block text-charcoal-700 hover:text-pumpkin transition-colors"
                >
                  → Safety Guidelines
                </a>
                <a 
                  href="#recipes" 
                  className="block text-charcoal-700 hover:text-pumpkin transition-colors"
                >
                  → Meal Planning
                </a>
                <a 
                  href="#success-stories" 
                  className="block text-charcoal-700 hover:text-pumpkin transition-colors"
                >
                  → Success Stories
                </a>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            {/* Featured Articles Section */}
            {featuredArticles.length > 0 && (
              <section id="featured-articles" className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal-900 flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-pumpkin" />
                    Featured Articles
                  </h2>
                  <Badge className="bg-pumpkin text-white font-medium px-3 py-1">
                    {featuredArticles.length} Featured
                  </Badge>
                </div>
                
                <div className="space-y-6">
                  {featuredArticles.map(article => (
                    <FeaturedArticle 
                      key={article.id} 
                      article={article}
                      showViews={true}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Recent Articles Section */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal-900 flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-olivine" />
                  Latest Articles
                </h2>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm text-charcoal-600 hidden sm:block">
                    View:
                  </span>
                  <div className="flex rounded-lg overflow-hidden border border-charcoal-300">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`rounded-none ${viewMode === 'grid' ? 'bg-pumpkin hover:bg-pumpkin-600 text-white' : ''}`}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`rounded-none ${viewMode === 'list' ? 'bg-pumpkin hover:bg-pumpkin-600 text-white' : ''}`}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Articles Grid/List */}
              <div className={`${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
                  : 'space-y-6'
              } mb-8`}>
                {displayedArticles.map((article, index) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    showViews={true}
                    priority={index < 6}
                    className={viewMode === 'list' ? 'md:flex md:gap-6' : ''}
                  />
                ))}
              </div>

              {/* Loading Skeletons */}
              {loading && (
                <div className={`${
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
                    : 'space-y-6'
                } mb-8`}>
                  {[...Array(3)].map((_, index) => (
                    <ArticleCardSkeleton key={index} />
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="bg-olivine hover:bg-olivine-600 text-white font-semibold px-8 py-3 text-lg"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-5 h-5 mr-2" />
                        Load More Articles
                      </>
                    )}
                  </Button>
                  <p className="text-charcoal-600 mt-3">
                    Showing {displayedArticles.length} of {recentArticles.length} articles
                  </p>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for the entire homepage
export function BlogHomepageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-olivine-50 to-zomp-50">
      {/* Hero Section Skeleton */}
      <section className="bg-charcoal-200 animate-pulse">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="h-16 bg-charcoal-300 rounded-lg mx-auto w-96" />
            <div className="h-8 bg-charcoal-300 rounded mx-auto w-full max-w-2xl" />
            <div className="h-6 bg-charcoal-300 rounded mx-auto w-3/4" />
            <div className="flex justify-center gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-8 w-16 bg-charcoal-300 rounded mx-auto mb-2" />
                  <div className="h-4 w-12 bg-charcoal-300 rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block lg:w-80">
            <div className="h-96 bg-charcoal-200 rounded-lg animate-pulse" />
          </aside>
          <main className="flex-1">
            <div className="h-80 bg-charcoal-200 rounded-lg animate-pulse mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <ArticleCardSkeleton key={index} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}