import {
	Body,
	Controller,
	Delete,
	Get,
	HttpException,
	HttpStatus,
	Param,
	Patch,
	Post,
	Query,
	UseFilters,
} from '@nestjs/common';
import { PuppeteerService } from './puppeteer.service';
import { ScrapeResponse } from './puppeteer.interface';

@Controller('crawl')
export class PuppeteerController {
	constructor(private readonly puppeteerService: PuppeteerService) { }

	@Get('/lottery')
	async scrapeData(
		@Query('url') url = 'https://www.ketquadientoan.com/tat-ca-ky-xo-so-power-655.html',
		// @Query('selector') selector: string,
	): Promise<ScrapeResponse> {
		try {
			const data = await this.puppeteerService.scrapeData(url);
			return { data, status: HttpStatus.OK };
		} catch (error) {
			throw new HttpException(
				'Scraping failed: ' + error.message,
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	@Post()
	create(@Body() createPuppeteerDto) {
		return this.puppeteerService.create(createPuppeteerDto);
	}

	@Get()
	findAll() {
		return this.puppeteerService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.puppeteerService.findOne(+id);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() updatePuppeteerDto) {
		return this.puppeteerService.update(+id);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.puppeteerService.remove(+id);
	}
}
