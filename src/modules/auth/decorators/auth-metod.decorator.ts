import { SetMetadata } from '@nestjs/common';

export const AUTH_METHOD_KEY = 'authMethod';

export type AuthMethod = 'jwt' | 'api-key' | 'any';

export const AuthMethod = (method: AuthMethod) => SetMetadata(AUTH_METHOD_KEY, method);
