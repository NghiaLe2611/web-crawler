import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService,
	) {}

	async login(loginDto: LoginDto) {
		try {
			const { email, password } = loginDto;

			const { data } = await firstValueFrom(
				this.httpService.post(
					`${this.configService.get('AUTH_SERVICE_URL')}/admin/login`,
					{
						username: email,
						password,
					},
					{
						headers: {
							'Content-Type': 'application/json',
						},
					},
				),
			);

			return { accessToken: data.accessToken };
		} catch (error) {
			throw error;
		}
	}
}
