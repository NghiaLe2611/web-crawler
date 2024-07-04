import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { PredictService } from './predict.service';

@Controller('predict')
export class PredictController {
	constructor(private readonly predictService: PredictService) {}

	@Get()
	async predict(
		@Body() data: Array<[]>,
        @Res() res:any
	) {
		const input = [1, 2, 3, 4, 100];
		const result = await this.predictService.predictLottery(input);
        return res.status(200).json({
            data: result
        })
	}
}
