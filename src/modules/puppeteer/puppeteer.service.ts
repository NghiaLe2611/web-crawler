import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import fs from 'fs';
import * as NodeCache from 'node-cache';
import { LotteryType } from 'src/types';
import { crawUrl } from 'src/constants';

const cacheCrawlData = new NodeCache({ stdTTL: 4 * 60 * 60 }); // 4h

@Injectable()
export class PuppeteerService {
	async scrapeData(type: LotteryType) {
		const url = LotteryType[type];

		if (!url) {
			return null;
		}
		// Check existed cache
		const cachedData = cacheCrawlData.get(`lottery_${type}`);

		if (cachedData) {
			return cachedData as any[];
		}

		try {
			const browser = await puppeteer.launch();
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

			// Cache data
			cacheCrawlData.set(`lottery_${type}`, result);

			return result;
		} catch (err) {
			console.error('Error:', err);
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
