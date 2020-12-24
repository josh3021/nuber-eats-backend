import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { JwtService } from './jwt.service';

const TEST_PRIVATE_KEY = 'test_key';
const USER_ID = 1;
const MOCK_TOKEN = 'MOCK_TOKEN';

jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => MOCK_TOKEN),
    verify: jest.fn(() => ({
      id: USER_ID,
    })),
  };
});

describe('JwtService', () => {
  let service: JwtService;
  beforeEach(async () => {
    const modules = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: CONFIG_OPTIONS,
          useValue: { privateKey: TEST_PRIVATE_KEY },
        },
      ],
    }).compile();
    service = modules.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('JWT sign', () => {
    it('should sign and return value with JWT', () => {
      const token = service.sign({ id: USER_ID });
      expect(token).toEqual(MOCK_TOKEN);
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith({ id: USER_ID }, TEST_PRIVATE_KEY);
    });
  });

  describe('JWT verify', () => {
    it('should verify and return the decoded JWT', () => {
      const decodedToken = service.verify(MOCK_TOKEN);
      expect(decodedToken).toEqual({ id: USER_ID });
      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith(MOCK_TOKEN, TEST_PRIVATE_KEY);
    });
  });
});
