import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Role } from '../enums/roles.enum';
import { Reflector } from '@nestjs/core';
import { AccessControlService } from '../../ac/ac.service';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../decorators/roles.decorator';

export class TokenDto {
    id: number;
    email: string;
    role: Role;
}

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private accessControlService: AccessControlService,
    ) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        const request: { user: TokenDto } = context.switchToHttp().getRequest();
        const token = request['user'];

        for (const role of requiredRoles) {
            const result = this.accessControlService.isAuthorized({
                requiredRole: role,
                currentRole: token.role,
            });

            if (result) return true;
        }

        return false;
    }
}
