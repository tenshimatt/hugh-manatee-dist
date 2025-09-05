import { notFound } from 'next/navigation';
import { ArticleView } from '@/components/blog/ArticleView';
import { getArticleBySlug, getRelatedArticles } from '@/data/blog-data';

interface ArticlePageProps {
  params: {
    category: string;
    slug: string;
  };
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const article = getArticleBySlug(params.slug);
  
  if (!article) {
    notFound();
  }

  // Verify the category matches the article's category
  if (article.category.slug !== params.category) {
    notFound();
  }

  const relatedArticles = getRelatedArticles(article.id, 3);

  return (
    <ArticleView 
      article={article} 
      relatedArticles={relatedArticles}
    />
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ArticlePageProps) {
  const article = getArticleBySlug(params.slug);
  
  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.'
    };
  }

  return {
    title: `${article.title} | Raw Feeding Hub`,
    description: article.excerpt,
    keywords: article.tags.join(', '),
    authors: [{ name: article.author.name }],
    publishedTime: article.publishedAt.toISOString(),
    modifiedTime: article.updatedAt.toISOString(),
    section: article.category.name,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.publishedAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: [article.author.name],
      section: article.category.name,
      tags: article.tags,
      images: article.featuredImage ? [
        {
          url: article.featuredImage,
          width: 1200,
          height: 630,
          alt: article.title,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: article.featuredImage ? [article.featuredImage] : [],
      creator: article.author.social?.twitter,
    },
  };
}

// Generate static params for all articles (for static generation)
export async function generateStaticParams() {
  // In a real app, you'd fetch this from your CMS/database
  // For now, we'll import our mock data
  const { blogArticles } = await import('@/data/blog-data');
  
  return blogArticles.map((article) => ({
    category: article.category.slug,
    slug: article.slug,
  }));
}