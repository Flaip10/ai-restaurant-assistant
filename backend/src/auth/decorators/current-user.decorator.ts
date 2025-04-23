import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../../user/user.entity';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): Omit<User, 'password'> => {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    return req.user;
  },
);
