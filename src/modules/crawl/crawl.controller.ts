import {
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Query
} from '@nestjs/common';
import { LotteryType } from 'src/types';
import { CrawlService } from './crawl.service';

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

	@Get('/lottery')
	async getData(@Query('type') type: LotteryType) {
		try {
			const res = await this.crawlService.getLotteryData(type);
			return { data: res?.data || [], statusCode: HttpStatus.OK };
		} catch (error) {
			throw new HttpException(
				'Scraping failed: ' + error.message,
				HttpStatus.BAD_REQUEST,
			);
		}
	}
}
