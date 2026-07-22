import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    updateDepartment: jest.fn(),
    updateRole: jest.fn(),
    updateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getProfile', async () => {
    mockUsersService.getProfile.mockResolvedValue({ id: 'u1' });
    const res = await controller.getProfile('u1');
    expect(res).toEqual({ id: 'u1' });
  });

  it('updateProfile', async () => {
    mockUsersService.updateProfile.mockResolvedValue({ id: 'u1' });
    const res = await controller.updateProfile('u1', { name: 'Jane' });
    expect(res).toEqual({ id: 'u1' });
  });

  it('changePassword', async () => {
    mockUsersService.changePassword.mockResolvedValue({ message: 'Success' });
    const res = await controller.changePassword('u1', { currentPassword: 'a', newPassword: 'b' });
    expect(res).toEqual({ message: 'Success' });
  });

  it('findAll', async () => {
    mockUsersService.findAll.mockResolvedValue({ data: [] });
    const res = await controller.findAll({});
    expect(res).toEqual({ data: [] });
  });

  it('findOne', async () => {
    mockUsersService.findOne.mockResolvedValue({ id: 'u1' });
    const res = await controller.findOne('u1');
    expect(res).toEqual({ id: 'u1' });
  });

  it('updateStatus', async () => {
    mockUsersService.updateStatus.mockResolvedValue({ id: 'u1', isActive: false });
    const res = await controller.updateStatus('u1', { isActive: false });
    expect(res.isActive).toBe(false);
  });

  it('updateDepartment', async () => {
    mockUsersService.updateDepartment.mockResolvedValue({ id: 'u1', department: 'SDR' });
    const res = await controller.updateDepartment('u1', { department: 'SDR' });
    expect(res.department).toBe('SDR');
  });

  it('updateRole', async () => {
    mockUsersService.updateRole.mockResolvedValue({ id: 'u1', role: Role.ADMIN });
    const res = await controller.updateRole('u1', Role.ADMIN);
    expect(res.role).toBe(Role.ADMIN);
  });

  it('updateUser', async () => {
    mockUsersService.updateUser.mockResolvedValue({ id: 'u1', name: 'New' });
    const res = await controller.updateUser('u1', { name: 'New' });
    expect(res).toEqual({ id: 'u1', name: 'New' });
  });
});
