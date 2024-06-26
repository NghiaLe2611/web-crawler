import { Controller, Get, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	async getHello(@Req() req: Request, @Res() res: Response) {
		// Inject Request object
		try {
			// const data = await this.appService.getHello();
			// Access request properties (if needed)
            return res.json({
                status: HttpStatus.OK,
                message: 'OK',
				env: process.env.NODE_ENV || 'development',
				user: process.env.TEST_USER || null
            });
		} catch (err) {
            return res.json({
                status: HttpStatus.BAD_REQUEST,
                message: 'error'
            });
		}
	}

	@Get('test')
	create(@Res() res: Response) {
        return res.send('haha');
		return res.status(HttpStatus.CREATED).send();
	}

	// getHello(): object {
	// 	return this.appService.getHello();
	// }
}
