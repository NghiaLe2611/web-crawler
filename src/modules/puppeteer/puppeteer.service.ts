import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import fs from 'fs';

@Injectable()
export class PuppeteerService {
	async scrapeData(url: string) {
		try {
			// const browser = await puppeteer.launch(
			// 	{
			// 	  headless: false, //defaults to true 
			// 	  defaultViewport: null, //Defaults to an 800x600 viewport
			// 	  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', 
			// 	  args:['--star
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			// page.setViewport({ width: 1280, height: 720 });
			await page.goto(
				'https://www.ketquadientoan.com/tat-ca-ky-xo-so-power-655.html'
				// { waitUntil: 'networkidle2' },
			);
		
			// Extract data from the website
			const result = await page.evaluate(() => {
				const data = [];
				// Get all table rows with the class "table-mini-result"
				const tableRows = document.querySelectorAll('.table-mini-result tr');
	
				// Iterate over each table row
				tableRows.forEach(function (row) {
					const rowNumbers = [];
	
					// Find all spans with the class "home-mini-whiteball" within the current table row
					const number = row.querySelectorAll('.home-mini-whiteball');
	
					// Iterate over each span and push its text content to the rowNumbers array
					number.forEach(function (span) {
						rowNumbers.push(span.textContent.trim());
					});
	
					// Add the array of numbers from the current row to the main array
					if (rowNumbers.length) {
						data.push(rowNumbers);
					}
				});
	
				return data;
			});
	
	
			// Write data to json
			// fs.writeFileSync('output.json', JSON.stringify(result, null, 2));
			// console.log('Data has been written to output.json file.');
			console.log(result);
			await browser.close();

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