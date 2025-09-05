"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BlogArticle } from '@/types/blog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RelatedArticles, RelatedArticlesCompact } from './RelatedArticles';
import { 
  Clock, 
  User, 
  Calendar, 
  ArrowLeft, 
  Share2,
  BookmarkPlus,
  Eye,
  Twitter,
  Facebook,
  Linkedin,
  Link2,
  Mail,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ArticleViewProps {
  article: BlogArticle;
  relatedArticles: BlogArticle[];
  className?: string;
}

export function ArticleView({ 
  article, 
  relatedArticles, 
  className = '' 
}: ArticleViewProps) {
  const categoryColor = article.category.color || 'pumpkin';

  const handleShare = async (platform: 'twitter' | 'facebook' | 'linkedin' | 'email' | 'copy') => {
    const url = window.location.href;
    const title = article.title;
    const excerpt = article.excerpt;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${excerpt}\n\nRead more: ${url}`)}`);
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          // You could add a toast notification here
          console.log('URL copied to clipboard');
        } catch (err) {
          console.error('Failed to copy URL');
        }
        break;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-olivine-50 to-zomp-50 ${className}`}>
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm text-charcoal-600">
            <Link href="/" className="hover:text-pumpkin transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/blog" className="hover:text-pumpkin transition-colors">
              Blog
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link 
              href={`/blog/category/${article.category.slug}`}
              className="hover:text-pumpkin transition-colors"
            >
              {article.category.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-charcoal-900 font-medium truncate">
              {article.title}
            </span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Article Content */}
          <article className="flex-1 max-w-4xl">
            {/* Back Button */}
            <div className="mb-6">
              <Link href="/blog">
                <Button variant="ghost" className="text-charcoal-600 hover:text-charcoal-900">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Articles
                </Button>
              </Link>
            </div>

            {/* Article Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Badge 
                  className={`bg-${categoryColor} text-white font-medium px-3 py-1`}
                  style={{
                    backgroundColor: `var(--${categoryColor})`,
                    color: 'white'
                  }}
                >
                  {article.category.name}
                </Badge>
                {article.featured && (
                  <Badge className="bg-pumpkin text-white font-semibold px-3 py-1">
                    ⭐ Featured
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-charcoal-900 mb-6 leading-tight">
                {article.title}
              </h1>

              <p className="text-xl text-charcoal-600 mb-8 leading-relaxed">
                {article.excerpt}
              </p>

              {/* Article Meta */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-charcoal-200">
                <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal-600">
                  {/* Author */}
                  <div className="flex items-center gap-2">
                    {article.author.avatar ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={article.author.avatar}
                          alt={article.author.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-charcoal-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-charcoal-600" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-charcoal-900">{article.author.name}</div>
                      {article.author.bio && (
                        <div className="text-xs text-charcoal-500">{article.author.bio}</div>
                      )}
                    </div>
                  </div>

                  {/* Reading Time */}
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{article.readingTime} min read</span>
                  </div>

                  {/* Published Date */}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(article.publishedAt, 'MMMM d, yyyy')}</span>
                  </div>

                  {/* Views */}
                  {article.views && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{article.views.toLocaleString()} views</span>
                    </div>
                  )}
                </div>

                {/* Share Buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-charcoal-600 mr-2">Share:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="text-charcoal-600 hover:text-blue-500"
                  >
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="text-charcoal-600 hover:text-blue-600"
                  >
                    <Facebook className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('linkedin')}
                    className="text-charcoal-600 hover:text-blue-700"
                  >
                    <Linkedin className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('email')}
                    className="text-charcoal-600 hover:text-charcoal-900"
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('copy')}
                    className="text-charcoal-600 hover:text-charcoal-900"
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {article.featuredImage && (
              <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden mb-8 bg-gradient-to-br from-olivine-100 to-zomp-100">
                <Image
                  src={article.featuredImage}
                  alt={article.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                />
              </div>
            )}

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              {/* Convert content to formatted HTML - for now using simple formatting */}
              <div 
                className="article-content text-charcoal-800 leading-relaxed space-y-6"
                dangerouslySetInnerHTML={{
                  __html: formatArticleContent(article.content)
                }}
              />
            </div>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-charcoal-200">
                <h4 className="text-lg font-heading font-semibold text-charcoal-900 mb-4">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <Link
                      key={index}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="inline-block"
                    >
                      <Badge 
                        variant="secondary"
                        className="px-3 py-1 bg-charcoal-100 text-charcoal-700 hover:bg-pumpkin hover:text-white transition-colors cursor-pointer"
                      >
                        #{tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Author Bio */}
            <Card className="mt-12 bg-gradient-to-r from-olivine-50 to-zomp-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-charcoal-200">
                    {article.author.avatar ? (
                      <Image
                        src={article.author.avatar}
                        alt={article.author.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-charcoal-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-heading font-semibold text-charcoal-900 mb-2">
                      About {article.author.name}
                    </h4>
                    {article.author.bio && (
                      <p className="text-charcoal-700 mb-3">
                        {article.author.bio}
                      </p>
                    )}
                    
                    {article.author.social && (
                      <div className="flex items-center gap-3">
                        {article.author.social.website && (
                          <a
                            href={article.author.social.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-charcoal-600 hover:text-pumpkin transition-colors"
                          >
                            <Link2 className="w-4 h-4" />
                          </a>
                        )}
                        {article.author.social.twitter && (
                          <a
                            href={article.author.social.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-charcoal-600 hover:text-blue-500 transition-colors"
                          >
                            <Twitter className="w-4 h-4" />
                          </a>
                        )}
                        {article.author.social.linkedin && (
                          <a
                            href={article.author.social.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-charcoal-600 hover:text-blue-700 transition-colors"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </article>

          {/* Sidebar */}
          <aside className="lg:w-80 flex-shrink-0 space-y-6">
            {/* Related Articles */}
            <RelatedArticles 
              articles={relatedArticles}
              title="Related Articles"
            />

            {/* Newsletter Signup */}
            <Card>
              <CardContent className="p-6 text-center">
                <h4 className="font-heading font-semibold text-charcoal-900 mb-2">
                  Stay Updated
                </h4>
                <p className="text-sm text-charcoal-600 mb-4">
                  Get the latest raw feeding tips and articles delivered to your inbox.
                </p>
                <Button className="w-full bg-pumpkin hover:bg-pumpkin-600 text-white">
                  Subscribe to Newsletter
                </Button>
              </CardContent>
            </Card>

            {/* Back to Blog */}
            <Card>
              <CardContent className="p-6 text-center">
                <h4 className="font-heading font-semibold text-charcoal-900 mb-2">
                  Explore More
                </h4>
                <p className="text-sm text-charcoal-600 mb-4">
                  Discover more articles about raw feeding and pet nutrition.
                </p>
                <Link href="/blog">
                  <Button variant="outline" className="w-full">
                    Browse All Articles
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

// Helper function to format article content
function formatArticleContent(content: string): string {
  return content
    // Convert markdown-style headers to HTML
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-heading font-semibold text-charcoal-900 mt-8 mb-4">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-heading font-semibold text-charcoal-900 mt-10 mb-6">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-heading font-bold text-charcoal-900 mt-12 mb-8">$1</h1>')
    
    // Convert markdown-style bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-charcoal-900">$1</strong>')
    
    // Convert markdown-style lists
    .replace(/^\- (.*$)/gm, '<li class="ml-4 mb-2">$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 mb-2">$2</li>')
    
    // Convert line breaks to paragraphs
    .split('\n\n')
    .map(paragraph => {
      if (paragraph.trim() === '') return '';
      if (paragraph.includes('<h') || paragraph.includes('<li')) return paragraph;
      return `<p class="mb-4 leading-relaxed">${paragraph}</p>`;
    })
    .join('\n');
}