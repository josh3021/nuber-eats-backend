export interface SendMailOptions {
  to: string;
  subject: string;
  template: string;
  emailVars: EmailVariables[];
}

export interface MailModuleOptions {
  apiKey: string;
  domain: string;
  fromEmail: string;
  verifyTemplate: string;
}

export interface EmailVariables {
  key: string;
  value: string;
}
