'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Eye, 
  Heart, 
  Share2, 
  Clock, 
  User, 
  Calendar,
  Tag,
  BookOpen
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import knowledgeBaseService from '@/services/knowledgeBaseService';
import type { KnowledgeBaseArticle } from '@/types/knowledgeBase';

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [article, setArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (slug) {
      loadArticle();
    }
  }, [slug]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      setError(null);

      const articleData = await knowledgeBaseService.getArticleBySlug(slug);
      setArticle(articleData);
      setLikeCount(articleData.like_count);

      // Load related articles
      if (articleData.category) {
        try {
          const relatedResponse = await knowledgeBaseService.getArticlesByCategory(
            articleData.category, 
            { limit: 4 }
          );
          // Filter out current article
          const related = relatedResponse.articles.filter(a => a.id !== articleData.id);
          setRelatedArticles(related.slice(0, 3));
        } catch (relatedError) {
          console.error('Error loading related articles:', relatedError);
          // Don't fail the whole page if related articles fail
        }
      }
    } catch (err) {
      console.error('Error loading article:', err);
      setError('Article not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!article) return;

    try {
      const response = await knowledgeBaseService.likeArticle(article.id);
      setLiked(response.liked);
      setLikeCount(response.likeCount);
    } catch (err) {
      console.error('Error liking article:', err);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = article?.title || 'RAWGLE Knowledge Base Article';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: article?.excerpt || 'Check out this helpful article on raw feeding for dogs.',
          url,
        });
      } catch (err) {
        // User cancelled or error occurred, fallback to clipboard
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could show a toast notification here
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatCategoryName = (name: string) => {
    return name
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
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error || 'The article you are looking for could not be found.'}
          </p>
          <button
            onClick={() => router.push('/knowledge-base')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Knowledge Base
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/knowledge-base')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Knowledge Base
          </button>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-sm p-8">
          {/* Article Header */}
          <header className="mb-8">
            {/* Category and Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor(article.category)}`}>
                {formatCategoryName(article.category)}
              </span>
              {article.subcategory && (
                <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600">
                  {formatCategoryName(article.subcategory)}
                </span>
              )}
              {article.featured && (
                <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  Featured
                </span>
              )}
              {article.sticky && (
                <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                  Pinned
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b pb-6">
              {article.author_name && (
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span>By {article.author_name}</span>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>
                  {article.published_at 
                    ? `Published ${formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}`
                    : `Created ${formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}`
                  }
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>{article.reading_time_minutes} min read</span>
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                <span>{article.view_count.toLocaleString()} views</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className={`inline-flex items-center px-4 py-2 rounded-md transition-colors ${
                    liked 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-current' : ''}`} />
                  <span>{likeCount}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
              </div>

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="flex items-center">
                  <Tag className="w-4 h-4 mr-2 text-gray-400" />
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 5).map(tag => (
                      <span
                        key={tag}
                        className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {article.featured_image_url && (
            <div className="mb-8">
              <img
                src={article.featured_image_url}
                alt={article.title}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Article Body */}
          <div className="prose prose-lg max-w-none">
            {article.content_type === 'html' ? (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: article.content_html || article.content 
                }} 
              />
            ) : (
              // For markdown content, you would typically use a markdown parser here
              // For now, we'll display as formatted text
              <div className="whitespace-pre-wrap leading-relaxed">
                {article.content}
              </div>
            )}
          </div>
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map(relatedArticle => (
                <div
                  key={relatedArticle.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    <button
                      onClick={() => router.push(`/knowledge-base/${relatedArticle.slug}`)}
                      className="hover:text-blue-600 transition-colors text-left"
                    >
                      {relatedArticle.title}
                    </button>
                  </h3>
                  {relatedArticle.excerpt && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {relatedArticle.excerpt}
                    </p>
                  )}
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{relatedArticle.reading_time_minutes} min</span>
                    <Eye className="w-3 h-3 ml-3 mr-1" />
                    <span>{relatedArticle.view_count}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}