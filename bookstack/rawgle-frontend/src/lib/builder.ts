// Builder.io REST API integration
// This provides a lightweight alternative to the SDK that doesn't require native compilation

export interface BuilderContent {
  id: string;
  name: string;
  data: {
    blocks: BuilderBlock[];
    [key: string]: any;
  };
  published?: string;
  lastUpdated?: number;
  meta?: {
    [key: string]: any;
  };
}

export interface BuilderBlock {
  '@type': string;
  component?: {
    name: string;
    options: Record<string, any>;
  };
  responsiveStyles?: {
    [key: string]: Record<string, any>;
  };
  children?: BuilderBlock[];
  [key: string]: any;
}

export class BuilderAPI {
  private apiKey: string;
  private baseUrl = 'https://cdn.builder.io/api/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getContent(
    modelName: string,
    options: {
      url?: string;
      limit?: number;
      offset?: number;
      query?: Record<string, any>;
    } = {}
  ): Promise<BuilderContent[]> {
    const { url, limit = 1, offset = 0, query = {} } = options;
    
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      limit: limit.toString(),
      offset: offset.toString(),
      ...(url && { url }),
      ...Object.entries(query).reduce((acc, [key, value]) => {
        acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
        return acc;
      }, {} as Record<string, string>)
    });

    const response = await fetch(`${this.baseUrl}/content/${modelName}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Builder.io API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  async getPage(modelName: string, url: string): Promise<BuilderContent | null> {
    const contents = await this.getContent(modelName, { url, limit: 1 });
    return contents[0] || null;
  }

  // Render blocks to React components
  renderBlocks(blocks: BuilderBlock[]): React.ReactNode {
    return blocks.map((block, index) => this.renderBlock(block, index));
  }

  private renderBlock(block: BuilderBlock, key: number): React.ReactNode {
    const { '@type': type, component, children, responsiveStyles, ...props } = block;

    // Handle text blocks
    if (type === '@builder.io/sdk:Element' && component?.name === 'Text') {
      return React.createElement(
        'div',
        {
          key,
          dangerouslySetInnerHTML: { __html: component.options.text || '' },
          style: this.parseStyles(responsiveStyles?.large || {}),
        }
      );
    }

    // Handle image blocks
    if (type === '@builder.io/sdk:Element' && component?.name === 'Image') {
      return React.createElement('img', {
        key,
        src: component.options.image,
        alt: component.options.altText || '',
        style: this.parseStyles(responsiveStyles?.large || {}),
      });
    }

    // Handle custom components
    if (component?.name && this.customComponents[component.name]) {
      const Component = this.customComponents[component.name];
      return React.createElement(Component, {
        key,
        ...component.options,
        children: children ? this.renderBlocks(children) : undefined,
      });
    }

    // Default container
    return React.createElement(
      'div',
      {
        key,
        style: this.parseStyles(responsiveStyles?.large || {}),
        ...props,
      },
      children ? this.renderBlocks(children) : null
    );
  }

  private parseStyles(styles: Record<string, any>): React.CSSProperties {
    // Convert Builder.io styles to React CSS properties
    const cssProps: React.CSSProperties = {};
    
    Object.entries(styles).forEach(([key, value]) => {
      // Convert kebab-case to camelCase
      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      cssProps[camelKey as keyof React.CSSProperties] = value;
    });

    return cssProps;
  }

  // Registry for custom components
  private customComponents: Record<string, React.ComponentType<any>> = {};

  registerComponent(name: string, component: React.ComponentType<any>) {
    this.customComponents[name] = component;
  }
}

// Environment configuration
export const builderConfig = {
  apiKey: process.env.NEXT_PUBLIC_BUILDER_API_KEY || 'demo-key',
  models: {
    page: 'page',
    section: 'section',
    navigation: 'navigation',
    footer: 'footer',
    blogPost: 'blog-post',
    product: 'product',
  }
};

// Create singleton instance
export const builder = new BuilderAPI(builderConfig.apiKey);

// React hooks and component imports
import React, { useEffect, useState } from 'react';

export function useBuilderContent(modelName: string, url?: string) {
  const [content, setContent] = useState<BuilderContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true);
        setError(null);
        
        const result = url 
          ? await builder.getPage(modelName, url)
          : await builder.getContent(modelName, { limit: 1 }).then(results => results[0] || null);
        
        setContent(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [modelName, url]);

  return { content, loading, error };
}

interface BuilderComponentProps {
  model: string;
  url?: string;
  content?: BuilderContent;
  fallback?: React.ReactNode;
}

export function BuilderComponent({ 
  model, 
  url, 
  content: initialContent, 
  fallback 
}: BuilderComponentProps) {
  const { content, loading, error } = useBuilderContent(
    model, 
    initialContent ? undefined : url
  );

  const finalContent = initialContent || content;

  if (loading) {
    return React.createElement('div', {
      className: 'animate-pulse bg-gray-100 h-32 rounded'
    });
  }

  if (error) {
    console.error('Builder.io error:', error);
    return fallback || React.createElement('div', {}, 'Error loading content');
  }

  if (!finalContent) {
    return fallback || React.createElement('div', {}, 'No content found');
  }

  return React.createElement(
    'div',
    { 'data-builder-content': finalContent.id },
    builder.renderBlocks(finalContent.data.blocks || [])
  );
}