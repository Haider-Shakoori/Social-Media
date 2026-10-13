import {Body,Controller,Get,Param,ParseUUIDPipe,Patch,Post,Req,UseGuards} from '@nestjs/common';
import {BillingService} from './billing.service';
import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {PlatformGuard} from './platform.guard';
import {validated} from '../security/dto';
import {planInput,planPatch,activateInput,extendTrialInput,invoiceInput,paymentInput,decisionInput} from './billing.dto';

@Controller('billing')
export class BillingController {
 constructor(private readonly service:BillingService){}
 @Get('plans')plans(){return this.service.publishedPlans();}
 @Get('tenants/:tenantId') @UseGuards(AuthGuard)
 overview(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) id:string){
  return this.service.tenantOverview(req.authUserId,id);
 }
}
@Controller('platform/billing')
@UseGuards(AuthGuard,PlatformGuard)
export class PlatformBillingController {
 constructor(private readonly service:BillingService){}
 @Get('plans')plans(){return this.service.listPlans();}
 @Post('plans')create(@Req() req:AuthRequest,@Body() body:unknown){
  return this.service.createPlan(req.authUserId,validated(planInput,body));
 }
 @Patch('plans/:code')update(@Req() req:AuthRequest,@Param('code') code:string,@Body() body:unknown){
  return this.service.updatePlan(req.authUserId,code,validated(planPatch,body));
 }
 @Get('tenants')tenants(){return this.service.listTenants();}
 @Get('tenants/:tenantId')tenant(@Param('tenantId',new ParseUUIDPipe()) id:string){
  return this.service.tenantForPlatform(id);
 }
 @Post('tenants/:tenantId/activate')activate(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) id:string,@Body() body:unknown){
  return this.service.activate(req.authUserId,id,validated(activateInput,body));
 }
 @Post('tenants/:tenantId/trial/extend')extend(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) id:string,@Body() body:unknown){
  return this.service.extendTrial(req.authUserId,id,validated(extendTrialInput,body).days);
 }
 @Post('tenants/:tenantId/suspend')suspend(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) id:string){
  return this.service.suspend(req.authUserId,id);
 }
 @Post('tenants/:tenantId/resume')resume(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) id:string){
  return this.service.resume(req.authUserId,id);
 }
 @Post('tenants/:tenantId/grace')grace(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) id:string,@Body() body:unknown){
  return this.service.grantGrace(req.authUserId,id,validated(extendTrialInput,body).days);
 }
 @Post('invoices')invoice(@Req() req:AuthRequest,@Body() body:unknown){
  return this.service.createInvoice(req.authUserId,validated(invoiceInput,body));
 }
 @Post('payments')payment(@Req() req:AuthRequest,@Body() body:unknown){
  return this.service.recordPayment(req.authUserId,validated(paymentInput,body));
 }
 @Post('payments/:paymentId/decision')verify(@Req() req:AuthRequest,@Param('paymentId',new ParseUUIDPipe()) id:string,@Body() body:unknown){
  return this.service.decidePayment(req.authUserId,id,validated(decisionInput,body).decision);
 }
}
