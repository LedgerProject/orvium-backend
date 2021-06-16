import { Injectable } from '@nestjs/common';
import { environment } from '../environments/environment';
import { createTransport } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class EmailService {
  private transporter: Mail;
  private defaultOptions: Mail.Options = {
    from: environment.senderEmail,
  };
  private subjectPrefix: string;

  constructor() {
    this.transporter = createTransport(environment.smtp);
    this.subjectPrefix = environment.name == 'production' ? '' : `[${environment.name}] `;
  }

  async sendMail(options: Mail.Options): Promise<unknown> {
    options = { ...this.defaultOptions, ...options };
    options.subject = this.subjectPrefix + options.subject;
    console.log('Sending email', options);
    return this.transporter.sendMail(options);
  }

}
