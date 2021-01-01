import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/dtos/role.dto';

export type AllowedRoles = keyof typeof UserRole | 'Any';

export const Role = (roles: string[]) => SetMetadata('roles', roles);
