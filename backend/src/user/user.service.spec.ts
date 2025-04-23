import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { UserService } from './user.service';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const username = 'testuser';
      const password = 'password123';
      const role: UserRole = 'staff';

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({
        username,
        password: 'hashedPassword',
        role,
      });
      mockRepository.save.mockResolvedValue({
        id: 1,
        username,
        password: 'hashedPassword',
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createUser(username, password, role);

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('username', username);
      expect(result).toHaveProperty('role', role);
    });

    it('should throw ConflictException if username exists', async () => {
      const username = 'existinguser';
      mockRepository.findOne.mockResolvedValue({ username });

      await expect(service.createUser(username, 'password')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      const username = 'testuser';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const mockUser = {
        id: 1,
        username,
        password: hashedPassword,
        role: 'staff' as UserRole,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(username, password);

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('username', username);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const username = 'testuser';
      const hashedPassword = await bcrypt.hash('correctpassword', 10);

      mockRepository.findOne.mockResolvedValue({
        username,
        password: hashedPassword,
      });

      const result = await service.validateUser(username, 'wrongpassword');

      expect(result).toBeNull();
    });
  });
});
