'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import type { KnowledgeBaseSearchParams, KnowledgeBaseCategory } from '@/types/knowledgeBase';

interface SearchBarProps {
  onSearch: (params: KnowledgeBaseSearchParams) => void;
  categories: KnowledgeBaseCategory[];
  initialParams?: KnowledgeBaseSearchParams;
  className?: string;
}

export default function SearchBar({ 
  onSearch, 
  categories, 
  initialParams = {},
  className = '' 
}: SearchBarProps) {
  const [query, setQuery] = useState(initialParams.query || '');
  const [selectedCategory, setSelectedCategory] = useState(initialParams.category || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialParams.subcategory || '');
  const [sortBy, setSortBy] = useState(initialParams.sort || 'relevance');
  const [showFilters, setShowFilters] = useState(false);

  const currentCategory = categories.find(cat => cat.name === selectedCategory);
  const subcategories = currentCategory?.subcategories || [];

  const handleSearch = () => {
    const params: KnowledgeBaseSearchParams = {
      query: query.trim() || undefined,
      category: selectedCategory || undefined,
      subcategory: selectedSubcategory || undefined,
      sort: sortBy as any,
      page: 1, // Reset to first page on new search
    };
    
    onSearch(params);
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSortBy('relevance');
    onSearch({ page: 1 });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear subcategory when category changes
  useEffect(() => {
    if (selectedCategory && selectedSubcategory) {
      const categoryExists = categories.find(cat => 
        cat.name === selectedCategory && 
        cat.subcategories.some(sub => sub.name === selectedSubcategory)
      );
      if (!categoryExists) {
        setSelectedSubcategory('');
      }
    }
  }, [selectedCategory, selectedSubcategory, categories]);

  const formatCategoryName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const hasActiveFilters = query || selectedCategory || selectedSubcategory || sortBy !== 'relevance';

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search knowledge base articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Search
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 border rounded-lg transition-colors ${
            showFilters 
              ? 'bg-blue-50 border-blue-300 text-blue-700' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory(''); // Clear subcategory when category changes
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.name} value={category.name}>
                    {formatCategoryName(category.name)} ({category.total_articles})
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                disabled={!selectedCategory || subcategories.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Subcategories</option>
                {subcategories.map(subcategory => (
                  <option key={subcategory.name} value={subcategory.name}>
                    {formatCategoryName(subcategory.name)} ({subcategory.article_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Newest First</option>
                <option value="views">Most Viewed</option>
                <option value="likes">Most Liked</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {query && (
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
              Search: "{query}"
              <button
                onClick={() => {
                  setQuery('');
                  handleSearch();
                }}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
              Category: {formatCategoryName(selectedCategory)}
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedSubcategory('');
                  handleSearch();
                }}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedSubcategory && (
            <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded">
              Subcategory: {formatCategoryName(selectedSubcategory)}
              <button
                onClick={() => {
                  setSelectedSubcategory('');
                  handleSearch();
                }}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}