import {
	Body,
	Controller,
	Delete,
	HttpException,
	HttpStatus,
	NotFoundException,
	Post,
	Res,
    UseGuards,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { COMMON_ERR_MESSAGE, DEFAULT_PREDICT_PARAMS } from 'src/constants';
import { LotteryType } from 'src/types';
import { PredictService } from './predict.service';
import { PermissionGuard } from '@/guards/permission.guard';

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
	@UseGuards(PermissionGuard)
	async handleTrainModel(@Body() model: TrainModelDto, @Res() res: any) {
		const { data, optimizer, loss, epochs, lotteryType } = model;
		if (!data || !data?.length) {
			return res.status(HttpStatus.BAD_REQUEST).json({
				statusCode: HttpStatus.BAD_REQUEST,
				message: 'History not found or is empty',
			});
		}

		try {
			const result = await this.predictService.trainModel(
				lotteryType,
				data,
				optimizer,
				loss,
				epochs,
			);

			if (result && result.model) {
				return res.status(HttpStatus.OK).json({
					statusCode: HttpStatus.OK,
					message: result.existed
						? 'Incrementally train model sucessfully'
						: 'Train model sucessfully',
					optimizer: optimizer || DEFAULT_PREDICT_PARAMS.optimizer,
					losses: loss || DEFAULT_PREDICT_PARAMS.loss,
					epochs: epochs || DEFAULT_PREDICT_PARAMS.epochs,
					metrics: result.lastEpochLogs,
					// loss: result.lastEpochLogs?.loss || null,
					// acc: result.lastEpochLogs?.acc || null,
				});
			}

			return res.status(HttpStatus.BAD_REQUEST).json({
				statusCode: HttpStatus.BAD_REQUEST,
				message: COMMON_ERR_MESSAGE,
			});
		} catch (error) {
			throw new HttpException(
				error.message,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Post('/trainAll')
	@UseGuards(PermissionGuard)
	async handleTrainAll(@Body() model: TrainModelDto, @Res() res: any) {
		const { optimizer, loss, epochs, lotteryType } = model;

		try {
			const result = await this.predictService.trainAll(
				lotteryType,
				optimizer,
				loss,
				epochs,
			);

			return res.status(HttpStatus.OK).json({
				statusCode: HttpStatus.OK,
				data: result,
			});
		} catch (error) {
			const errData = error.response ?? null;

			if (errData) {
				throw new HttpException(errData.message, errData.statusCode);
			}

			throw new HttpException(
				error.message,
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
			await fs.access(modelPath);
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
						// accuracy: result.accuracy,
					});
				}

				return res.status(200).json({
					statusCode: HttpStatus.OK,
					data: [],
				});
			} catch (error) {
				throw new HttpException(
					error.message,
					HttpStatus.INTERNAL_SERVER_ERROR,
				);
			}
		} catch (error) {
			throw new NotFoundException(`Model ${inputPath} does not exist`);
		}
	}

	@Delete('/delete')
	@UseGuards(PermissionGuard)
	async handleDeleteModel(@Body() modelName: string, @Res() res: any) {
		try {
			const result = await this.predictService.cleanModel(modelName);
			return res.status(HttpStatus.OK).json({
				statusCode: HttpStatus.OK,
				message: 'Delete model successfully !',
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
