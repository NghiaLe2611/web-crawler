import {
	Injectable,
	NestMiddleware,
	UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response, NextFunction } from 'express';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService,
	) {}

	async use(req: Request, res: Response, next: NextFunction) {
		try {
			// Private route
			const token = req.headers['authorization']?.split(' ')[1];
			if (!token) {
				throw new UnauthorizedException('No token provided');
			}

			const verifyResponse = await firstValueFrom(
				this.httpService.post(
					`${this.configService.get('AUTH_SERVICE_URL')}/admin/verify`,
					{},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				),
			);

			const user = verifyResponse.data;

			if (!user) {
				throw new UnauthorizedException();
			}

			// Attach user data to request
			req['user'] = user;
			return next();
		} catch (err) {
			throw new UnauthorizedException(
				err.message || 'Authentication failed',
			);
		}
	}
}
