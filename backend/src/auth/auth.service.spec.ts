import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: any;
  let jwtMock: any;

  beforeEach(async () => {
    // Mocks
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    jwtMock = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'hashed',
        role: 'PARTICIPANT',
      });

      const dto = {
        email: 'test@test.com',
        password: '123456',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await service.register(dto);

      expect(result.user.email).toBe(dto.email);
      expect(result.user.firstName).toBe(dto.firstName);
      expect(prismaMock.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ email: 'test@test.com' });
      const dto = { email: 'test@test.com', password: '123', firstName: 'J', lastName: 'D' };

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const userFromDb = { id: 1, email: 'test@test.com', password: 'hashed', role: 'PARTICIPANT', firstName: 'John', lastName: 'Doe' };
      prismaMock.user.findUnique.mockResolvedValue(userFromDb);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtMock.sign.mockReturnValue('jwt_token');

      const result = await service.login({ email: 'test@test.com', password: '123456' });

      expect(result.user.email).toBe('test@test.com');
      expect(result.accessToken).toBe('jwt_token');
      expect(result.refreshToken).toBe('jwt_token');
      expect(prismaMock.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'x@x.com', password: '123' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      const userFromDb = { id: 1, email: 'test@test.com', password: 'hashed', role: 'PARTICIPANT' };
      prismaMock.user.findUnique.mockResolvedValue(userFromDb);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete refresh token successfully', async () => {
      jwtMock.verify.mockReturnValue({ sub: 1 });
      prismaMock.refreshToken.delete.mockResolvedValue(true);

      const result = await service.logout('refreshToken');

      expect(result).toBe(true);
      expect(prismaMock.refreshToken.delete).toHaveBeenCalledWith({ where: { token: 'refreshToken' } });
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const user = { id: 1, email: 'test@test.com', role: 'PARTICIPANT' };
      prismaMock.refreshToken.findUnique.mockResolvedValue({ token: 'oldToken' });
      jwtMock.verify.mockReturnValue({ sub: 1 });
      prismaMock.user.findUnique.mockResolvedValue(user);
      jwtMock.sign.mockReturnValue('newToken');
      prismaMock.refreshToken.update.mockResolvedValue(true);

      const result = await service.refresh('oldToken');

      expect(result.accessToken).toBe('newToken');
      expect(result.refreshToken).toBe('newToken');
      expect(prismaMock.refreshToken.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if refresh token not found', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('wrongToken')).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if refresh token invalid', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({ token: 'token' });
      jwtMock.verify.mockImplementation(() => { throw new Error('invalid'); });

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({ token: 'token' });
      jwtMock.verify.mockReturnValue({ sub: 99 });
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh('token')).rejects.toThrow(NotFoundException);
    });
  });
});
