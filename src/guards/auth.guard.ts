import { getExpireTime } from '@/utils';
import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const authHeader = request.headers?.authorization;
		const cookie = request.cookies?.access_token;

		const token = authHeader ? authHeader.split(' ')[1] : cookie || null;
		const decodedToken = token ? jwt.decode(token) : null;

		if (!token || !decodedToken) {
			throw new UnauthorizedException('You are not authenticated');
		}

		const role = (decodedToken as any).role;
		if (role !== 'admin' && role !== 'super-admin') return false;

		return getExpireTime(token);
	}
}
