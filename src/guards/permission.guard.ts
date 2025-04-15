// src/common/guards/permission.guard.ts

import { HttpService } from '@nestjs/axios';
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PermissionGuard implements CanActivate {
	constructor(
		// private reflector: Reflector,
		private readonly httpService: HttpService,
		private readonly configService: ConfigService,
	) {}

	async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();
		const appName: string = request.headers['app-name'] ?? 'lottery';
		const method: string = request.method.toLowerCase();
		const url: string = request.path;
		const permissionkey = appName
			? `${appName}_${method}:${url}`
			: `${method}:${url}`;

		const user = request.user;

		if (!user) {
			throw new UnauthorizedException('User is not authenticated');
		}

		if (!user.isActive) {
			throw new ForbiddenException('User is inactive');
		}

		try {
            // Check route is public
			const res: any = await firstValueFrom(
				this.httpService.get(
					`${this.configService.get('AUTH_SERVICE_URL')}/permission/isPublic?path=${permissionkey}`,
				),
			);

            if (res?.data.isPublic === true) {
				return true;
			}

			// Have all permissions
			if (['super-admin', 'admin'].includes(user.role)) {
				return true;
			}

			// Check permission
			const permissions: string[] = user.permissions || [];
			if (!permissions.includes(permissionkey)) {
				throw new ForbiddenException(
					`You do not have permission: ${permissionkey}`,
				);
			}

			return true;
		} catch (err) {
            // console.log(123, err);
			throw new ForbiddenException('Permission check failed');
		}
	}
}
