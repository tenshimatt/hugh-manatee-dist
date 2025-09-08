# Builder.io Integration for Rawgle

Complete Builder.io integration that allows visual editing of all pages, components, and navigation.

## 🚀 What's Included

### ✅ Complete Page System
- **Homepage**: `/builder-home` - Fully visual homepage with hero, features, testimonials
- **Features Page**: `/builder-features` - Product features showcase
- **Blog System**: `/builder-blog` - Blog listing with article cards
- **Dynamic Pages**: `/builder/[...slug]` - Any page can be managed via Builder.io

### ✅ Visual Components Library
- **HeroSection**: Hero banners with CTA buttons
- **FeatureGrid**: Feature showcases with icons
- **NavigationMenu**: Full navigation with dropdowns  
- **TestimonialSection**: Customer testimonials
- **StatsSection**: Key metrics display
- **BlogCard**: Article preview cards
- **PetCard**: Pet profile cards
- **CTASection**: Call-to-action sections

### ✅ Navigation System
- **BuilderNav**: Fully editable main navigation
- **Dynamic Menus**: Dropdown menus with sub-items
- **Mobile Responsive**: Works on all devices

## 🔧 Setup Instructions

### 1. Get Builder.io API Key
1. Go to [Builder.io](https://builder.io) and create a free account
2. Create a new space for your project
3. Copy your API key from Settings → API Keys

### 2. Configure Environment
Update your `.env.local` file:
```bash
NEXT_PUBLIC_BUILDER_API_KEY=your_actual_api_key_here
```

### 3. Create Builder.io Models

In your Builder.io dashboard, create these models:

#### Page Model
```json
{
  "name": "page",
  "kind": "page",
  "description": "Dynamic pages"
}
```

#### Navigation Model  
```json
{
  "name": "navigation",
  "kind": "data",
  "description": "Site navigation"
}
```

#### Blog Post Model
```json
{
  "name": "blog-post", 
  "kind": "page",
  "description": "Blog articles"
}
```

### 4. Register Custom Components

In Builder.io Visual Editor:
1. Go to Models → page
2. Click "Custom Components"
3. Import from URL: `http://localhost:3000/builder-components.json`

Or manually add each component from `src/lib/builder-components.tsx`

## 📱 Usage Guide

### Creating New Pages
1. Go to Builder.io dashboard
2. Create new content in "page" model
3. Set the URL path (e.g., `/pricing`, `/about`)
4. Drag and drop components to build your page
5. Publish when ready

### Editing Navigation
1. Go to Builder.io dashboard  
2. Find "navigation" model content
3. Edit menu items, add/remove links
4. Update CTA buttons
5. Publish changes

### Managing Blog
1. Create content in "blog-post" model
2. Set URL as `/blog/article-slug`
3. Use BlogCard component for listings
4. Set featured image and metadata

## 🎨 Available Components

### Layout Components
- `HeroSection` - Hero banners with background images
- `FeatureGrid` - Grid layouts for features/services  
- `StatsSection` - Key metrics and numbers
- `TestimonialSection` - Customer testimonials
- `CTASection` - Call-to-action sections

### Content Components  
- `BlogCard` - Article preview cards
- `PetCard` - Pet profile displays
- `NavigationMenu` - Site navigation

### UI Components
- `Button` - Styled buttons
- `Card` - Content cards  
- `Badge` - Status badges

## 🔄 Development Workflow

### Testing Pages Locally
1. Visit `/builder-home` - Demo homepage
2. Visit `/builder-features` - Demo features page
3. Visit `/builder-blog` - Demo blog page
4. Visit `/builder/any-path` - Dynamic pages

### Adding New Components
1. Create component in `src/lib/builder-components.tsx`
2. Register with `builder.registerComponent()`
3. Restart dev server
4. Component appears in Builder.io editor

### Deploying Changes
1. Build project: `npm run build`
2. Deploy to your hosting platform
3. Update Builder.io preview URL if needed
4. Test visual editing in production

## 🌟 Benefits

### For Developers
- **No SDK Compilation Issues**: Uses REST API instead of problematic native dependencies
- **Type Safety**: Full TypeScript support
- **Component Reuse**: Existing components work in Builder.io
- **SEO Optimized**: Server-side rendering with Next.js

### For Content Managers  
- **Visual Editing**: Drag and drop page building
- **No Coding**: Edit content without developer help
- **Real-time Preview**: See changes instantly
- **Version Control**: Built-in content versioning

### For Business
- **Faster Updates**: Marketing team can update pages directly
- **A/B Testing**: Built-in testing capabilities
- **Performance**: Optimized content delivery
- **Scalability**: Handle thousands of pages easily

## 🚨 Important Notes

### API Key Security
- Use environment variables for API keys
- Different keys for development/production  
- Never commit keys to version control

### Content Models
- Create proper models in Builder.io dashboard
- Match field names with component props
- Set appropriate permissions per model

### Performance
- Builder.io content is cached (60s default)
- Images are optimized automatically
- Components lazy load when needed

## 🔗 Resources

- [Builder.io Documentation](https://www.builder.io/c/docs)
- [Next.js Integration Guide](https://www.builder.io/c/docs/developers/nextjs)
- [Component API Reference](https://www.builder.io/c/docs/custom-components)

## 🆘 Troubleshooting

### Content Not Loading
1. Check API key in environment
2. Verify model names match
3. Check network tab for API errors
4. Ensure content is published

### Components Not Appearing
1. Verify component registration
2. Check Builder.io custom components section  
3. Restart development server
4. Clear Builder.io cache

### Styling Issues
1. Import necessary CSS files
2. Check Tailwind classes are available
3. Verify responsive styles
4. Test across different devices

---

🎉 **Your entire Rawgle site is now Builder.io ready!**

Visit `/builder-home` to see the visual homepage, then start creating and editing pages directly in Builder.io's visual editor.