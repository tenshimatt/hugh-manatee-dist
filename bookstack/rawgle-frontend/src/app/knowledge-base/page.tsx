'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Lightbulb, Shield, Users, Heart, TrendingUp } from 'lucide-react';
import SearchBar from '@/components/knowledge-base/SearchBar';
import ArticleCard from '@/components/knowledge-base/ArticleCard';
import knowledgeBaseService from '@/services/knowledgeBaseService';
import type { 
  KnowledgeBaseArticle, 
  KnowledgeBaseCategory, 
  KnowledgeBaseSearchParams,
  KnowledgeBaseSearchResponse 
} from '@/types/knowledgeBase';

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [categories, setCategories] = useState<KnowledgeBaseCategory[]>([]);
  const [searchResults, setSearchResults] = useState<KnowledgeBaseSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSearch, setActiveSearch] = useState<KnowledgeBaseSearchParams | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load in parallel
      const [articlesResponse, featuredResponse, categoriesResponse] = await Promise.all([
        knowledgeBaseService.getArticles({ limit: 12, sort: 'date', order: 'desc' }),
        knowledgeBaseService.getFeaturedArticles(6),
        knowledgeBaseService.getCategories(),
      ]);

      setArticles(articlesResponse.articles);
      setFeaturedArticles(featuredResponse);
      setCategories(categoriesResponse);
    } catch (err) {
      console.error('Error loading knowledge base data:', err);
      setError('Failed to load knowledge base content. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (params: KnowledgeBaseSearchParams) => {
    try {
      setSearching(true);
      setError(null);
      setCurrentPage(params.page || 1);
      setActiveSearch(params);

      let response: KnowledgeBaseSearchResponse;
      
      if (params.query) {
        // Use search endpoint for text queries
        response = await knowledgeBaseService.searchArticles(params);
      } else {
        // Use filter endpoint for category/tag filtering
        response = await knowledgeBaseService.getArticles(params);
      }

      setSearchResults(response);
    } catch (err) {
      console.error('Error searching articles:', err);
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (activeSearch) {
      handleSearch({ ...activeSearch, page });
    }
  };

  const clearSearch = () => {
    setSearchResults(null);
    setActiveSearch(null);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  const displayArticles = searchResults?.articles || articles;
  const showingSearchResults = !!searchResults;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              RAWGLE Knowledge Base
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Your comprehensive guide to raw feeding for dogs. Expert advice, safety guidelines, 
              and practical tips to help your furry friend thrive on a natural diet.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            onSearch={handleSearch}
            categories={categories}
            initialParams={activeSearch || {}}
            className="max-w-4xl mx-auto"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-600 text-center">
              {error}
              <button
                onClick={loadInitialData}
                className="ml-2 text-red-700 underline hover:text-red-900"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Featured Articles (only show when not searching) */}
        {!showingSearchResults && featuredArticles.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <TrendingUp className="w-6 h-6 text-yellow-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Articles</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  showExcerpt={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* Category Quick Links (only show when not searching) */}
        {!showingSearchResults && categories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <Lightbulb className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.slice(0, 8).map(category => (
                <button
                  key={category.name}
                  onClick={() => handleSearch({ category: category.name, page: 1 })}
                  className="text-left p-4 bg-white rounded-lg border hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {category.name.split('-').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {category.total_articles} articles
                      </p>
                    </div>
                    <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Search Results or Recent Articles */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              {showingSearchResults ? (
                <>
                  <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Search Results
                  </h2>
                  {searchResults && (
                    <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {searchResults.pagination.total} found
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Heart className="w-6 h-6 text-green-600 mr-2" />
                  <h2 className="text-2xl font-bold text-gray-900">Latest Articles</h2>
                </>
              )}
            </div>
            {showingSearchResults && (
              <button
                onClick={clearSearch}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>

          {searching ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching articles...</p>
            </div>
          ) : displayArticles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayArticles.map(article => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    showExcerpt={true}
                  />
                ))}
              </div>

              {/* Pagination */}
              {searchResults && searchResults.pagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!searchResults.pagination.hasPrev}
                      className="px-4 py-2 text-gray-600 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, searchResults.pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 border rounded-md ${
                            pageNum === currentPage
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'text-gray-600 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!searchResults.pagination.hasNext}
                      className="px-4 py-2 text-gray-600 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showingSearchResults ? 'No articles found' : 'No articles available'}
              </h3>
              <p className="text-gray-600">
                {showingSearchResults 
                  ? 'Try adjusting your search terms or filters.' 
                  : 'Articles will appear here once they are published.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}