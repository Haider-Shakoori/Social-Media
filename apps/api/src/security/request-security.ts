import { BadRequestException, ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
const unsafe = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
export function validateRequestOrigin(method: string, origin: string | undefined, allowed: readonly string[]): void {
  if (!unsafe.has(method.toUpperCase())) return;
  // Fail closed for state-changing browser requests (including auth forms).
  if (!origin || !allowed.includes(origin)) throw new ForbiddenException('Origin is not allowed');
}
export function readSessionCookie(header: string | undefined): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index > 0 && part.slice(0,index).trim() === 'social_session') {
      const raw = part.slice(index+1).trim();
      if (/^[A-Za-z0-9_-]{40,80}$/.test(raw)) return raw;
    }
  }
  return null;
}
@Injectable()
export class RequestSecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const allowed = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(x=>x.trim()).filter(Boolean);
    // Origin check is a CSRF defense-in-depth measure alongside SameSite cookies.
    validateRequestOrigin(req.method, req.header('origin'), allowed);
    if (unsafe.has(req.method)) {
      const type = req.header('content-type') || '';
      if (!type.toLowerCase().startsWith('application/json')) {
        throw new BadRequestException('JSON requests required');
      }
    }
    res.setHeader('Cache-Control', 'no-store');
    next();
  }
}
