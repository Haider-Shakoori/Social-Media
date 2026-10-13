import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';
@Injectable()
export class MailService {
  private config() {
    const host=process.env.SMTP_HOST;
    const from=process.env.SMTP_FROM;
    if(!host || !from) throw new ServiceUnavailableException('Verification email is not configured');
    const port=Number(process.env.SMTP_PORT||587);
    const secure=process.env.SMTP_SECURE==='true';
    return {host,from,port,secure};
  }
  ensureConfigured(): void { this.config(); }
  async send(address:string, subject:string, actionUrl:string): Promise<void> {
    const {host,from,port,secure}=this.config();
    const user=process.env.SMTP_USER;
    const pass=process.env.SMTP_PASSWORD;
    const transporter=nodemailer.createTransport({
      host,port,secure,
      auth:user && pass?{user,pass}:undefined,
      connectionTimeout:5000,
    });
    try {
      await transporter.sendMail({from,to:address,subject,text:subject+'\n\n'+actionUrl+'\n\nIf you did not request this, ignore this email.'});
    } catch {
      throw new ServiceUnavailableException('Email delivery temporarily unavailable');
    } finally { transporter.close(); }
  }
}
