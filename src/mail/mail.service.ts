import { Inject, Injectable } from '@nestjs/common';
import * as FormData from 'form-data';
import got from 'got';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailModuleOptions, SendMailOptions } from './mail.interfaces';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {
    // this.sendEmail('joseonghwan3021@gmail.com', 'Test Verifing Email', 'Test Verifing Email');
  }

  private async sendEmail({
    to,
    subject,
    template,
    emailVars,
  }: SendMailOptions) {
    const form = new FormData();
    form.append(
      'from',
      `Admin from Nuber Eats <mailgun@${this.options.domain}>`,
    );
    form.append('to', to);
    form.append('subject', subject);
    form.append('template', template);
    emailVars.forEach((emailVar) => form.append(emailVar.key, emailVar.value));
    try {
      await got(`https://api.mailgun.net/v3/${this.options.domain}/messages`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `api:${this.options.apiKey}`,
          ).toString('base64')}`,
        },
        method: 'POST',
        body: form,
      });
    } catch (error) {
      console.error(error);
    }
  }

  sendVerificationEmail(email: string, code: string): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: 'Verify You Email',
      template: this.options.verifyTemplate,
      emailVars: [
        { key: 'v:username', value: email },
        { key: 'v:code', value: code },
      ],
    });
  }
}
