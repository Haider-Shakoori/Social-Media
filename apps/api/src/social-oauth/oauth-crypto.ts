import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
export const randomUrlToken=(bytes=32)=>randomBytes(bytes).toString('base64url');
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
export function challenge(verifier:string){return createHash('sha256').update(verifier).digest('base64url');}
function key():Buffer{
 const raw=process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
 if(!raw)throw new Error('SOCIAL_TOKEN_ENCRYPTION_KEY must be configured');
 const value=Buffer.from(raw,'base64');
 if(value.length!==32||value.toString('base64')!==raw)throw new Error('SOCIAL_TOKEN_ENCRYPTION_KEY must be exactly 32 bytes of base64');
 return value;
}
export function seal(value:unknown):string{
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(),iv);
 const data=Buffer.from(JSON.stringify(value));
 const encrypted=Buffer.concat([cipher.update(data),cipher.final()]);
 return ['v1',iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),encrypted.toString('base64url')].join('.');
}
export function unseal<T>(payload:string):T{
 const parts=payload.split('.');
 if(parts.length!==4||parts[0]!=='v1')throw new Error('Invalid ciphertext version');
 const decipher=createDecipheriv('aes-256-gcm',key(),Buffer.from(parts[1],'base64url'));
 decipher.setAuthTag(Buffer.from(parts[2],'base64url'));
 return JSON.parse(Buffer.concat([decipher.update(Buffer.from(parts[3],'base64url')),decipher.final()]).toString('utf8')) as T;
}
