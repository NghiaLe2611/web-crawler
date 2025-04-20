import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    Req,
    Res
} from '@nestjs/common';
import { GetDataDto } from '../../common/dtos/get-data.dto';
import {
    CreatePredictHistoryDto,
    UpdatePredictHistoryDto,
} from './dtos/history.dto';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
	constructor(private readonly historyService: HistoryService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createPredict(
		@Body() createHistoryDto: CreatePredictHistoryDto,
		@Res() res: any,
		@Req() req,
	) {
		try {
			const userId = req.user;
			const data = await this.historyService.create(
				createHistoryDto,
				userId,
			);
			return res.status(200).json({
				statusCode: HttpStatus.OK,
				data,
				message: 'Predict successfully',
				// message: isUpdated
				// 	? 'Predict existed so it has been updated successfully'
				// 	: 'Predict successfully',
			});
		} catch (error) {
			throw new HttpException(
				error.message,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Get()
	async getData(@Req() req, @Query() query: GetDataDto) {
		try {
			const userId = req.user;
			const res = await this.historyService.findAll(query, userId);
			return { data: res, count: res.length, statusCode: HttpStatus.OK };
		} catch (error) {
			throw new HttpException(
				'Failed to get data: ' + error.message,
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	// @Get('mega645')
	// async getMega645() {
	// 	try {
	// 		const res = await this.historyService.findByType('Mega645');
	// 		return { data: res, count: res.length, statusCode: HttpStatus.OK };
	// 	} catch (error) {
	// 		throw new HttpException(
	// 			'Failed to get data: ' + error.message,
	// 			HttpStatus.BAD_REQUEST,
	// 		);
	// 	}
	// }

	// @Get('power655')
	// async getPower655() {
	// 	try {
	// 		const res = await this.historyService.findByType('Power655');
	// 		return { data: res, count: res.length, statusCode: HttpStatus.OK };
	// 	} catch (error) {
	// 		throw new HttpException(
	// 			'Failed to get data: ' + error.message,
	// 			HttpStatus.BAD_REQUEST,
	// 		);
	// 	}
	// }

	@Get(':id')
	async findPredict(@Param('id') id: string) {
		try {
			const res = await this.historyService.findById(id);
			return { data: res, statusCode: HttpStatus.OK };
		} catch (error) {
			throw new HttpException(
				'Failed to get detail: ' + error.message,
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	// @Put(':id')
	@Patch(':id')
	async updatePredict(
		@Param('id') id: string,
		@Body() updateHistoryDto: UpdatePredictHistoryDto,
		@Req() req,
	) {
		try {
			const userId = req.user;
			const res = await this.historyService.update(id, {
				...updateHistoryDto,
				userId,
			});
			return {
				data: res,
				statusCode: HttpStatus.OK,
				message: 'Update successfully',
			};
		} catch (error) {
			throw new HttpException(
				'Failed to update: ' + error.message,
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	@Delete(':id')
	// @HttpCode(HttpStatus.NO_CONTENT)
	async deletePredict(@Req() req, @Param('id') id: string) {
		try {
			const userId = req.user;
			const res = await this.historyService.delete(id, userId);
			return {
				// data: res,
				statusCode: HttpStatus.OK,
				message: 'Delete successfully',
			};
		} catch (error) {
			throw new HttpException(
				'Failed to delete: ' + error.message,
				HttpStatus.BAD_REQUEST,
			);
		}
	}
}
