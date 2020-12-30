import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { UserRole } from './dtos/role.dto';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UsersService } from './users.service';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => 'test-signed-token'),
  verify: jest.fn(),
});

const mockMailService = () => ({
  sendVerificationEmail: jest.fn(),
});

const mockedUser = {
  email: 'abc@abc.com',
  password: 'password_that_hashed_by_bcrypt',
  role: UserRole.Client,
  verified: true,
};
const mockedErrorText = 'This is Error Text for Mock :)';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UsersService', () => {
  let service: UsersService;
  let mailService: MailService;
  let jwtService: JwtService;

  let usersRepository: MockRepository<User>;
  let verificationsRepository: MockRepository<Verification>;

  beforeEach(async () => {
    const modules = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
        {
          provide: MailService,
          useValue: mockMailService(),
        },
      ],
    }).compile();
    service = modules.get<UsersService>(UsersService);
    mailService = modules.get<MailService>(MailService);
    jwtService = modules.get<JwtService>(JwtService);

    usersRepository = modules.get(getRepositoryToken(User));
    verificationsRepository = modules.get(getRepositoryToken(Verification));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  // it.todo('userAccount');

  describe('createAccount', () => {
    const mockAccount = {
      email: 'abc@abc.com',
      password: '1234',
    };
    const createAccountArgs = {
      email: mockAccount.email,
      password: mockAccount.password,
      role: UserRole.Client,
    };

    it('should FAIL if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: mockAccount.email,
      });
      const result = await service.createAccount(createAccountArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.any(String),
        }),
        expect.objectContaining({
          select: expect.any(Array),
        }),
      );
      expect(result).toMatchObject({
        result: false,
        error: 'There is an user with that email already.',
      });
    });

    it('should create a new user', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArgs);
      usersRepository.save.mockResolvedValue(createAccountArgs);
      verificationsRepository.create.mockReturnValue({
        user: createAccountArgs,
      });
      verificationsRepository.save.mockResolvedValue({ code: 'code' });
      const result = await service.createAccount(createAccountArgs);
      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);
      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });
      expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.save).toHaveBeenCalledWith({
        user: createAccountArgs,
      });
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
      expect(result).toEqual({ result: true });
    });

    it('should FAIL on Exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error(mockedErrorText));
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({
        result: false,
        error: `Could not create an account. Error: ${mockedErrorText}`,
      });
    });
  });

  describe('updateAccount', () => {
    // You should spread the items in to parameters when you test service.
    it('should change email', async () => {
      const oldUser = {
        email: 'abc@old.user',
        role: UserRole.Client,
        verified: true,
      };
      const updateAccoutArgs = {
        id: 1,
        input: {
          email: mockedUser.email,
        },
      };
      const newVerification = {
        code: '12345',
      };
      const newUser = {
        verified: false,
        email: updateAccoutArgs.input.email,
        role: UserRole.Client,
      };

      usersRepository.findOne.mockResolvedValue(oldUser);
      verificationsRepository.create.mockReturnValue(newVerification);
      verificationsRepository.save.mockResolvedValue(newVerification);

      const result = await service.updateAccount(
        updateAccoutArgs.id,
        updateAccoutArgs.input,
      );
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        id: updateAccoutArgs.id,
      });
      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: newUser,
      });
      expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.save).toHaveBeenCalledWith(
        newVerification,
      );
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUser.email,
        newVerification.code,
      );
      expect(result).toEqual({ result: true });
    });

    it('should change password', async () => {
      const oldUser = {
        email: 'abc@old.user',
        role: UserRole.Client,
        verified: true,
      };
      const updateAccoutArgs = {
        id: 1,
        input: {
          password: mockedUser.password,
        },
      };
      usersRepository.findOne.mockResolvedValue(oldUser);
      const result = await service.updateAccount(
        updateAccoutArgs.id,
        updateAccoutArgs.input,
      );
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        id: updateAccoutArgs.id,
      });

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({
        ...oldUser,
        password: mockedUser.password,
      });
      expect(result).toEqual({ result: true });
    });

    it('should FAIL on Exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error(mockedErrorText));
      const result = await service.updateAccount(1, {
        email: mockedUser.email,
        password: mockedUser.password,
      });
      expect(result).toEqual({
        result: false,
        error: `Could not update user. Error: ${mockedErrorText}`,
      });
    });
  });

  describe('deleteAccount', () => {
    it('should delete if user exists', async () => {
      usersRepository.delete.mockResolvedValue({ affected: 1 });
      const result = await service.deleteAccount(1);

      expect(usersRepository.delete).toHaveBeenCalledTimes(1);
      expect(usersRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ result: true });
    });

    it('should FAIL on Exception', async () => {
      usersRepository.delete.mockRejectedValue(new Error(mockedErrorText));
      const result = await service.deleteAccount(1);
      expect(result).toEqual({
        result: false,
        error: `Could not delete user. Error: ${mockedErrorText}`,
      });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'abc@abc.com',
      password: '1234',
    };
    it('should FAIL if user does not exists', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      const result = await service.login(loginArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(result).toMatchObject({
        result: false,
        error: 'User does not found.',
      });
    });

    it('should FAIL if password does not match', async () => {
      const mockedUser = {
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(result).toMatchObject({
        result: false,
        error: 'Password does not match.',
      });
    });

    it('should login existing user', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.any(Number) }),
      );
      expect(result).toMatchObject({
        result: true,
        token: mockJwtService().sign(),
      });
    });

    it('should FAIL on Exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error(mockedErrorText));
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        result: false,
        error: `Could not login. Error: ${mockedErrorText}`,
      });
    });
  });
  describe('findById', () => {
    const findByIdArgs = 1;
    it('should FAIL if user does not exists', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      const result = await service.findById(findByIdArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.any(Number) }),
      );
      expect(result).toMatchObject({
        result: false,
        error: `Could not find user have id: ${findByIdArgs}`,
      });
    });

    it('should return user', async () => {
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.findById(findByIdArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.any(Number) }),
      );
      expect(result).toStrictEqual({
        result: true,
        user: mockedUser,
      });
    });

    it('should FAIL on Exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error(mockedErrorText));
      const result = await service.findById(findByIdArgs);
      expect(result).toStrictEqual({
        result: false,
        error: `Could not find user. Error: ${mockedErrorText}`,
      });
    });
  });
  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const mockedVerification = {
        user: {
          verified: false,
        },
        id: 1,
      };
      verificationsRepository.findOne.mockResolvedValue(mockedVerification);
      const result = await service.verifyEmail('test_code');
      expect(verificationsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({ verified: true });
      expect(verificationsRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.delete).toHaveBeenCalledWith(
        mockedVerification.id,
      );
      expect(result).toEqual({ result: true });
    });
    it('should FAIL on verification not Found', async () => {
      verificationsRepository.findOne.mockResolvedValue(undefined);
      const result = await service.verifyEmail('test_code');
      expect(result).toEqual({
        result: false,
        error: `Could not verify user. Error: Cannot find Verification.`,
      });
    });
    it('should FAIL on Exception', async () => {
      verificationsRepository.findOne.mockRejectedValue(
        new Error(mockedErrorText),
      );
      const result = await service.verifyEmail('test_code');
      expect(result).toEqual({
        result: false,
        error: `Could not verify user. Error: ${mockedErrorText}`,
      });
    });
  });
});
