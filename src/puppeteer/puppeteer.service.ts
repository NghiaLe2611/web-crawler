import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class PuppeteerService {
	async scrapeData(url: string, selector: string): Promise<string[]> {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();

		try {
			await page.goto(url);
			const elements = await page.$$eval(selector, (els) =>
				els.map((el) => el.textContent),
			);
			return elements;
		} catch (error) {
			console.error('Error scraping data:', error);
			throw error; // Re-throw the error for handling in the API route
		} finally {
			await browser.close();
		}
	}

	create(createPuppeteerDto) {
		return 'This action adds a new puppeteer';
	}

	findAll() {
		return `This action returns all puppeteer`;
	}

	findOne(id: number) {
		return `This action returns a #${id} puppeteer`;
	}

	update(id: number) {
		return `This action updates a #${id}`;
	}

	remove(id: number) {
		return `This action removes a #${id}`;
	}
}
