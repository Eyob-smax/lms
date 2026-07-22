import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '@prisma/client';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register()', () => {
    it('should delegate registration to AuthService', async () => {
      const dto = {
        email: 'it.user@bpo.com',
        name: 'IT Admin',
        password: 'password123',
        role: Role.ADMIN,
        department: 'IT',
      };
      const expectedResponse = { accessToken: 'jwt-123', user: { id: '1', ...dto } };

      mockAuthService.register.mockResolvedValue(expectedResponse);

      const response = await authController.register(dto);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('login()', () => {
    it('should delegate login to AuthService', async () => {
      const dto = { email: 'it.user@bpo.com', password: 'password123' };
      const expectedResponse = { accessToken: 'jwt-123', user: { id: '1', email: dto.email } };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      const response = await authController.login(dto);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('getProfile()', () => {
    it('should return current logged in user from decorator', async () => {
      const currentUser = { id: 'user-1', email: 'test@bpo.com', role: Role.AGENT };
      const result = await authController.getProfile(currentUser);
      expect(result).toEqual(currentUser);
    });
  });
});
