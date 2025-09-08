// Dynamic Builder.io page router
// This handles all pages managed by Builder.io

import { notFound } from 'next/navigation';
import { BuilderComponent } from '@/lib/builder';
import '@/lib/builder-components'; // Register components

interface BuilderPageProps {
  params: {
    slug: string[];
  };
}

export default async function BuilderPage({ params }: BuilderPageProps) {
  const path = `/${params.slug.join('/')}`;
  
  // Try to get content for this URL
  const content = await getBuilderContent('page', path);
  
  if (!content) {
    notFound();
  }
  
  return (
    <main>
      <BuilderComponent 
        model="page"
        url={path}
        content={content}
        fallback={<div>Loading page...</div>}
      />
    </main>
  );
}

// Server-side content fetching
async function getBuilderContent(model: string, url: string) {
  const apiKey = process.env.NEXT_PUBLIC_BUILDER_API_KEY || 'demo-key';
  
  try {
    const response = await fetch(
      `https://cdn.builder.io/api/v2/content/${model}?apiKey=${apiKey}&url=${encodeURIComponent(url)}&limit=1`,
      {
        // Cache for 1 minute in production
        next: { revalidate: 60 }
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.results?.[0] || null;
  } catch (error) {
    console.error('Failed to fetch Builder.io content:', error);
    return null;
  }
}

// Generate static params for known routes
export async function generateStaticParams() {
  // These are the main pages that will be managed by Builder.io
  const pages = [
    { slug: [] }, // Home page
    { slug: ['features'] },
    { slug: ['pricing'] },
    { slug: ['about'] },
    { slug: ['contact'] },
    { slug: ['blog'] },
    { slug: ['community'] },
    { slug: ['guides'] },
    { slug: ['shop'] },
    { slug: ['locations'] },
  ];
  
  return pages;
}

// SEO metadata from Builder.io content
export async function generateMetadata({ params }: BuilderPageProps) {
  const path = `/${params.slug.join('/')}`;
  const content = await getBuilderContent('page', path);
  
  if (!content) {
    return {
      title: 'Page Not Found - Rawgle',
    };
  }
  
  return {
    title: content.data.title || content.name || 'Rawgle - Raw Pet Food Community',
    description: content.data.description || 'Track feeding, connect with community, earn PAWS tokens',
    openGraph: {
      title: content.data.title || content.name,
      description: content.data.description,
      images: content.data.image ? [{ url: content.data.image }] : [],
    },
  };
}