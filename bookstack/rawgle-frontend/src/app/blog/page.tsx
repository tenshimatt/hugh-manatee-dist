import { BlogHomepage } from '@/components/blog/BlogHomepage';
import { 
  blogArticles, 
  blogCategories, 
  getFeaturedArticles, 
  getRecentArticles 
} from '@/data/blog-data';

export default function BlogPage() {
  const featuredArticles = getFeaturedArticles();
  const recentArticles = getRecentArticles(12); // Get more for loading

  return (
    <BlogHomepage 
      featuredArticles={featuredArticles}
      recentArticles={recentArticles}
      categories={blogCategories}
      allArticles={blogArticles}
    />
  );
}