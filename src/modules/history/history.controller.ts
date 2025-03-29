import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpException,
	HttpStatus,
	Param,
	Post,
	Put,
	Query,
	Res,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import {
	CreatePredictHistoryDto,
	UpdatePredictHistoryDto,
} from './dtos/history.dto';
import { GetDataDto } from '../../common/dtos/get-data.dto';

@Controller('history')
export class HistoryController {
	constructor(private readonly historyService: HistoryService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async create(
		@Body() createHistoryDto: CreatePredictHistoryDto,
		@Res() res: any,
	) {
		try {
			const { data, isUpdated } =
				await this.historyService.create(createHistoryDto);
			return res.status(200).json({
				statusCode: HttpStatus.OK,
				data,
				message: isUpdated
					? 'Predict existed so it has been updated successfully'
					: 'Predict successfully',
			});
		} catch (error) {
			throw new HttpException(
				error.message,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Get()
	async getData(@Query() query: GetDataDto) {
		try {
			const res = await this.historyService.findAll(query);
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
	async findById(@Param('id') id: string) {
		return this.historyService.findById(id);
	}

	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() updateHistoryDto: UpdatePredictHistoryDto,
	) {
		return this.historyService.update(id, updateHistoryDto);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async delete(@Param('id') id: string) {
		return this.historyService.delete(id);
	}
}
