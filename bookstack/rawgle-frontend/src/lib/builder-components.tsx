// Builder.io Component Registry
// This registers all existing Rawgle components for use in Builder.io

import React from 'react';
import { builder } from './builder';

// Import existing components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Hero Components
export const HeroSection = ({ 
  title, 
  subtitle, 
  buttonText, 
  buttonLink, 
  backgroundImage,
  overlay = true 
}: {
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundImage?: string;
  overlay?: boolean;
}) => (
  <section 
    className="relative min-h-screen flex items-center justify-center"
    style={{
      backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    {overlay && backgroundImage && (
      <div className="absolute inset-0 bg-black/50" />
    )}
    <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
      <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
        {title}
      </h1>
      <p className="text-xl md:text-2xl text-white/90 mb-8">
        {subtitle}
      </p>
      {buttonText && buttonLink && (
        <Button size="lg" asChild>
          <a href={buttonLink}>{buttonText}</a>
        </Button>
      )}
    </div>
  </section>
);

// Feature Grid
export const FeatureGrid = ({ 
  features 
}: {
  features: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
}) => (
  <section className="py-20 px-4">
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader>
              {feature.icon && (
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
              )}
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// Pet Profile Card
export const PetCard = ({
  name,
  species,
  breed,
  age,
  avatar,
  stats
}: {
  name: string;
  species: string;
  breed?: string;
  age?: string;
  avatar?: string;
  stats?: Array<{ label: string; value: string }>;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
      <Avatar className="h-16 w-16 mr-4">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback>{name[0]}</AvatarFallback>
      </Avatar>
      <div>
        <CardTitle>{name}</CardTitle>
        <CardDescription>
          {species} {breed && `• ${breed}`} {age && `• ${age}`}
        </CardDescription>
      </div>
    </CardHeader>
    {stats && (
      <CardContent>
        <div className="flex gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    )}
  </Card>
);

// Navigation Menu
export const NavigationMenu = ({
  logo,
  items,
  ctaText,
  ctaLink
}: {
  logo?: string;
  items: Array<{
    title: string;
    href: string;
    children?: Array<{ title: string; href: string }>;
  }>;
  ctaText?: string;
  ctaLink?: string;
}) => (
  <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center space-x-8">
          {logo && (
            <a href="/" className="flex items-center space-x-2">
              <img src={logo} alt="Rawgle" className="h-8 w-8" />
              <span className="font-bold text-xl">RAWGLE</span>
            </a>
          )}
          <div className="hidden md:flex space-x-6">
            {items.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.title}
              </a>
            ))}
          </div>
        </div>
        {ctaText && ctaLink && (
          <Button asChild>
            <a href={ctaLink}>{ctaText}</a>
          </Button>
        )}
      </div>
    </div>
  </nav>
);

// Testimonial Section
export const TestimonialSection = ({
  testimonials
}: {
  testimonials: Array<{
    quote: string;
    author: string;
    title?: string;
    avatar?: string;
    rating?: number;
  }>;
}) => (
  <section className="py-20 px-4 bg-muted/50">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">What Pet Parents Say</h2>
        <p className="text-muted-foreground">Real stories from the Rawgle community</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              {testimonial.rating && (
                <div className="flex mb-4">
                  {Array.from({ length: testimonial.rating }, (_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
              )}
              <blockquote className="mb-4">"{testimonial.quote}"</blockquote>
              <div className="flex items-center">
                {testimonial.avatar && (
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
                    <AvatarFallback>{testimonial.author[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  {testimonial.title && (
                    <div className="text-sm text-muted-foreground">{testimonial.title}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// Stats Section
export const StatsSection = ({
  stats
}: {
  stats: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
}) => (
  <section className="py-20 px-4">
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        {stats.map((stat, index) => (
          <div key={index}>
            <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
            <div className="text-lg font-semibold mb-1">{stat.label}</div>
            {stat.description && (
              <div className="text-sm text-muted-foreground">{stat.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Blog Card
export const BlogCard = ({
  title,
  excerpt,
  author,
  date,
  category,
  image,
  href
}: {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category?: string;
  image?: string;
  href: string;
}) => (
  <Card className="overflow-hidden">
    {image && (
      <div className="aspect-video overflow-hidden">
        <img src={image} alt={title} className="object-cover w-full h-full" />
      </div>
    )}
    <CardHeader>
      {category && <Badge variant="secondary">{category}</Badge>}
      <CardTitle className="line-clamp-2">
        <a href={href} className="hover:text-primary transition-colors">
          {title}
        </a>
      </CardTitle>
      <CardDescription className="line-clamp-3">{excerpt}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-sm text-muted-foreground">
        By {author} • {date}
      </div>
    </CardContent>
  </Card>
);

// CTA Section
export const CTASection = ({
  title,
  subtitle,
  buttonText,
  buttonLink,
  secondaryButtonText,
  secondaryButtonLink,
  backgroundColor = 'primary'
}: {
  title: string;
  subtitle?: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  backgroundColor?: 'primary' | 'muted' | 'transparent';
}) => {
  const bgClass = {
    primary: 'bg-primary text-primary-foreground',
    muted: 'bg-muted',
    transparent: ''
  }[backgroundColor];

  return (
    <section className={`py-20 px-4 ${bgClass}`}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        {subtitle && (
          <p className="text-lg md:text-xl mb-8 opacity-90">{subtitle}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant={backgroundColor === 'primary' ? 'secondary' : 'default'} asChild>
            <a href={buttonLink}>{buttonText}</a>
          </Button>
          {secondaryButtonText && secondaryButtonLink && (
            <Button size="lg" variant="outline" asChild>
              <a href={secondaryButtonLink}>{secondaryButtonText}</a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

// Register all components with Builder.io
export function registerBuilderComponents() {
  // Layout components
  builder.registerComponent('HeroSection', HeroSection);
  builder.registerComponent('FeatureGrid', FeatureGrid);
  builder.registerComponent('NavigationMenu', NavigationMenu);
  builder.registerComponent('TestimonialSection', TestimonialSection);
  builder.registerComponent('StatsSection', StatsSection);
  builder.registerComponent('CTASection', CTASection);
  
  // Content components
  builder.registerComponent('BlogCard', BlogCard);
  builder.registerComponent('PetCard', PetCard);
  
  // UI components
  builder.registerComponent('Button', Button);
  builder.registerComponent('Card', Card);
  builder.registerComponent('Badge', Badge);
  
  // Dashboard components
  // builder.registerComponent('PawsBalance', PawsBalance);
}

// Auto-register on client-side only
if (typeof window !== 'undefined') {
  registerBuilderComponents();
}