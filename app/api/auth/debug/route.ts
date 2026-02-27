import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  
  if (!session) {
    return NextResponse.json({ error: 'no session cookie', cookies: cookieStore.getAll().map(c => c.name) });
  }

  try {
    const parsed = await verifyToken(session.value);
    return NextResponse.json({ 
      success: true, 
      user: parsed.user,
      expires: parsed.expires,
      tokenLength: session.value.length 
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: 'verifyToken failed', 
      message: err.message,
      tokenLength: session.value.length,
      tokenPreview: session.value.substring(0, 20) + '...'
    });
  }
}
