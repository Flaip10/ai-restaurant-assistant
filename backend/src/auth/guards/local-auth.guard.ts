import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor() {
    super();
  }

  getRequest(context: ExecutionContext): Request {
    const ctx = GqlExecutionContext.create(context);
    const gqlReq = ctx.getContext().req;
    const input = ctx.getArgs().input;

    if (input) {
      gqlReq.body = {
        email: input.email,
        password: input.password,
      };
    }

    return gqlReq;
  }
}
