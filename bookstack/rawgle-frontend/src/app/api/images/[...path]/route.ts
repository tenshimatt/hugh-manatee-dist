import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path || [];
    const imagePath = pathSegments.join('/');
    
    // Extract image name for display
    const imageName = pathSegments[pathSegments.length - 1] || 'image';
    const baseFileName = imageName.replace(/\.(jpg|jpeg|png|svg|webp)$/i, '');
    
    // Create dimensions based on image type
    let width = 800;
    let height = 600;
    
    // Author images should be smaller and square
    if (pathSegments.includes('authors')) {
      width = 400;
      height = 400;
    }
    
    // Generate image based on path
    const colors = getColorScheme(baseFileName);
    
    const svg = createPlaceholderSVG({
      width,
      height,
      title: formatTitle(baseFileName),
      subtitle: getSubtitle(pathSegments, baseFileName),
      colors,
    });
    
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      },
    });
  } catch (error) {
    console.error('Image API error:', error);
    
    // Fallback minimal SVG
    const fallbackSvg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" 
              text-anchor="middle" dominant-baseline="middle" fill="#9ca3af">
          Image Not Available
        </text>
      </svg>
    `;
    
    return new NextResponse(fallbackSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    });
  }
}

function getColorScheme(fileName: string): { primary: string; secondary: string; text: string } {
  // Generate consistent colors based on filename
  const colorSchemes = [
    { primary: '#4ade80', secondary: '#22c55e', text: 'white' }, // green
    { primary: '#f59e0b', secondary: '#d97706', text: 'white' }, // amber
    { primary: '#3b82f6', secondary: '#1d4ed8', text: 'white' }, // blue
    { primary: '#ec4899', secondary: '#db2777', text: 'white' }, // pink
    { primary: '#dc2626', secondary: '#b91c1c', text: 'white' }, // red
    { primary: '#059669', secondary: '#047857', text: 'white' }, // emerald
    { primary: '#6366f1', secondary: '#4f46e5', text: 'white' }, // indigo
    { primary: '#0891b2', secondary: '#0e7490', text: 'white' }, // cyan
  ];
  
  const hash = fileName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colorSchemes[hash % colorSchemes.length];
}

function formatTitle(fileName: string): string {
  return fileName
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getSubtitle(pathSegments: string[], fileName: string): string {
  if (pathSegments.includes('blog')) {
    const subtitles: Record<string, string> = {
      'raw-feeding-guide': 'Complete nutrition guide',
      'seasonal-feeding': 'Adapting diet through seasons',
      'max-transformation': 'Amazing health journey',
      'puppy-raw-feeding': 'Starting your puppy right',
      'raw-feeding-mistakes': 'Avoid these errors',
      '80-10-10-rule': 'Perfect raw feeding ratio',
    };
    return subtitles[fileName] || 'Raw feeding insights';
  }
  
  if (pathSegments.includes('authors')) {
    const subtitles: Record<string, string> = {
      'dr-sarah': 'Veterinary Nutritionist',
      'marcus': 'Raw Feeding Expert',
    };
    return subtitles[fileName] || 'Expert contributor';
  }
  
  return 'Rawgle content';
}

function createPlaceholderSVG({
  width,
  height,
  title,
  subtitle,
  colors,
}: {
  width: number;
  height: number;
  title: string;
  subtitle: string;
  colors: { primary: string; secondary: string; text: string };
}): string {
  const isSquare = width === height;
  
  if (isSquare) {
    // Author/profile image style
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <circle cx="${width/2}" cy="${height * 0.375}" r="${width * 0.2}" fill="white" opacity="0.3"/>
        <circle cx="${width/2}" cy="${height * 0.35}" r="${width * 0.075}" fill="white" opacity="0.8"/>
        <path d="M ${width * 0.35} ${height * 0.55} Q ${width/2} ${height * 0.5} ${width * 0.65} ${height * 0.55} Q ${width * 0.65} ${height * 0.65} ${width/2} ${height * 0.675} Q ${width * 0.35} ${height * 0.65} ${width * 0.35} ${height * 0.55}" fill="white" opacity="0.8"/>
        <text x="50%" y="${height * 0.8}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.06}" font-weight="bold" 
              text-anchor="middle" fill="${colors.text}">${title}</text>
        <text x="50%" y="${height * 0.875}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.04}" 
              text-anchor="middle" fill="${colors.text}" opacity="0.9">${subtitle}</text>
      </svg>
    `;
  } else {
    // Blog image style
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <circle cx="${width * 0.3}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.1}" fill="white" opacity="0.15"/>
        <circle cx="${width * 0.7}" cy="${height * 0.7}" r="${Math.min(width, height) * 0.12}" fill="white" opacity="0.15"/>
        <text x="50%" y="${height * 0.58}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.045}" font-weight="bold" 
              text-anchor="middle" fill="${colors.text}">${title}</text>
        <text x="50%" y="${height * 0.67}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.03}" 
              text-anchor="middle" fill="${colors.text}" opacity="0.9">${subtitle}</text>
      </svg>
    `;
  }
}