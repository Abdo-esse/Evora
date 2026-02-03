import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorators/role.decorators';
import { Role } from '../enums/role';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(Roles, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles?.length) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) return false;

        // si ton user a un seul role: user.role
        return requiredRoles.includes(user.role as Role);

        // si ton user a plusieurs roles: user.roles (array)
        // return requiredRoles.some((r) => user.roles?.includes(r));
    }
}
