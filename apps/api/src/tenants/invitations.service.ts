import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from './access.service';
import { MailService } from '../security/mail.service';
import { RateLimiterService } from '../security/rate-limiter.service';
import { createToken, hashToken } from '../security/crypto';

type Role='ADMIN'|'EDITOR'|'APPROVER'|'VIEWER';
@Injectable()
export class InvitationsService {
  constructor(
    private readonly db:PrismaService,
    private readonly access:AccessService,
    private readonly mail:MailService,
    private readonly limiter:RateLimiterService,
  ) {}
  private get webOrigin():string{return new URL(process.env.WEB_BASE_URL||'http://localhost:3000').origin;}
  async create(userId:string,tenantId:string,email:string,role:Role) {
    const membership=await this.access.tenantRole(tenantId,userId);
    this.access.requireRole(membership,['OWNER','ADMIN']);
    if(role==='ADMIN' && membership!=='OWNER')throw new ForbiddenException('Only organization owners may invite administrators');
    this.mail.ensureConfigured();
    await this.limiter.check('invite-tenant',tenantId,40,3600);
    await this.limiter.check('invite-email',tenantId+':'+email,4,3600);
    const existing=await this.db.user.findUnique({where:{email},select:{id:true}});
    if(existing){
      const member=await this.db.membership.findUnique({where:{tenantId_userId:{tenantId,userId:existing.id}}});
      if(member)throw new ConflictException('Account already belongs to this organization');
    }
    const token=createToken();
    const tenant=await this.db.tenant.findUniqueOrThrow({where:{id:tenantId},select:{name:true}});
    const invite=await this.db.tenantInvitation.upsert({
      where:{tenantId_email:{tenantId,email}},
      create:{tenantId,email,role,invitedById:userId,tokenHash:hashToken(token),expiresAt:new Date(Date.now()+72*3600000)},
      update:{role,invitedById:userId,tokenHash:hashToken(token),expiresAt:new Date(Date.now()+72*3600000),acceptedAt:null,revokedAt:null},
      select:{id:true,email:true,role:true,expiresAt:true},
    });
    const url=this.webOrigin+'/invite/accept?token='+encodeURIComponent(token);
    await this.mail.send(email,'Invitation to '+tenant.name,url);
    return {invitation:invite,message:'Invitation email requested'};
  }
  async list(userId:string,tenantId:string) {
    const role=await this.access.tenantRole(tenantId,userId);
    this.access.requireRole(role,['OWNER','ADMIN']);
    const invitations=await this.db.tenantInvitation.findMany({where:{tenantId},select:{
      id:true,email:true,role:true,createdAt:true,expiresAt:true,acceptedAt:true,revokedAt:true,
    },orderBy:{createdAt:'desc'},take:100});
    return {invitations};
  }
  async revoke(userId:string,tenantId:string,invitationId:string) {
    const role=await this.access.tenantRole(tenantId,userId);
    this.access.requireRole(role,['OWNER','ADMIN']);
    const result=await this.db.tenantInvitation.updateMany({where:{
      id:invitationId,tenantId,acceptedAt:null,revokedAt:null,
    },data:{revokedAt:new Date()}});
    if(result.count!==1)throw new NotFoundException('Active invitation not found');
    return {message:'Invitation revoked'};
  }
  async accept(userId:string,token:string) {
    await this.limiter.check('accept-user',userId,15,3600);
    const hashed=hashToken(token);
    const now=new Date();
    return this.db.$transaction(async tx=>{
      // Existing logged-in identity is the only possible recipient. The token alone
      // does not grant access to a different email address.
      const user=await tx.user.findUniqueOrThrow({where:{id:userId},select:{email:true,emailVerifiedAt:true}});
      if(!user.emailVerifiedAt)throw new ForbiddenException('Verify your email to join an organization');
      const invite=await tx.tenantInvitation.findUnique({where:{tokenHash:hashed}});
      if(!invite || invite.email!==user.email || invite.acceptedAt || invite.revokedAt || invite.expiresAt<=now){
        throw new BadRequestException('Invitation invalid, expired, revoked or addressed to another user');
      }
      const existing=await tx.membership.findUnique({where:{tenantId_userId:{tenantId:invite.tenantId,userId}}});
      if(existing)throw new ConflictException('You already belong to this organization');
      const claimed=await tx.tenantInvitation.updateMany({
        where:{id:invite.id,acceptedAt:null,revokedAt:null,expiresAt:{gt:now}},
        data:{acceptedAt:now},
      });
      if(claimed.count!==1)throw new BadRequestException('Invitation already used');
      await tx.membership.create({data:{tenantId:invite.tenantId,userId,role:invite.role}});
      return {message:'Invitation accepted',tenantId:invite.tenantId};
    });
  }
}
