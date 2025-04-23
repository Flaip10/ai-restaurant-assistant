import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../../user/user.entity';

export const CurrentUser = createParamDecorator<
  unknown,
  ExecutionContext,
  Omit<User, 'password'>
>((data: unknown, context: ExecutionContext) => {
  const ctx = GqlExecutionContext.create(context);
  const req = ctx.getContext().req;
  return req.user;
});
