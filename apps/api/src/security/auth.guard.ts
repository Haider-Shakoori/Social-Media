import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { hashToken } from './crypto';
import { readSessionCookie } from './request-security';
export type AuthRequest = Request & { authUserId: string; authSessionId: string };
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req=context.switchToHttp().getRequest<AuthRequest>();
    const token=readSessionCookie(req.header('cookie'));
    if(!token) throw new UnauthorizedException('Sign in required');
    const session=await this.prisma.session.findUnique({
      where:{tokenHash:hashToken(token)},include:{user:true}
    });
    if(!session || session.revokedAt || session.expiresAt<=new Date() || !session.user.emailVerifiedAt) {
      throw new UnauthorizedException('Session expired or invalid');
    }
    req.authUserId=session.userId;
    req.authSessionId=session.id;
    return true;
  }
}
