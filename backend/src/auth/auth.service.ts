import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.entity';
import { SessionService } from './session/session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.userService.findByUsername(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: Omit<User, 'password'>): Promise<{
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    // Create access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m', // Short-lived access token
    });

    // Create refresh token
    const refreshToken = await this.sessionService.createRefreshToken(user);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refreshSession(refreshToken: string): Promise<{
    user: Omit<User, 'password'>;
    accessToken: string;
    newRefreshToken: string;
  } | null> {
    const tokenData =
      await this.sessionService.validateRefreshToken(refreshToken);
    if (!tokenData) {
      return null;
    }

    // Revoke the old refresh token
    await this.sessionService.revokeRefreshToken(refreshToken);

    // Get user data
    const user = await this.userService.findById(tokenData.userId);
    if (!user) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;

    // Create new tokens
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const newRefreshToken =
      await this.sessionService.createRefreshToken(userWithoutPassword);

    return {
      user: userWithoutPassword,
      accessToken,
      newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessionService.revokeRefreshToken(refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessionService.revokeAllUserRefreshTokens(userId);
  }
}
