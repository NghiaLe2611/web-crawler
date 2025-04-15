import {
	Controller,
	Get,
	HttpException,
	HttpStatus,
	Param,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { LotteryType } from 'src/types';
import { CrawlService } from './crawl.service';
import { GetDataDto } from '../../common/dtos/get-data.dto';
// import { PermissionGuard } from '@/guards/permission.guard';

@Controller('crawl')
export class CrawlController {
	constructor(private readonly crawlService: CrawlService) {}

	// @Get('/lottery')
	// async scrapeData(
	// 	@Query('type') type: LotteryCrawlUrl,
	// ): Promise<ScrapeResponse> {
	// 	try {
	// 		const data = await this.crawlService.scrapeData(type);
	// 		if (!data) {
	// 			return { data, statusCode: HttpStatus.BAD_REQUEST };
	// 		}
	// 		return { data, statusCode: HttpStatus.OK };
	// 	} catch (error) {
	// 		throw new HttpException(
	// 			'Scraping failed: ' + error.message,
	// 			HttpStatus.BAD_REQUEST,
	// 		);
	// 	}
	// }

	@Get('/save')
	// @UseGuards(PermissionGuard)
	async saveData(@Query('type') type: LotteryType) {
		try {
			const res = await this.crawlService.saveJsonFile(type);
			return {
				statusCode: HttpStatus.OK,
				message: res?.message || `Save ${type} data successfully`,
			};
		} catch (error) {
			throw new HttpException(
				'Failed to save data: ' + error.message,
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	// Crawl and update data
	@Get('/update')
	// @UseGuards(PermissionGuard)
	async updateData(
		@Query('type') type: LotteryType,
		@Query('isFull') isFull: boolean,
	) {
		if (!type) {
			throw new HttpException('Type is required', HttpStatus.BAD_REQUEST);
		}
		try {
			const res = await this.crawlService.updateLotteryData(
				type,
				isFull ?? false,
			);
			return {
				// data: res,
				statusCode: HttpStatus.OK,
				message: res?.message || `Updated ${type} data successfully`,
			};
		} catch (error) {
			throw new HttpException(
				'Failed to update data: ' + error.message,
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	// Get result data
	@Get('/lottery')
	async getData(@Query() query: GetDataDto) {
		try {
			const res = await this.crawlService.getLotteryData(query);
			return { data: res, count: res.length, statusCode: HttpStatus.OK };
		} catch (error) {
			throw new HttpException(
				'Failed to get data: ' + error.message,
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	@Post('/cache/:type')
	// @UseGuards(PermissionGuard)
	async cacheData(@Param('type') type: LotteryType): Promise<{
		statusCode: number;
		message: string;
	}> {
		try {
			await this.crawlService.saveRedisCacheFromDb(type);
			return {
				statusCode: 200,
				message: `Cache written for ${type}`,
			};
		} catch (error) {
			return {
				statusCode: 500,
				message: error?.message ?? `Error writing cache`,
			};
		}
	}
}
