import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.types';
import { CreateUserInput, UpdateUserInput } from './user.inputs';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User])
  // @UseGuards(AuthGuard) // TODO: Add auth guard
  async users(): Promise<User[]> {
    const users = await this.userService.findAll();
    return users;
  }

  @Mutation(() => User)
  // @UseGuards(AuthGuard) // TODO: Add auth guard
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    return this.userService.createUser(
      input.username,
      input.password,
      input.role,
    );
  }

  @Mutation(() => User)
  // @UseGuards(AuthGuard) // TODO: Add auth guard
  async updateUser(
    @Args('username') username: string,
    @Args('input') input: UpdateUserInput,
  ): Promise<User> {
    return await this.userService.updateUser(username, input);
  }
}
