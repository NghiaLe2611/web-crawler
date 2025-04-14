import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AuthService {
	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService,
		@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
	) {}

	// async login(loginDto: LoginDto) {
	// 	try {
	// 		const { email, password } = loginDto;

	// 		const { data } = await firstValueFrom(
	// 			this.httpService.post(
	// 				`${this.configService.get('AUTH_SERVICE_URL')}/admin/login`,
	// 				{
	// 					username: email,
	// 					password,
	// 				},
	// 				{
	// 					headers: {
	// 						'Content-Type': 'application/json',
	// 					},
	// 				},
	// 			),
	// 		);

	// 		return { accessToken: data.accessToken };
	// 	} catch (error) {
	// 		throw error;
	// 	}
	// }

	async login(loginDto: LoginDto) {
		const { email, username, password } = loginDto;
		try {
			const submitData = username
				? {
						username,
						password,
					}
				: {
						email,
						password,
					};
			const result = await firstValueFrom(
				this.authClient.send({ cmd: 'login' }, submitData),
			);

			if (result.statusCode === HttpStatus.OK) {
				return result;
			}

			throw new HttpException(
				result.message || 'Authentication failed',
				result.status || HttpStatus.UNAUTHORIZED,
			);
		} catch (err) {
			if (err instanceof HttpException) {
				throw err;
			} else {
				throw new HttpException(
					'Authentication service unavailable',
					HttpStatus.SERVICE_UNAVAILABLE,
				);
			}
		}
	}
}
