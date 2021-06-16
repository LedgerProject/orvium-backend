import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Auth0UserProfile } from 'auth0-js';

export const User = createParamDecorator<Auth0UserProfile>(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
