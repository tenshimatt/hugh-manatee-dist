import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle missing images in /images/ path
  if (pathname.startsWith('/images/') && (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg') || pathname.endsWith('.png'))) {
    // Extract the path after /images/
    const imagePath = pathname.substring(8); // Remove '/images/' prefix
    
    // Redirect to our API route
    const url = request.nextUrl.clone();
    url.pathname = `/api/images/${imagePath}`;
    
    return NextResponse.rewrite(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/images/:path*',
  ],
};