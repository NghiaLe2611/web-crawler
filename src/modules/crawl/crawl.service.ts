import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import NodeCache from 'node-cache';
import puppeteer from 'puppeteer';
import { LotteryCrawlUrl, LotteryType } from 'src/types';
import { promises as fs } from 'fs';
import { join } from 'path';

// const cacheCrawlData = new NodeCache({ stdTTL: 4 * 60 * 60 }); // 4h

interface LotteryData {
	type: LotteryType;
	data: any[];
}

@Injectable()
export class CrawlService {
	// private cacheCrawlData: NodeCache;
	// private globalLotteryData: Record<LotteryCrawlUrl, any> = {} as any;
	private dataDirectory = join(process.cwd(), 'public', 'data');

	// constructor() {
	// this.cacheCrawlData = new NodeCache({
	// 	stdTTL: 0, // Không giới hạn TTL
	// 	checkperiod: 0,
	// });
	// }

	// Cron job mega 6/45
	// @Cron('0 19 * * 1,3,5')
	@Cron('*/60 * * * * *')
	async handleCrawlCronMega645() {
		const cachedData = await this.getLotteryData(`Mega645`);
		console.log('has cached data Mega645');

		if (cachedData) return;

		console.log('get new data Mega645');

		await this.crawlAndCacheData('Mega645');
	}

	// Cron job power 6/55
	// @Cron('0 19 * * 2,4,6')
	@Cron('*/60 * * * * *')
	async handleCrawlCronPower655() {
		const cachedData = await this.getLotteryData(`Power655`);
		console.log('has cached data Power655');
		if (cachedData) return;

		console.log('get new data Power655');

		await this.crawlAndCacheData('Power655');
	}

	// async scrapeData(type: LotteryCrawlUrl) {
	// 	const url = LotteryCrawlUrl[type];

	// 	if (!url) {
	// 		return null;
	// 	}
	// 	// Check existed cache
	// 	const cachedData = cacheCrawlData.get(`lottery_${type}`);

	// 	if (cachedData) {
	// 		return cachedData as any[];
	// 	}

	// 	try {
	// 		const browser = await puppeteer.launch({
	// 			ignoreHTTPSErrors: true,
	// 		});
	// 		const page = await browser.newPage();
	// 		// page.setViewport({ width: 1280, height: 720 });
	// 		await page.goto(
	// 			url,
	// 			// { waitUntil: 'networkidle2' },
	// 		);

	// 		// Extract data from the website
	// 		const result = await page.evaluate(() => {
	// 			const data = [];
	// 			// Get all table rows with the class "table-mini-result"
	// 			const tableRows = document.querySelectorAll(
	// 				'.table-mini-result tr',
	// 			);

	// 			// Iterate over each table row
	// 			tableRows.forEach(function (row) {
	// 				const rowNumbers = [];

	// 				// Get date
	// 				const dateCell = row.querySelector('td:first-child');

	// 				// Find all spans with the class "home-mini-whiteball" within the current table row
	// 				const number = row.querySelectorAll('.home-mini-whiteball');

	// 				// Iterate over each span and push its text content to the rowNumbers array
	// 				number.forEach(function (span) {
	// 					rowNumbers.push(span.textContent.trim());
	// 				});

	// 				// Add the array of numbers from the current row to the main array
	// 				if (rowNumbers.length) {
	// 					data.push({
	// 						date: dateCell.textContent,
	// 						numbers: rowNumbers,
	// 					});
	// 				}
	// 			});

	// 			return data;
	// 		});

	// 		// Write data to json
	// 		// fs.writeFileSync('output.json', JSON.stringify(result, null, 2));
	// 		// console.log('Data has been written to output.json file.', result);

	// 		await browser.close();

	// 		// Cache data
	// 		cacheCrawlData.set(`lottery_${type}`, result);

	// 		return result;
	// 	} catch (error) {
	// 		console.error('Error:', error);
	// 	}
	// }

	async scrapeData(type: LotteryType) {
		const url = LotteryCrawlUrl[type];

		if (!url) {
			return null;
		}

		try {
			const browser = await puppeteer.launch({
				ignoreHTTPSErrors: true,
			});
			const page = await browser.newPage();
			// page.setViewport({ width: 1280, height: 720 });
			await page.goto(
				url,
				// { waitUntil: 'networkidle2' },
			);

			// Extract data from the website
			const result = await page.evaluate(() => {
				const data = [];
				// Get all table rows with the class "table-mini-result"
				const tableRows = document.querySelectorAll(
					'.table-mini-result tr',
				);

				// Iterate over each table row
				tableRows.forEach(function (row) {
					const rowNumbers = [];

					// Get date
					const dateCell = row.querySelector('td:first-child');

					// Find all spans with the class "home-mini-whiteball" within the current table row
					const number = row.querySelectorAll('.home-mini-whiteball');

					// Iterate over each span and push its text content to the rowNumbers array
					number.forEach(function (span) {
						rowNumbers.push(span.textContent.trim());
					});

					// Add the array of numbers from the current row to the main array
					if (rowNumbers.length) {
						data.push({
							date: dateCell.textContent,
							numbers: rowNumbers,
						});
					}
				});

				return data;
			});

			// Write data to json
			// fs.writeFileSync('output.json', JSON.stringify(result, null, 2));
			// console.log('Data has been written to output.json file.', result);

			await browser.close();
			return result;
		} catch (error) {
			console.log('Error:', error);
			throw new Error(error);
		}
	}

	async crawlAndCacheData(type: LotteryType) {
		try {
			// Lấy dữ liệu mới
			const data = await this.scrapeData(type);
			if (!data) return;

			const lotteryData: LotteryData = {
				type,
				data,
			};

			// this.globalLotteryData[type] = lotteryData;
			// this.cacheCrawlData.set(`lottery_${type}`, lotteryData);

			// Check folder
			await fs.mkdir(this.dataDirectory, { recursive: true });

			// Save file
			const filePath = join(
				process.cwd(),
				'public',
				'data',
				`${type}.json`,
			);
			await fs.writeFile(
				filePath,
				JSON.stringify(lotteryData, null, 2),
				'utf-8',
			);

			console.log(`Save cache for lottery_${type}`);
		} catch (error) {
			// console.log(`Error crawling ${type}:`, error);
			throw new Error(error);
		}
	}

	public async getLotteryData(type: LotteryType) {
		// const cachedData = this.cacheCrawlData.get(`lottery_${type}`) as any;

		// // Check cache
		// if (cachedData) {
		// 	return cachedData;
		// }

		// return null;
		const filePath = join(this.dataDirectory, `${type}.json`);

		try {
			const fileContent = await fs.readFile(filePath, 'utf-8');
			const data = JSON.parse(fileContent);
			if (data?.data?.length > 0) {
				return data as LotteryData;
			}

			return null;
		} catch (error) {
			if (error.code === 'ENOENT') {
				// File does not exist
				return null;
			}
			throw new Error(`Error reading data for ${type}: ${error.message}`);
		}
	}
}

// const countObject = arr.flat().reduce((acc, value) => {
// 	acc[value] = (acc[value] || 0) + 1; // count appearances of number
// 	return acc;
// }, {});

// const sortable = [];
// for (let item in countObject) {
// 	sortable.push([item, countObject[item]]);
// }

// sortable.sort(function (a, b) {
// 	return a[1] - b[1];
// });
