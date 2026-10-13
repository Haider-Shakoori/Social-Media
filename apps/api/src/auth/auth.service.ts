import {
  ConflictException, Injectable, UnauthorizedException, BadRequestException, ServiceUnavailableException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { createToken, hashPassword, hashToken, verifyPassword } from '../security/crypto';
import { MailService } from '../security/mail.service';
import { RateLimiterService } from '../security/rate-limiter.service';

type UserFields={id:string;email:string;fullName:string;emailVerifiedAt:Date|null};
function publicUser(user:UserFields){
  return {id:user.id,email:user.email,fullName:user.fullName,emailVerified:!!user.emailVerifiedAt};
}
const hours=(value:number)=>new Date(Date.now()+value*60*60*1000);
@Injectable()
export class AuthService {
  constructor(
    private readonly db:PrismaService,
    private readonly limiter:RateLimiterService,
    private readonly mail:MailService,
  ) {}
  private async newEmailToken(userId:string,purpose:'VERIFY_EMAIL'|'RESET_PASSWORD',ttlHours:number){
    const token=createToken();
    await this.db.emailToken.create({data:{userId,purpose,tokenHash:hashToken(token),expiresAt:hours(ttlHours)}});
    return token;
  }
  private get websiteUrl(){
    const value=process.env.WEB_BASE_URL || 'http://localhost:3000';
    return new URL(value).origin;
  }
  async register(input:{email:string;password:string;fullName:string},ip:string){
    if(process.env.REGISTRATION_ENABLED!=='true') throw new ServiceUnavailableException('Registration is not open');
    await this.limiter.check('register-ip',ip,10,3600);
    await this.limiter.check('register-email',input.email,3,3600);
    this.mail.ensureConfigured();
    const exists=await this.db.user.findUnique({where:{email:input.email},select:{id:true}});
    if(exists)return {message:'If this address can register, verification instructions will be emailed.'};
    const hashed=await hashPassword(input.password);
    let user;
    try {
      user=await this.db.user.create({data:{email:input.email,passwordHash:hashed,fullName:input.fullName}});
    } catch(error) {
      if(typeof error==='object' && error!==null && 'code' in error && error.code==='P2002') {
        return {message:'If this address can register, verification instructions will be emailed.'};
      }
      throw error;
    }
    const token=await this.newEmailToken(user.id,'VERIFY_EMAIL',24);
    const url=this.websiteUrl+'/verify-email?token='+encodeURIComponent(token);
    await this.mail.send(user.email,'Verify your Social-Media email',url);
    return {message:'If this address can register, verification instructions will be emailed.'};
  }
  async resendVerification(email:string,ip:string){
    await this.limiter.check('resend-ip',ip,10,3600);
    await this.limiter.check('resend-email',email,3,3600);
    this.mail.ensureConfigured();
    const user=await this.db.user.findUnique({where:{email}});
    if(user && !user.emailVerifiedAt) {
      await this.db.emailToken.deleteMany({where:{userId:user.id,purpose:'VERIFY_EMAIL',consumedAt:null}});
      const token=await this.newEmailToken(user.id,'VERIFY_EMAIL',24);
      await this.mail.send(email,'Verify your Social-Media email',this.websiteUrl+'/verify-email?token='+encodeURIComponent(token));
    }
    return {message:'If the account needs verification, instructions will be sent.'};
  }
  async verifyEmail(token:string){
    const hashed=hashToken(token);
    await this.db.$transaction(async(tx)=>{
      const record=await tx.emailToken.findUnique({where:{tokenHash:hashed}});
      if(!record || record.purpose!=='VERIFY_EMAIL' || record.consumedAt || record.expiresAt<=new Date()) throw new BadRequestException('Verification link invalid or expired');
      const used=await tx.emailToken.updateMany({where:{id:record.id,consumedAt:null,expiresAt:{gt:new Date()}},data:{consumedAt:new Date()}});
      if(used.count!==1)throw new BadRequestException('Verification link invalid or expired');
      await tx.user.update({where:{id:record.userId},data:{emailVerifiedAt:new Date()}});
    });
    return {message:'Email verified. You can now sign in.'};
  }
  async login(input:{email:string;password:string},ip:string,userAgent:string){
    await this.limiter.check('login-ip',ip,25,3600);
    await this.limiter.check('login-email',input.email,12,3600);
    const user=await this.db.user.findUnique({where:{email:input.email}});
    if(!user || !user.passwordHash || !(await verifyPassword(input.password,user.passwordHash))) {
      if(!user) await hashPassword(input.password);
      throw new UnauthorizedException('Invalid email or password');
    }
    if(!user.emailVerifiedAt) throw new UnauthorizedException('Verify your email before signing in');
    const token=createToken();
    const expiresAt=hours(24*7);
    await this.db.session.create({data:{
      userId:user.id,tokenHash:hashToken(token),expiresAt,userAgent:userAgent.slice(0,300),
    }});
    return {token,expiresAt,user:publicUser(user)};
  }
  async getCurrentUser(userId:string){
    const user=await this.db.user.findUniqueOrThrow({where:{id:userId}});
    return publicUser(user);
  }
  async logout(sessionId:string){
    await this.db.session.updateMany({where:{id:sessionId,revokedAt:null},data:{revokedAt:new Date()}});
    return {message:'Signed out'};
  }
  async sessions(userId:string){
    const sessions=await this.db.session.findMany({where:{userId,revokedAt:null,expiresAt:{gt:new Date()}},select:{
      id:true,createdAt:true,expiresAt:true,userAgent:true,
    },orderBy:{createdAt:'desc'}});
    return {sessions};
  }
  async revokeSession(userId:string,sessionId:string){
    await this.db.session.updateMany({where:{id:sessionId,userId},data:{revokedAt:new Date()}});
    return {message:'Session revoked'};
  }
  async requestPasswordReset(email:string,ip:string){
    await this.limiter.check('password-reset-ip',ip,10,3600);
    await this.limiter.check('password-reset-email',email,3,3600);
    this.mail.ensureConfigured();
    const user=await this.db.user.findUnique({where:{email}});
    if(user?.emailVerifiedAt){
      await this.db.emailToken.deleteMany({where:{userId:user.id,purpose:'RESET_PASSWORD',consumedAt:null}});
      const token=await this.newEmailToken(user.id,'RESET_PASSWORD',1);
      await this.mail.send(email,'Reset your Social-Media password',this.websiteUrl+'/reset-password?token='+encodeURIComponent(token));
    }
    return {message:'If an account exists, reset instructions will be sent.'};
  }
  async resetPassword(token:string,newPassword:string){
    const hashed=hashToken(token);
    const passwordHash=await hashPassword(newPassword);
    await this.db.$transaction(async(tx)=>{
      const record=await tx.emailToken.findUnique({where:{tokenHash:hashed}});
      if(!record || record.purpose!=='RESET_PASSWORD' || record.consumedAt || record.expiresAt<=new Date()) throw new BadRequestException('Reset link invalid or expired');
      const used=await tx.emailToken.updateMany({where:{id:record.id,consumedAt:null,expiresAt:{gt:new Date()}},data:{consumedAt:new Date()}});
      if(used.count!==1)throw new BadRequestException('Reset link invalid or expired');
      await tx.user.update({where:{id:record.userId},data:{passwordHash}});
      await tx.session.updateMany({where:{userId:record.userId,revokedAt:null},data:{revokedAt:new Date()}});
    });
    return {message:'Password changed. Sign in with the new password.'};
  }
}
