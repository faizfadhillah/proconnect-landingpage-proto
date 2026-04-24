import { Request, Response, NextFunction } from 'express';

/**
 * Global Middleware: Safe to apply to all routes
 * Prevents frontend and proxy/CDN caching of API responses
 */
export function cacheControlMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // 1. HTTP 1.1 + Proxy standard
  // "no-store" is the strongest directive
  // "proxy-revalidate" tells CDN/Proxy not to cache
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  );

  // 2. HTTP 1.0 standard (Legacy Browser support)
  res.setHeader('Pragma', 'no-cache');

  // 3. Ensure response is considered expired immediately
  res.setHeader('Expires', '0');

  // 4. CDN (Surrogate) specific - prevents storing this response
  res.setHeader('Surrogate-Control', 'no-store');

  next();
}

