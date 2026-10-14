import {CanActivate,ExecutionContext,Injectable,ServiceUnavailableException,UnauthorizedException} from '@nestjs/common';
import {createHash,timingSafeEqual} from 'node:crypto';
import type {Request} from 'express';
/** Dedicated high-entropy bridge token. Never allow browser-session cookies to authenticate agents. */
export function authorizeLabAgent(header:string|undefined,configured:string|undefined):boolean{
 if(!configured||!/^([A-Fa-f0-9]{64,128})$/.test(configured)||
    !header||!/^Bearer [A-Fa-f0-9]{64,128}$/.test(header))return false;
 const presented=header.slice(7);
 return timingSafeEqual(createHash('sha256').update(presented).digest(),
  createHash('sha256').update(configured).digest());
}
@Injectable()
export class ConnectorLabAgentGuard implements CanActivate{
 canActivate(ctx:ExecutionContext):boolean{
  if(process.env.BROWSER_LAB_CONTROL_ENABLED!=='true')
   throw new ServiceUnavailableException('Browser lab bridge disabled');
  const req=ctx.switchToHttp().getRequest<Request>();
  if(!authorizeLabAgent(req.header('authorization'),process.env.BROWSER_LAB_AGENT_TOKEN))
   throw new UnauthorizedException('Connector agent authentication required');
  return true;
 }
}
