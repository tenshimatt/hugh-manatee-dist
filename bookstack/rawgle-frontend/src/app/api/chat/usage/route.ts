import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // For demo purposes, return mock usage data
    // In production, this would fetch from a database
    const usage = {
      used: Math.floor(Math.random() * 3), // Random 0-2 for demo
      limit: 5,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };

    return NextResponse.json(usage);
  } catch (error: any) {
    console.error('Usage API Error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch usage data' } },
      { status: 500 }
    );
  }
}