'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Types based on data model
interface SearchResult {
  type: 'document' | 'section' | 'content';
  id: string;
  documentId: string;
  title: string;
  content: string;
  highlight: string;
  score: number;
  metadata: {
    wordCount: number;
    sectionLevel?: number;
    documentStatus: string;
    createdBy: string;
    updatedAt: string;
  };
}

interface SearchFilters {
  types: ('document' | 'section' | 'content')[];
  status: string[];
  authors: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
  minWordCount: number;
  maxWordCount: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface SearchInterfaceProps {
  onSearch: (query: string, filters: SearchFilters) => Promise<SearchResult[]>;
  users: User[];
  recentSearches?: string[];
  suggestions?: string[];
  isLoading?: boolean;
  onResultClick?: (result: SearchResult) => void;
  onSaveSearch?: (query: string, filters: SearchFilters) => void;
  className?: string;
}

export const SearchInterface: React.FC<SearchInterfaceProps> = ({
  onSearch,
  users,
  recentSearches = [],
  suggestions = [],
  isLoading = false,
  onResultClick,
  onSaveSearch,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    types: ['document', 'section', 'content'],
    status: [],
    authors: [],
    dateRange: { start: null, end: null },
    minWordCount: 0,
    maxWordCount: 150000
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>(recentSearches);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search
  const debouncedSearch = useCallback(
    (searchQuery: string, searchFilters: SearchFilters) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        if (searchQuery.trim().length >= 2) {
          try {
            const searchResults = await onSearch(searchQuery, searchFilters);
            setResults(searchResults);
          } catch (error) {
            console.error('Search error:', error);
            setResults([]);
          }
        } else {
          setResults([]);
        }
      }, 300);
    },
    [onSearch]
  );

  // Handle search input change
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setSelectedResultIndex(-1);
    
    if (newQuery.length >= 2) {
      debouncedSearch(newQuery, filters);
      setShowSuggestions(false);
    } else {
      setResults([]);
      setShowSuggestions(true);
    }
  }, [debouncedSearch, filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    if (query.trim().length >= 2) {
      debouncedSearch(query, updatedFilters);
    }
  }, [filters, query, debouncedSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedResultIndex(prev => 
        Math.min(prev + 1, results.length - 1)
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedResultIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedResultIndex >= 0 && results[selectedResultIndex]) {
        handleResultClick(results[selectedResultIndex]);
      } else if (query.trim().length >= 2) {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedResultIndex(-1);
      searchInputRef.current?.blur();
    }
  }, [selectedResultIndex, results, query]);

  // Handle manual search trigger
  const handleSearch = useCallback(async () => {
    if (query.trim().length < 2) return;
    
    // Add to search history
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    
    try {
      const searchResults = await onSearch(query, filters);
      setResults(searchResults);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
  }, [query, filters, onSearch, searchHistory]);

  // Handle result click
  const handleResultClick = useCallback((result: SearchResult) => {
    onResultClick?.(result);
    setShowSuggestions(false);
  }, [onResultClick]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    debouncedSearch(suggestion, filters);
    searchInputRef.current?.focus();
  }, [debouncedSearch, filters]);

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`;
  };

  // Get result type icon
  const getResultTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
          </svg>
        );
      case 'section':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
          </svg>
        );
      case 'content':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
        );
      default:
        return null;
    }
  };

  // Filter suggestions based on query
  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) return suggestions;
    return suggestions.filter(s => 
      s.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, suggestions]);

  // Combined suggestions (history + suggestions)
  const combinedSuggestions = useMemo(() => {
    const historySuggestions = searchHistory.filter(h =>
      h.toLowerCase().includes(query.toLowerCase())
    );
    return [...historySuggestions, ...filteredSuggestions].slice(0, 8);
  }, [searchHistory, filteredSuggestions, query]);

  return (
    <div className={`search-interface relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search documents, sections, or content..."
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-y-0 right-8 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute inset-y-0 right-2 flex items-center px-2 text-gray-400 hover:text-gray-600 transition-colors ${
              showFilters ? 'text-blue-600' : ''
            }`}
            title="Search filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && combinedSuggestions.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            {combinedSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{suggestion}</span>
                  {searchHistory.includes(suggestion) && (
                    <span className="text-xs text-gray-400">Recent</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Content Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <div className="space-y-2">
                {[
                  { value: 'document', label: 'Documents' },
                  { value: 'section', label: 'Sections' },
                  { value: 'content', label: 'Text Content' }
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.types.includes(value as any)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...filters.types, value as any]
                          : filters.types.filter(t => t !== value);
                        handleFilterChange({ types: newTypes });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="space-y-2">
                {['draft', 'review', 'approved', 'published'].map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={(e) => {
                        const newStatus = e.target.checked
                          ? [...filters.status, status]
                          : filters.status.filter(s => s !== status);
                        handleFilterChange({ status: newStatus });
                      }}
                      className="mr-2"
                    />
                    <span className={`text-sm px-2 py-1 rounded ${getStatusBadge(status)}`}>
                      {status}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Authors Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Authors</label>
              <select
                multiple
                value={filters.authors}
                onChange={(e) => {
                  const selectedAuthors = Array.from(e.target.selectedOptions, option => option.value);
                  handleFilterChange({ authors: selectedAuthors });
                }}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <button
              onClick={() => {
                const resetFilters: SearchFilters = {
                  types: ['document', 'section', 'content'],
                  status: [],
                  authors: [],
                  dateRange: { start: null, end: null },
                  minWordCount: 0,
                  maxWordCount: 150000
                };
                setFilters(resetFilters);
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Reset Filters
            </button>
            
            <div className="flex space-x-2">
              {onSaveSearch && (
                <button
                  onClick={() => onSaveSearch(query, filters)}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Save Search
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div ref={resultsRef} className="mt-4 space-y-2">
          <div className="text-sm text-gray-600 mb-3">
            {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
          </div>
          
          {results.map((result, index) => (
            <div
              key={`${result.type}-${result.id}`}
              className={`p-4 bg-white border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                index === selectedResultIndex ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => handleResultClick(result)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-none mt-1">
                  {getResultTypeIcon(result.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{result.title}</h3>
                    <span className={getStatusBadge(result.metadata.documentStatus)}>
                      {result.metadata.documentStatus}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {result.type}
                    </span>
                  </div>
                  
                  <p 
                    className="text-sm text-gray-600 mb-2 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: result.highlight }}
                  />
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{result.metadata.wordCount} words</span>
                    <span>Score: {(result.score * 100).toFixed(0)}%</span>
                    <span>{new Date(result.metadata.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="mt-8 text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-2">No results found for "{query}"</p>
          <p className="text-sm text-gray-400">Try adjusting your search terms or filters</p>
        </div>
      )}
    </div>
  );
};

export default SearchInterface;