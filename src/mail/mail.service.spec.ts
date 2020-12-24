import { Test } from '@nestjs/testing';
import * as FormData from 'form-data';
import got from 'got';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailService } from './mail.service';

const MOCK_API_KEY = 'MOCK_API_KEY';
const MOCK_DOMAIN = 'MOCK_DOMAIN';
const MOCK_FROM_EMAIL = 'MOCK_FROM_EMAIL';
const MOCK_VERIFY_TEMPLATE = 'MOCK_VERIFY_TEMPLATE';

jest.mock('got');
jest.mock('form-data');

describe('MailService', () => {
  let service: MailService;
  beforeEach(async () => {
    const modules = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            apiKey: MOCK_API_KEY,
            domain: MOCK_DOMAIN,
            fromEmail: MOCK_FROM_EMAIL,
            verifyTemplate: MOCK_VERIFY_TEMPLATE,
          },
        },
      ],
    }).compile();
    service = modules.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should send email', async () => {
      const result = await service.sendEmail({
        to: 'abc@abc.test',
        subject: '',
        template: MOCK_VERIFY_TEMPLATE,
        emailVars: [{ key: 'key', value: 'value' }],
      });
      const formSpy = jest.spyOn(FormData.prototype, 'append');
      expect(formSpy).toHaveBeenCalledTimes(5);
      expect(got.post).toHaveBeenCalledTimes(1);
      expect(got.post).toHaveBeenCalledWith(
        `https://api.mailgun.net/v3/${MOCK_DOMAIN}/messages`,
        expect.any(Object),
      );
      expect(result).toEqual(true);
    });

    it('should FAIL on Error', async () => {
      jest.spyOn(got, 'post').mockImplementation(() => {
        throw new Error();
      });
      const result = await service.sendEmail({
        to: 'abc@abc.test',
        subject: '',
        template: MOCK_VERIFY_TEMPLATE,
        emailVars: [{ key: 'key', value: 'value' }],
      });
      expect(result).toEqual(false);
    });
  });

  describe('sendVerificationEmail', () => {
    const email = 'mock_to@mock.mock';
    const code = 'mock_code';
    it('should call sendEmail', async () => {
      const sendVerificationEmailArgs = {
        email,
        code,
      };
      jest.spyOn(service, 'sendEmail').mockImplementation(async () => true);
      service.sendVerificationEmail(
        sendVerificationEmailArgs.email,
        sendVerificationEmailArgs.code,
      );
      expect(service.sendEmail).toHaveBeenCalledTimes(1);
      expect(service.sendEmail).toHaveBeenCalledWith({
        to: sendVerificationEmailArgs.email,
        subject: 'Please Verify Your Email',
        template: MOCK_VERIFY_TEMPLATE,
        emailVars: [
          { key: 'v:username', value: sendVerificationEmailArgs.email },
          { key: 'v:code', value: sendVerificationEmailArgs.code },
        ],
      });
    });
  });
});
