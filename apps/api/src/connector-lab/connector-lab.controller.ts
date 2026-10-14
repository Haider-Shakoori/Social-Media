import {Body,Controller,Get,Param,ParseUUIDPipe,Patch,Post,Req,UseGuards} from '@nestjs/common';
import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {PlatformGuard} from '../billing/platform.guard';
import {validated} from '../security/dto';
import {ConnectorLabAgentGuard} from './connector-lab.guard';
import {ConnectorLabService} from './connector-lab.service';
import {createAccount,updateAccount,requestTest,heartbeat,testResult} from './connector-lab.dto';
@Controller('platform/connector-lab')
@UseGuards(AuthGuard,PlatformGuard)
export class ConnectorLabAdminController {
 constructor(private readonly lab:ConnectorLabService){}
 @Get('overview') overview(){return this.lab.overview();}
 @Post('accounts')create(@Req() request:AuthRequest,@Body() body:unknown){
  return this.lab.register(request.authUserId,validated(createAccount,body));
 }
 @Patch('accounts/:id')update(@Req() request:AuthRequest,
  @Param('id',new ParseUUIDPipe()) id:string,@Body() body:unknown){
  return this.lab.update(request.authUserId,id,validated(updateAccount,body));
 }
 @Post('tests')test(@Req() request:AuthRequest,@Body() body:unknown){
  return this.lab.enqueue(request.authUserId,validated(requestTest,body));
 }
}
@Controller('browser-lab/agent')
@UseGuards(ConnectorLabAgentGuard)
export class ConnectorLabAgentController {
 constructor(private readonly lab:ConnectorLabService){}
 @Post('heartbeat')beat(@Body() body:unknown){return this.lab.heartbeat(validated(heartbeat,body));}
 @Post('claim')claim(){return this.lab.claim();}
 @Post('result')finish(@Body() body:unknown){return this.lab.finish(validated(testResult,body));}
}
