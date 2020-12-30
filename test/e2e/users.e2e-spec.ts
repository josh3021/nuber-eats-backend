import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import MockDate from 'mockdate';
import { Verification } from 'src/users/entities/verification.entity';
import * as request from 'supertest';
import { getConnection, Repository } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/users/entities/user.entity';
import { GRAPHQL_ENDPOINT } from './dtos/endpoint.constants';

const MOCK_ID = 1;
const MOCK_EMAIL = 'abc@abc.com';
const MOCK_PASSWORD = 'abcdef';
const MOCK_ROLE = 'Client';

jest.mock('got', () => ({
  post: jest.fn(),
}));

describe('UsersModule (e2e)', () => {
  let app: INestApplication;
  let loginToken: string;
  let usersRepository: Repository<User>;
  let verificationsRepository: Repository<Verification>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    usersRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    verificationsRepository = moduleFixture.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    MockDate.set('2020-12-26');
    await app.init();
  });

  afterAll(async () => {
    MockDate.reset();
    await getConnection().dropDatabase();
    await app.close();
  });
  describe('createAccount', () => {
    it('should create an user', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            mutation {
              createAccount(input:{
                email:"${MOCK_EMAIL}",
                password:"${MOCK_PASSWORD}",
                role:Client
              }) {
                result
                error
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;
          expect(createAccount.result).toBe(true);
          expect(createAccount.error).toEqual(null);
        });
    });

    it('should FAIL if account already exists', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            mutation {
              createAccount(input:{
                email:"${MOCK_EMAIL}",
                password:"${MOCK_PASSWORD}",
                role:Client
              }) {
                result
                error
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;
          expect(createAccount.result).toBe(false);
          expect(createAccount.error).toEqual(
            'There is an user with that email already.',
          );
        });
    });
  });
  describe('login', () => {
    it('should login with correct credentials.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            mutation {
              login(input:{
                email:"${MOCK_EMAIL}",
                password:"${MOCK_PASSWORD}"
              }) {
                result
                error
                token
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.result).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          loginToken = login.token;
        });
    });

    it('should FAIL login with wrong email', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            mutation {
              login(input:{
                email:"wrong_email",
                password:"wrong_password"
              }) {
                result
                error
                token
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.result).toBe(false);
          expect(login.error).toBe('User does not found.');
          expect(login.token).toBe(null);
        });
    });
    it('should FAIL login with wrong password.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            mutation {
              login(input:{
                email:"${MOCK_EMAIL}",
                password:"wrong_password"
              }) {
                result
                error
                token
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.result).toBe(false);
          expect(login.error).toBe('Password does not match.');
          expect(login.token).toBe(null);
        });
    });
  });
  describe('userAccount', () => {
    let id: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      id = user.id;
    });
    it('should return existing user', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', loginToken)
        .send({
          query: `
            {
              userAccount(id:${id}) {
                result
                error
                user {
                  id
                  email
                  role
                  verified
                }
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { userAccount },
            },
          } = res;
          expect(userAccount.result).toBe(true);
          expect(userAccount.error).toBe(null);
          expect(userAccount.user).toEqual({
            id: 1,
            email: MOCK_EMAIL,
            role: MOCK_ROLE,
            verified: false,
          });
        });
    });

    it('should FAIL when user does not exists', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', loginToken)
        .send({
          query: `
            {
              userAccount(id:10) {
                result
                error
                user {
                  id
                  email
                  role
                  verified
                }
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { userAccount },
            },
          } = res;
          expect(userAccount.result).toBe(false);
          expect(userAccount.error).toBe('Could not find user have id: 10');
        });
    });
  });
  describe('me', () => {
    it('should return me', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', loginToken)
        .send({
          query: `
            {
              me {
                id
                email
                role
                verified
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { me },
            },
          } = res;
          expect(me).toMatchObject({
            id: MOCK_ID,
            email: MOCK_EMAIL,
            role: MOCK_ROLE,
            verified: false,
          });
        });
    });

    it('should NOT return user if not logged in', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          {
            me {
              id
              email
              role
              verified
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: { errors },
          } = res;
          const [error] = errors;
          expect(error.message).toBe('Forbidden resource');
        });
    });
  });
  describe('updateAccount', () => {
    const NEW_EMAIL = 'abcd@abcd.com';
    it('should change email', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', loginToken)
        .send({
          query: `
            mutation {
              updateAccount(input:{
                email:"${NEW_EMAIL}"
              }) {
                result
                error
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { updateAccount },
            },
          } = res;
          expect(updateAccount.result).toBe(true);
          expect(updateAccount.error).toBe(null);
        });
    });

    it('should return updated account', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', loginToken)
        .send({
          query: `
                {
                  me {
                    id
                    email
                    role
                    verified
                  }
                }
              `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { me },
            },
          } = res;
          expect(me).toMatchObject({
            id: MOCK_ID,
            email: NEW_EMAIL,
            role: MOCK_ROLE,
            verified: false,
          });
        });
    });

    it.todo('should change password');
  });
  describe('verifyEmail', () => {
    let verificationCode;
    beforeAll(async () => {
      const [verification] = await verificationsRepository.find();
      verificationCode = verification.code;
    });

    it('should verify user', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            mutation {
              verifyEmail(input:{
                code: "${verificationCode}"
              }) {
                result
                error
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { verifyEmail },
            },
          } = res;
          expect(verifyEmail.result).toBe(true);
          expect(verifyEmail.error).toBe(null);
        });
    });

    it('should NOT verify user', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
            mutation {
              verifyEmail(input:{
                code: "123456"
              }) {
                result
                error
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { verifyEmail },
            },
          } = res;
          expect(verifyEmail.result).toBe(false);
          expect(verifyEmail.error).toBe(
            'Could not verify user. Error: Cannot find Verification.',
          );
        });
    });
  });
  describe('deleteAccount', () => {
    it('should delete account', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', loginToken)
        .send({
          query: `
            mutation {
              deleteAccount {
                result
                error
              }
            }
            `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { deleteAccount },
            },
          } = res;
          expect(deleteAccount.result).toBe(true);
          expect(deleteAccount.error).toBe(null);
        });
    });

    // it('should FAIL on delete account', () => {
    //   return request(app.getHttpServer())
    //     .post(GRAPHQL_ENDPOINT)
    //     .send({
    //       query: `
    //         mutation {
    //           deleteAccount {
    //             result
    //             error
    //           }
    //         }
    //         `,
    //     })
    //     .expect(200)
    //     .expect((res) => {
    //       const {
    //         body: {
    //           data: { deleteAccount },
    //         },
    //       } = res;
    //       expect(deleteAccount.result).toBe(false);
    //       expect(deleteAccount.error).toBe('null');
    //     });
    // });
  });
});
