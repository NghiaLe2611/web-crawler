import {
	Body,
	Controller,
	Get,
	HttpException,
	HttpStatus,
	Post,
	Req,
	Res,
} from '@nestjs/common';
import { PredictService } from './predict.service';
import { commonErrorMsg, defaultPredictParams } from 'src/constants';

@Controller('predict')
export class PredictController {
	constructor(private readonly predictService: PredictService) {}

	@Post('/train')
	async trainModel(
		@Body('data') lotteryHistory: number[][],
		@Body('optimizer') optimizer: string,
		@Body('loss') loss: string,
		@Body('epochs') epochs: number,
		@Res() res: any,
	) {
		if (!lotteryHistory || !lotteryHistory?.length) {
			return res.status(400).json({
				statusCode: HttpStatus.BAD_REQUEST,
				message: 'History not found or is empty',
			});
		}

		try {
			const result = await this.predictService.trainModel(
				lotteryHistory,
				optimizer,
				loss,
				epochs,
			);

            if (result && result.model) {
                return res.status(200).json({
                    statusCode: HttpStatus.OK,
                    message: 'Train data sucessfully',
                    optimizer: optimizer || defaultPredictParams.optimizer,
                    losses: loss || defaultPredictParams.loss,
                    epochs: epochs || defaultPredictParams.epochs,
                    loss: result.lastEpochLogs?.loss || null,
                    acc: result.lastEpochLogs?.acc || null
                });
            }

			return res.status(400).json({
				statusCode: HttpStatus.BAD_REQUEST,
                message: commonErrorMsg
			});
		} catch (error) {
			throw new HttpException(
				error.message,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// @Get('/test')
	// async test(@Body() data: Array<[]>, @Res() res: any) {
	// 	const input = [1, 2, 3, 4, 100];
	// 	const result = await this.predictService.predict(input);
	// 	return res.status(200).json({
    //         statusCode: 200,
	// 		data: result,
	// 	});
	// }
}
