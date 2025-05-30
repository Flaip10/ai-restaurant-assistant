import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User, UserResponse } from './user.entity';
import { CreateUserInput, UpdateUserInput } from './user.inputs';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [UserResponse])
  // @UseGuards(AuthGuard) // TODO: Add auth guard
  async users(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userService.findAll();
    return users;
  }

  @Mutation(() => UserResponse)
  // @UseGuards(AuthGuard) // TODO: Add auth guard
  async createUser(
    @Args('input') input: CreateUserInput,
  ): Promise<Omit<User, 'password'>> {
    return this.userService.createUser(
      input.username,
      input.email,
      input.password,
      input.role,
    );
  }

  @Mutation(() => UserResponse)
  // @UseGuards(AuthGuard) // TODO: Add auth guard
  async updateUser(
    @Args('username') username: string,
    @Args('input') input: UpdateUserInput,
  ): Promise<Omit<User, 'password'>> {
    return await this.userService.updateUser(username, input);
  }
}
