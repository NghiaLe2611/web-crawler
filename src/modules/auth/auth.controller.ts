import {
	Controller,
	Post,
	Body,
	HttpStatus,
	HttpException,
	Get,
	UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
// import { AuthGuard } from '@/guards/auth.guard';
import { PermissionGuard } from '@/guards/permission.guard';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	// @Get('secure')
	// @UseGuards(PermissionGuard)
	// getSecureData() {
	// 	return { message: 'Secure Data' };
	// }

	@Get('login')
	async getLogin() {
		return {
			status: HttpStatus.OK,
			message: 'Test login OK !',
		};
	}

	@Post('login')
	async login(@Body() loginDto: LoginDto) {
		try {
			const result = await this.authService.login(loginDto);
			return {
				status: HttpStatus.OK,
				message: 'Login successfully !',
				access_token: result.accessToken,
			};
		} catch (error) {
			if (error.response && error.response.status === 401) {
				throw new HttpException(
					{
						status: HttpStatus.UNAUTHORIZED,
						message: 'Unauthorized',
					},
					HttpStatus.UNAUTHORIZED,
				);
			}
			throw new HttpException(
				{
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					message: error?.message || 'Internal server error',
				},
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
