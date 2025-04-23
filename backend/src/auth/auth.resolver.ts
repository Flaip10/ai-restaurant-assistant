import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginResponse } from './dto/login-response.dto';
import { LoginInput } from './dto/login-input.dto';
import { User } from '../user/user.entity';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { LogoutInput } from './dto/logout.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => LoginResponse)
  @UseGuards(LocalAuthGuard)
  async login(
    @Args('input') input: LoginInput,
    @CurrentUser() user: Omit<User, 'password'>,
  ): Promise<LoginResponse> {
    return this.authService.login(user);
  }

  @Mutation(() => LoginResponse, { nullable: true })
  async refresh(
    @Args('input') input: RefreshTokenInput,
  ): Promise<LoginResponse | null> {
    return this.authService.refreshSession(input.refreshToken);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async logout(@Args('input') input: LogoutInput): Promise<boolean> {
    await this.authService.logout(input.refreshToken);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @CurrentUser() user: Omit<User, 'password'>,
  ): Promise<boolean> {
    await this.authService.logoutAll(user.id);
    return true;
  }
}
