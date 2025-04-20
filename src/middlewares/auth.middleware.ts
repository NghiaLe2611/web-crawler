import {
	ForbiddenException,
	Inject,
	Injectable,
	NestMiddleware,
	UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NextFunction, Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
	constructor(
		@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
	) {}

	async use(req: Request, res: Response, next: NextFunction) {
		try {
			// Check is public route
			const appName = req.headers['app-name'] ?? 'lottery';
			const method: string = req.method.toLowerCase();
			const fullPath: string = this.normalizePath(req.baseUrl + req.path);
			const permissionkey = appName
				? `${appName}_${method}:${fullPath}`
				: `${method}:${fullPath}`;
			const isPublicResponse = await firstValueFrom(
				this.authClient.send(
					{ cmd: 'check_route' },
					{ path: permissionkey },
				),
			);

			if (isPublicResponse?.isPublic === true) {
				return next();
			}

			// Check user
			const token = req.headers['authorization']?.split(' ')[1];

			if (!token) {
				throw new UnauthorizedException('No token provided');
			}

			const user = await firstValueFrom(
				this.authClient.send({ cmd: 'verify_user' }, { token }),
			);

			if (!user) {
				throw new UnauthorizedException();
			}

			req['user'] = user;

			if (!user.isActive) {
				throw new ForbiddenException('User is inactive');
			}

			// Admin
			if (['super-admin', 'admin'].includes(user.role)) {
				return next();
			}
			// Check detail permissions
			const permissions: string[] = user.permissions || [];
			const checkPermission = this.isPublicRoute(
				permissionkey,
				permissions,
			);

			if (!checkPermission) {
				throw new ForbiddenException(
					`You do not have permission: ${permissionkey}`,
				);
			}

			return next();
		} catch (err) {
			if (
				err instanceof UnauthorizedException ||
				err instanceof ForbiddenException
			) {
				throw err;
			}
			throw new ForbiddenException(
				'Authentication or permission check failed',
			);
		}
	}

	normalizePath(path: string): string {
		if (path.length > 1 && path.endsWith('/')) {
			return path.slice(0, -1);
		}
		return path;
	}

	isPublicRoute(key: string, permissionData: string[]): boolean {
		const exactMatch = permissionData.find((item) => item === key);
		if (exactMatch) return true;

		// Check wildcard matches
		for (const item of permissionData) {
			if (item.includes('*')) {
				const pattern = item.replace('*', '(.*)');
				const regex = new RegExp(`^${pattern}$`);

				if (regex.test(key)) {
					return true;
				}
			}
		}

		return false;
	}
}
