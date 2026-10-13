import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
export function validated<T>(schema:z.ZodType<T>, value:unknown): T {
  const result=schema.safeParse(value);
  if(!result.success) throw new BadRequestException('Invalid input');
  return result.data;
}
export const email=z.email().max(255).transform(v=>v.trim().toLowerCase());
export const password=z.string().min(12).max(128);
export const registerInput=z.strictObject({email,password,fullName:z.string().trim().min(1).max(150)});
export const loginInput=z.strictObject({email,password:z.string()});
export const tokenInput=z.strictObject({token:z.string().min(40).max(80).regex(/^[A-Za-z0-9_-]+$/)});
export const emailInput=z.strictObject({email});
export const resetInput=z.strictObject({token:tokenInput.shape.token,password});
export const tenantInput=z.strictObject({
  name:z.string().trim().min(2).max(200),
  slug:z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/),
});
export const workspaceInput=z.strictObject({name:z.string().trim().min(2).max(200),
  timezone:z.string().trim().min(3).max(100)});
export const roleInput=z.strictObject({role:z.enum(['ADMIN','EDITOR','APPROVER','VIEWER'])});
