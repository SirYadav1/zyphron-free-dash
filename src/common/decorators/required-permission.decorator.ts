import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSION_KEY = 'required_permission';
export const RequiredPermission = (permission: string) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission);
