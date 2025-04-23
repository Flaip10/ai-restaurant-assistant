import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SessionService } from './session.service';
import expressSession from 'express-session';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  private readonly sessionMiddleware: ReturnType<typeof expressSession>;

  constructor(private readonly sessionService: SessionService) {
    this.sessionMiddleware = expressSession(
      this.sessionService.getSessionConfig(),
    );
  }

  use(req: Request, res: Response, next: NextFunction): void {
    this.sessionMiddleware(req, res, next);
  }
}
