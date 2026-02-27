import { NextResponse } from 'next/server';
import { getActiveBanners } from '@/lib/db/banner-queries';

export async function GET() {
  const banners = await getActiveBanners();
  return NextResponse.json(banners);
}
