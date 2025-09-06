import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const [width = '40', height = '40', ...rest] = params.params || ['40', '40'];
    
    const w = parseInt(width) || 40;
    const h = parseInt(height) || 40;
    
    // Create a simple SVG placeholder
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.min(w, h) * 0.2}" 
              text-anchor="middle" dominant-baseline="middle" fill="#999">
          ${w}×${h}
        </text>
      </svg>
    `;
    
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Placeholder API error:', error);
    
    // Return a minimal SVG on error
    const fallbackSvg = `
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ddd"/>
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