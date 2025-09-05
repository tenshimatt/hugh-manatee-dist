import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/blog/ArticleCard';
import { CategorySidebar, CategoryFilter } from '@/components/blog/CategorySidebar';
import { Badge } from '@/components/ui/badge';
import { 
  blogCategories, 
  getArticlesByCategory,
  blogArticles 
} from '@/data/blog-data';
import { ArrowLeft, FileText, Grid } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const category = blogCategories.find(cat => cat.slug === params.slug);
  
  if (!category) {
    notFound();
  }

  const articles = getArticlesByCategory(params.slug);
  const categoryColor = category.color || 'pumpkin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-olivine-50 to-zomp-50">
      {/* Header */}
      <section className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <Link href="/blog">
                <Button variant="ghost" className="text-charcoal-600 hover:text-charcoal-900">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Articles
                </Button>
              </Link>
            </div>

            {/* Category Header */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <FileText className="w-8 h-8 text-pumpkin" />
                <Badge 
                  className={`bg-${categoryColor} text-white font-semibold px-4 py-2 text-lg`}
                  style={{
                    backgroundColor: `var(--${categoryColor})`,
                    color: 'white'
                  }}
                >
                  {category.name}
                </Badge>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-charcoal-900 mb-4">
                {category.name} Articles
              </h1>
              
              {category.description && (
                <p className="text-xl text-charcoal-600 mb-6 max-w-2xl mx-auto">
                  {category.description}
                </p>
              )}
              
              <div className="flex items-center justify-center gap-4 text-charcoal-600">
                <span>{articles.length} articles</span>
                <span>•</span>
                <span>Updated regularly</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Category Filter */}
      <section className="bg-white border-b shadow-sm md:hidden">
        <div className="container mx-auto px-4 py-4">
          <CategoryFilter categories={blogCategories} currentCategory={params.slug} />
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:w-80 flex-shrink-0">
            <CategorySidebar 
              categories={blogCategories} 
              currentCategory={params.slug}
            />
          </aside>

          {/* Articles Grid */}
          <main className="flex-1">
            {articles.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-semibold text-charcoal-900 flex items-center gap-2">
                    <Grid className="w-5 h-5 text-olivine" />
                    {articles.length} Articles in {category.name}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {articles.map((article, index) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      showViews={true}
                      priority={index < 6}
                    />
                  ))}
                </div>
              </>
            ) : (
              /* No Articles in Category */
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                <h3 className="text-xl font-heading font-semibold text-charcoal-900 mb-2">
                  No Articles Yet
                </h3>
                <p className="text-charcoal-600 mb-6 max-w-md mx-auto">
                  We're working on creating great content for the {category.name} category. 
                  Check back soon for new articles!
                </p>
                <div className="space-y-3">
                  <Link href="/blog">
                    <Button className="bg-pumpkin hover:bg-pumpkin-600 text-white">
                      Browse All Articles
                    </Button>
                  </Link>
                  <div className="text-sm text-charcoal-500">
                    <p>Or explore these popular categories:</p>
                    <div className="flex flex-wrap gap-2 mt-2 justify-center">
                      {blogCategories
                        .filter(cat => cat.slug !== params.slug && (cat.articleCount || 0) > 0)
                        .slice(0, 3)
                        .map(cat => (
                          <Link key={cat.id} href={`/blog/category/${cat.slug}`}>
                            <Badge 
                              className="cursor-pointer hover:bg-charcoal-200 transition-colors"
                              variant="secondary"
                            >
                              {cat.name} ({cat.articleCount})
                            </Badge>
                          </Link>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps) {
  const category = blogCategories.find(cat => cat.slug === params.slug);
  
  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.'
    };
  }

  const articles = getArticlesByCategory(params.slug);

  return {
    title: `${category.name} Articles | Raw Feeding Hub`,
    description: category.description || `Browse all articles in the ${category.name} category. Find expert advice and tips about raw feeding for your pets.`,
    keywords: `raw feeding, ${category.name.toLowerCase()}, pet nutrition, dog diet, cat diet`,
    openGraph: {
      title: `${category.name} Articles | Raw Feeding Hub`,
      description: category.description || `Browse ${articles.length} articles in the ${category.name} category.`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${category.name} Articles | Raw Feeding Hub`,
      description: category.description || `Browse ${articles.length} articles in the ${category.name} category.`,
    },
  };
}

// Generate static params for all categories
export async function generateStaticParams() {
  return blogCategories.map((category) => ({
    slug: category.slug,
  }));
}