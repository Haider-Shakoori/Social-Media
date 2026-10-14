import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, Res, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard, type AuthRequest } from '../security/auth.guard';
import { validated,registerInput,loginInput,emailInput,tokenInput,resetInput } from '../security/dto';
const cookieName='social_session';
function setCookie(res:Response,token:string){
  res.cookie(cookieName,token,{
    httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',
    path:'/api/v1',maxAge:7*24*60*60*1000,
  });
}
function clearCookie(res:Response){
  res.clearCookie(cookieName,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/api/v1'});
}
@Controller('auth')
export class AuthController {
  constructor(private readonly auth:AuthService){}
  @Post('register') @HttpCode(HttpStatus.ACCEPTED)
  async register(@Body() body:unknown,@Req() req:Request,@Res({passthrough:true}) res:Response){
    const result=await this.auth.register(validated(registerInput,body),req.ip||'unknown',req.header('user-agent')||'');
    if('token' in result && typeof result.token==='string'){
      setCookie(res,result.token);
      const {token:_,...publicResult}=result;
      return publicResult;
    }
    return result;
  }
  @Post('resend-verification') @HttpCode(HttpStatus.ACCEPTED)
  resend(@Body() body:unknown,@Req() req:Request){
    return this.auth.resendVerification(validated(emailInput,body).email,req.ip||'unknown');
  }
  @Post('verify-email') @HttpCode(HttpStatus.OK)
  verify(@Body() body:unknown){return this.auth.verifyEmail(validated(tokenInput,body).token);}
  @Post('login') @HttpCode(HttpStatus.OK)
  async login(@Body() body:unknown,@Req() req:Request,@Res({passthrough:true}) res:Response){
    const result=await this.auth.login(validated(loginInput,body),req.ip||'unknown',req.header('user-agent')||'');
    setCookie(res,result.token);
    return {user:result.user,expiresAt:result.expiresAt};
  }
  @Get('me') @UseGuards(AuthGuard)
  me(@Req() req:AuthRequest){return this.auth.getCurrentUser(req.authUserId);}
  @Post('logout') @UseGuards(AuthGuard) @HttpCode(HttpStatus.OK)
  async logout(@Req() req:AuthRequest,@Res({passthrough:true}) res:Response){
    const result=await this.auth.logout(req.authSessionId);clearCookie(res);return result;
  }
  @Get('sessions') @UseGuards(AuthGuard)
  sessions(@Req() req:AuthRequest){return this.auth.sessions(req.authUserId);}
  @Delete('sessions/:sessionId') @UseGuards(AuthGuard)
  async revoke(@Req() req:AuthRequest,@Param('sessionId',new ParseUUIDPipe()) sessionId:string,@Res({passthrough:true}) res:Response){
    const result=await this.auth.revokeSession(req.authUserId,sessionId);
    if(sessionId===req.authSessionId)clearCookie(res);
    return result;
  }
  @Post('forgot-password') @HttpCode(HttpStatus.ACCEPTED)
  forgot(@Body() body:unknown,@Req() req:Request){
    return this.auth.requestPasswordReset(validated(emailInput,body).email,req.ip||'unknown');
  }
  @Post('reset-password') @HttpCode(HttpStatus.OK)
  reset(@Body() body:unknown){const input=validated(resetInput,body);return this.auth.resetPassword(input.token,input.password);}
}
