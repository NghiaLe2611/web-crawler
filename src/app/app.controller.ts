import { Controller, Get, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	async getStatus(@Req() req: Request, @Res() res: Response) {
		// Inject Request object
		try {
			// const data = await this.appService.getHello();
			// Access request properties (if needed)
			return res.json({
				statusCode: HttpStatus.OK,
				message: 'OK',
				env: process.env.NODE_ENV || 'development',
				user: process.env.TEST_USER || null,
			});
		} catch (err) {
			return res.json({
				statusCode: HttpStatus.BAD_REQUEST,
				message: 'error',
			});
		}
	}

	@MessagePattern({ cmd: 'get_data' })
	getData(data: any) {
		console.log('Retrieving:', data);
		return { status: 'ok' };
	}
}
