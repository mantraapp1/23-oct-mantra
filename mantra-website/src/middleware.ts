import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Clone the response and add pathname header for layout detection
    const response = NextResponse.next();
    response.headers.set('x-pathname', request.nextUrl.pathname);
    return response;
}

export const config = {
    matcher: [
        // Match all routes except static files and api
        '/((?!_next/static|_next/image|favicon.ico|api).*)',
    ],
};
