import {CanActivate,ExecutionContext,ForbiddenException,Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import type {AuthRequest} from '../security/auth.guard';
@Injectable()
export class PlatformGuard implements CanActivate{
 constructor(private readonly db:PrismaService){}
 async canActivate(ctx:ExecutionContext){
  const req=ctx.switchToHttp().getRequest<AuthRequest>();
  const user=await this.db.user.findUnique({where:{id:req.authUserId},select:{isPlatformAdmin:true}});
  if(!user?.isPlatformAdmin)throw new ForbiddenException('Platform administrator only');
  return true;
 }
}
