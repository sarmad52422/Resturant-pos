import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  id: string;
  username: string;
  name: string;
  roleId: string;
  role: string;
  permissions: string[];
}

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
  return request.user;
});
