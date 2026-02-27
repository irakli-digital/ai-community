import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  const allCookies = cookieStore.getAll();
  
  return NextResponse.json({
    hasSession: !!session,
    sessionLength: session?.value?.length ?? 0,
    cookieNames: allCookies.map(c => c.name),
    nodeEnv: process.env.NODE_ENV,
    baseUrl: process.env.BASE_URL,
  });
}
