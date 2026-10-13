import {ConflictException,ForbiddenException,Injectable,NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {MailService} from '../security/mail.service';
@Injectable()
export class NotificationsService{
 constructor(private readonly db:PrismaService,private readonly mail:MailService){}
 async inbox(userId:string){
  const [user,notifications,unread]=await Promise.all([
   this.db.user.findUniqueOrThrow({where:{id:userId},select:{notificationEmailOptIn:true}}),
   this.db.socialNotification.findMany({where:{recipientId:userId},orderBy:{createdAt:'desc'},take:100,
    select:{id:true,tenantId:true,subject:true,message:true,createdAt:true,readAt:true,emailedAt:true}}),
   this.db.socialNotification.count({where:{recipientId:userId,readAt:null}}),
  ]);
  return {notifications,unread,emailOptIn:user.notificationEmailOptIn};
 }
 async preference(userId:string,emailOptIn:boolean){
  await this.db.user.update({where:{id:userId},data:{notificationEmailOptIn:emailOptIn}});
  return {emailOptIn};
 }
 async read(userId:string,id:string){
  const changed=await this.db.socialNotification.updateMany({where:{id,recipientId:userId,readAt:null},data:{readAt:new Date()}});
  if(changed.count===0){
   const found=await this.db.socialNotification.findFirst({where:{id,recipientId:userId}});
   if(!found)throw new NotFoundException('Notification not found');
  }
  return {read:true};
 }
 async sendMyEmail(userId:string,id:string){
  const user=await this.db.user.findUniqueOrThrow({where:{id:userId},select:{email:true,notificationEmailOptIn:true}});
  if(!user.notificationEmailOptIn)throw new ForbiddenException('Email notifications not enabled');
  const claimed=await this.db.socialNotification.updateMany({where:{id,recipientId:userId,emailedAt:null},
   data:{emailedAt:new Date()}});
  if(!claimed.count)throw new ConflictException('Email already sent or not found');
  const notification=await this.db.socialNotification.findUniqueOrThrow({where:{id}});
  const base=process.env.WEB_BASE_URL||'http://localhost:3000';
  try{
   await this.mail.send(user.email,'Social-Media: '+notification.subject,new URL('/dashboard',base).toString());
   return {emailed:true};
  }catch(e){
   await this.db.socialNotification.update({where:{id},data:{emailedAt:null}});
   throw e;
  }
 }
}
