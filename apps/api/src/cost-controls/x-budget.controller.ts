import {Body,Controller,Get,Param,ParseUUIDPipe,Put,Req,UseGuards} from '@nestjs/common';
import {z} from 'zod';import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {validated} from '../security/dto';import {XBudgetService} from './x-budget.service';
@Controller('tenants/:tenantId/x-budget')@UseGuards(AuthGuard)
export class XBudgetController{
 constructor(private readonly svc:XBudgetService){}
 @Get()read(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string){
  return this.svc.get(t,req.authUserId);
 }
 @Put('planning-cap')cap(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Body() body:unknown){
  const x=validated(z.strictObject({monthlyCeilingMinor:z.number().int().min(0).max(10000000)}),body);
  return this.svc.set(t,req.authUserId,x.monthlyCeilingMinor);
 }
}
