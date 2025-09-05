"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { BlogArticle, BlogCategory } from '@/types/blog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Tag, 
  FileText,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { ArticleCard } from './ArticleCard';

interface ArticleSearchProps {
  articles: BlogArticle[];
  categories: BlogCategory[];
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  onSearch?: (query: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'popular' | 'relevant';
type DateFilter = 'all' | 'week' | 'month' | 'year';

export function ArticleSearch({ 
  articles, 
  categories,
  placeholder = "Search articles about raw feeding...",
  className = '',
  showFilters = true,
  onSearch
}: ArticleSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Extract all unique tags from articles
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    articles.forEach(article => {
      article.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [articles]);

  // Filter and search logic
  const filteredArticles = useMemo(() => {
    let filtered = articles.filter(article => article.status === 'published');

    // Text search
    if (query.trim()) {
      const lowerQuery = query.toLowerCase().trim();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(lowerQuery) ||
        article.excerpt.toLowerCase().includes(lowerQuery) ||
        article.content.toLowerCase().includes(lowerQuery) ||
        article.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        article.category.name.toLowerCase().includes(lowerQuery) ||
        article.author.name.toLowerCase().includes(lowerQuery)
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(article => 
        article.category.slug === selectedCategory
      );
    }

    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter(article => 
        article.tags.includes(selectedTag)
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (dateFilter) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(article => 
        article.publishedAt >= cutoffDate
      );
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'relevant':
        // For relevant sort, we could implement a scoring system
        // For now, just sort by title match relevance
        if (query.trim()) {
          const lowerQuery = query.toLowerCase();
          filtered.sort((a, b) => {
            const aScore = a.title.toLowerCase().includes(lowerQuery) ? 2 : 
                          a.excerpt.toLowerCase().includes(lowerQuery) ? 1 : 0;
            const bScore = b.title.toLowerCase().includes(lowerQuery) ? 2 : 
                          b.excerpt.toLowerCase().includes(lowerQuery) ? 1 : 0;
            return bScore - aScore;
          });
        }
        break;
    }

    return filtered;
  }, [articles, query, selectedCategory, selectedTag, sortBy, dateFilter]);

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    onSearch?.(searchQuery);
  }, [onSearch]);

  const clearFilters = () => {
    setQuery('');
    setSelectedCategory('');
    setSelectedTag('');
    setSortBy('newest');
    setDateFilter('all');
  };

  const hasActiveFilters = query || selectedCategory || selectedTag || sortBy !== 'newest' || dateFilter !== 'all';

  // Highlight search terms in text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-sunglow-200 px-1 rounded">{part}</mark> : 
        part
    );
  };

  return (
    <div className={className}>
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 w-5 h-5" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-12 h-12 text-lg border-charcoal-300 focus:border-pumpkin focus:ring-pumpkin"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearch('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-charcoal-100"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-1 bg-pumpkin text-white text-xs px-2 py-0.5">
                  Active
                </Badge>
              )}
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="flex items-center gap-2 text-charcoal-600 hover:text-charcoal-900"
              >
                <X className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>

          {showFilterPanel && (
            <Card className="p-4">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      <FileText className="inline w-4 h-4 mr-1" />
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2 border border-charcoal-300 rounded-md focus:border-pumpkin focus:ring-1 focus:ring-pumpkin"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.slug}>
                          {category.name} ({category.articleCount || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tag Filter */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      <Tag className="inline w-4 h-4 mr-1" />
                      Tag
                    </label>
                    <select
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="w-full p-2 border border-charcoal-300 rounded-md focus:border-pumpkin focus:ring-1 focus:ring-pumpkin"
                    >
                      <option value="">All Tags</option>
                      {allTags.map(tag => (
                        <option key={tag} value={tag}>
                          #{tag}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Published
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                      className="w-full p-2 border border-charcoal-300 rounded-md focus:border-pumpkin focus:ring-1 focus:ring-pumpkin"
                    >
                      <option value="all">All Time</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>

                  {/* Sort Filter */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      {sortBy === 'newest' ? <SortDesc className="inline w-4 h-4 mr-1" /> : <SortAsc className="inline w-4 h-4 mr-1" />}
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="w-full p-2 border border-charcoal-300 rounded-md focus:border-pumpkin focus:ring-1 focus:ring-pumpkin"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="popular">Most Popular</option>
                      {query && <option value="relevant">Most Relevant</option>}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4">
              {query && (
                <Badge className="bg-pumpkin text-white px-3 py-1 flex items-center gap-2">
                  Search: "{query}"
                  <button onClick={() => handleSearch('')} className="hover:bg-white/20 rounded">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedCategory && (
                <Badge className="bg-olivine text-white px-3 py-1 flex items-center gap-2">
                  {categories.find(cat => cat.slug === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory('')} className="hover:bg-white/20 rounded">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedTag && (
                <Badge className="bg-zomp text-white px-3 py-1 flex items-center gap-2">
                  #{selectedTag}
                  <button onClick={() => setSelectedTag('')} className="hover:bg-white/20 rounded">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      <div className="mb-4 text-charcoal-600">
        {query ? (
          <span>
            Found <strong>{filteredArticles.length}</strong> articles matching "{query}"
          </span>
        ) : (
          <span>
            Showing <strong>{filteredArticles.length}</strong> articles
          </span>
        )}
      </div>

      {/* Results Grid */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, index) => (
            <div key={article.id}>
              <ArticleCard 
                article={{
                  ...article,
                  title: query ? highlightText(article.title, query) as string : article.title,
                  excerpt: query ? highlightText(article.excerpt, query) as string : article.excerpt
                }}
                showViews={true}
                priority={index < 6}
              />
            </div>
          ))}
        </div>
      ) : (
        /* No Results */
        <Card className="text-center py-12">
          <CardContent>
            <div className="max-w-md mx-auto">
              <Search className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
              <h3 className="text-xl font-heading font-semibold text-charcoal-900 mb-2">
                No Articles Found
              </h3>
              <p className="text-charcoal-600 mb-6">
                {query 
                  ? `No articles match your search for "${query}". Try adjusting your filters or search terms.`
                  : "No articles match your current filters. Try clearing some filters to see more results."
                }
              </p>
              <div className="space-y-2">
                <Button onClick={clearFilters} className="bg-pumpkin hover:bg-pumpkin-600 text-white">
                  Clear All Filters
                </Button>
                <div className="text-sm text-charcoal-500">
                  <p>Suggested searches:</p>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {['raw feeding', 'puppies', 'nutrition', 'bones', 'safety'].map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => handleSearch(suggestion)}
                        className="text-pumpkin hover:text-pumpkin-600 underline"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}