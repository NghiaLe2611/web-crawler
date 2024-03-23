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

@Controller('crawl')
export class PuppeteerController {
	constructor(private readonly puppeteerService: PuppeteerService) {}

	@Get('/test')
	async scrapeData(
		@Query('url') url: string,
		@Query('selector') selector: string,
	): Promise<string[]> {
		try {
			const data = await this.puppeteerService.scrapeData(url, selector);
			return data;
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
