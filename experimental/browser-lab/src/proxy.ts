import {readFile} from 'node:fs/promises';
import {URL} from 'node:url';

export type AccountProxy={server:string;username?:string;password?:string;bypass?:string};
export type ProxyMapping=Record<string,AccountProxy>;
function validateProxy(p:unknown):AccountProxy{
 if(!p||typeof p!=='object'||Array.isArray(p))throw new Error('Invalid operator proxy entry');
 const entry=p as Record<string,unknown>;
 if(typeof entry.server!=='string')throw new Error('Missing proxy endpoint');
 const url=new URL(entry.server);
 if(!['http:','https:','socks5:'].includes(url.protocol)||!url.hostname||url.username||url.password||
   url.search||url.hash||(url.pathname!==''&&url.pathname!=='/'))throw new Error('Invalid proxy server URL');
 if(url.protocol==='socks5:'&&(entry.username!==undefined||entry.password!==undefined))
  throw new Error('Authenticated SOCKS5 is not supported by Chromium; use supported HTTP proxy authentication');
 for(const key of ['username','password','bypass']){
  if(entry[key]!==undefined&&typeof entry[key]!=='string')throw new Error('Invalid proxy setting');
 }
 const server=url.origin==='null'?entry.server:url.origin;
 return {server, ...(entry.username!==undefined?{username:entry.username as string}:{}),
  ...(entry.password!==undefined?{password:entry.password as string}:{}),
  ...(entry.bypass!==undefined?{bypass:entry.bypass as string}:{}),
 };
}
/** No client supplied proxy URLs or credentials. Only an operator-mounted read-only JSON file. */
export async function proxyForAccount(accountKey:string,filePath?:string):Promise<AccountProxy|undefined>{
 if(!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,79}$/.test(accountKey))throw new Error('Invalid account key');
 if(!filePath)return undefined;
 const data=await readFile(filePath,'utf8');
 if(data.length>100_000)throw new Error('Proxy map exceeds size limit');
 const parsed:unknown=JSON.parse(data);
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Invalid proxy map');
 const map=parsed as Record<string,unknown>;
 if(!Object.hasOwn(map,accountKey))return undefined;
 return validateProxy(map[accountKey]);
}
