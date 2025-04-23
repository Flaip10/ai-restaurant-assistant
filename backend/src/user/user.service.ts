import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { UpdateUserInput } from './user.inputs';

@Injectable()
export class UserService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find();
    return users.map(({ password, ...user }) => user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async createUser(
    username: string,
    password: string,
    role: UserRole = 'staff',
  ): Promise<Omit<User, 'password'>> {
    // Check if user already exists
    const existingUser = await this.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create new user
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      role,
    });

    // Save and return the user (excluding password)
    const savedUser = await this.userRepository.save(user);
    const { password: omitted, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async updateUser(
    username: string,
    input: UpdateUserInput,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (input.password) {
      input.password = await bcrypt.hash(input.password, this.SALT_ROUNDS);
    }

    Object.assign(user, input);
    const savedUser = await this.userRepository.save(user);
    const { password: omitted, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.findByUsername(username);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Return user without password
    const { password: omitted, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
