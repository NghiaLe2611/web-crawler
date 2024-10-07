import {
	Body,
	Controller,
	Delete,
	Get,
	HttpException,
	HttpStatus,
	Post,
	Req,
	Res,
} from '@nestjs/common';
import { PredictService } from './predict.service';
import {
	COMMON_ERR_MESSAGE,
	DEFAULT_PREDICT_PARAMS,
	MAX_NUMBER,
} from 'src/constants';
import * as path from 'path';
import { LotteryType } from 'src/types';

class TrainModelDto {
	data: number[][];
	optimizer = 'adam';
	loss = 'meanSquaredError';
	epochs = 100;
	lotteryType: LotteryType;
}

class PredictDataDto {
	lotteryType: LotteryType;
	lotteryHistory: number[][];
	inputPath: string;
}

@Controller('/analyze')
export class PredictController {
	constructor(private readonly predictService: PredictService) {}

	@Post('/train')
	async handleTrainModal(@Body() model: TrainModelDto, @Res() res: any) {
		const { data, optimizer, loss, epochs, lotteryType } = model;
		if (!data || !data?.length) {
			return res.status(HttpStatus.BAD_REQUEST).json({
				statusCode: HttpStatus.BAD_REQUEST,
				message: 'History not found or is empty',
			});
		}

		try {
			const result = await this.predictService.trainModelIncrementally(
				lotteryType,
				data,
				optimizer,
				loss,
				epochs,
			);

			if (result && result.model) {
				return res.status(HttpStatus.OK).json({
					statusCode: HttpStatus.OK,
					message: 'Train model sucessfully',
					optimizer: optimizer || DEFAULT_PREDICT_PARAMS.optimizer,
					losses: loss || DEFAULT_PREDICT_PARAMS.loss,
					epochs: epochs || DEFAULT_PREDICT_PARAMS.epochs,
					loss: result.lastEpochLogs?.loss || null,
					acc: result.lastEpochLogs?.acc || null,
				});
			}

			return res.status(HttpStatus.BAD_REQUEST).json({
				statusCode: HttpStatus.BAD_REQUEST,
				message: COMMON_ERR_MESSAGE,
			});
		} catch (err) {
			throw new HttpException(
				err.message,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Post('/predict')
	async handlePredict(
		@Body() predictData: PredictDataDto,
		// @Body('lotteryType') lotteryType: LotteryType,
		// @Body('data') lotteryHistory: number[][],
		// @Body('path') inputPath = 'model_adam_meanSquaredError',
		@Res() res: any,
	) {
		const { lotteryHistory, lotteryType, inputPath } = predictData;
		const modelPath = path.resolve(
			process.cwd(),
			'models',
			lotteryType,
			inputPath,
		);

		try {
			const result = await this.predictService.predict(
				lotteryType,
				lotteryHistory,
				modelPath,
			);
			if (result) {
				return res.status(200).json({
					statusCode: HttpStatus.OK,
					data: result.data,
					accuracy: result.accuracy,
				});
			}

			return res.status(200).json({
				statusCode: HttpStatus.OK,
				data: [],
			});
		} catch (err) {
			throw new HttpException(
				err.message,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Delete('/delete')
	async handleDeleteModel(
		@Body() modelName: string,
		@Res() res: any,
	) {
		try {
			const result = await this.predictService.cleanModel(modelName);
			return res.status(HttpStatus.OK).json({
				statusCode: HttpStatus.OK,
				message: 'Delete model successfully !',
			});
		} catch (err) {
			throw new HttpException(
				err.message,
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
