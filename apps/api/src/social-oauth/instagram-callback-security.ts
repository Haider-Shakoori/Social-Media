import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {BadRequestException,UnauthorizedException} from '@nestjs/common';

function secret():string{
 const value=process.env.INSTAGRAM_APP_SECRET;
 if(!value)throw new Error('INSTAGRAM_APP_SECRET is required');
 return value;
}
function equal(a:Buffer,b:Buffer):boolean{return a.length===b.length&&timingSafeEqual(a,b);}
export function signedInstagramUser(body:unknown):string{
 if(!body||typeof body!=='object'||Array.isArray(body))throw new BadRequestException('Invalid callback');
 const input=(body as Record<string,unknown>).signed_request;
 if(typeof input!=='string'||input.length>8192||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(input))
  throw new BadRequestException('Missing signed_request');
 const [signature,payload]=input.split('.');
 const expected=createHmac('sha256',secret()).update(payload).digest();
 if(!equal(Buffer.from(signature,'base64url'),expected))
  throw new UnauthorizedException('Invalid callback signature');
 let parsed:unknown;
 try{parsed=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));}
 catch{throw new BadRequestException('Invalid signed payload');}
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))
  throw new BadRequestException('Invalid signed payload');
 const data=parsed as Record<string,unknown>;
 if(data.algorithm&&data.algorithm!=='HMAC-SHA256')
  throw new BadRequestException('Unsupported signature algorithm');
 const userId=data.user_id;
 if((typeof userId!=='string'&&typeof userId!=='number')||
  !/^[0-9]{5,30}$/.test(String(userId)))throw new BadRequestException('Invalid Instagram user ID');
 return String(userId);
}
// A stateless, short-lived completion receipt is issued only AFTER account data is erased.
// Does not contain an Instagram identifier and is valid across multiple API replicas.
export function deletionReceipt():string{
 const ts=Math.floor(Date.now()/1000).toString(36);
 const nonce=randomBytes(18).toString('base64url');
 const message=ts+'.'+nonce;
 const mac=createHmac('sha256',secret()).update('deletion:'+message).digest('base64url');
 return message+'.'+mac;
}
export function validDeletionReceipt(code:string):boolean{
 const parts=code.split('.');
 if(parts.length!==3||!/^[0-9a-z]{1,10}$/.test(parts[0])||
  !/^[A-Za-z0-9_-]{24}$/.test(parts[1])||!/^[A-Za-z0-9_-]{43}$/.test(parts[2]))return false;
 const issued=parseInt(parts[0],36),now=Math.floor(Date.now()/1000);
 if(!Number.isFinite(issued)||issued>now+60||now-issued>30*86400)return false;
 const message=parts[0]+'.'+parts[1];
 const expected=createHmac('sha256',secret()).update('deletion:'+message).digest();
 return equal(Buffer.from(parts[2],'base64url'),expected);
}
