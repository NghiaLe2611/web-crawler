const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
	try {
		// const browser = await puppeteer.launch({
		// 	headless: false,
		// 	defaultViewport: null,
		// });
		const browser = await puppeteer.launch({
			headless: false, //defaults to true
			defaultViewport: null, //Defaults to an 800x600 viewport
			executablePath:
				// 'C:/Program Files/Google/Chrome/Application/chrome.exe',
				'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
			args: ['--start-maximized'], //by default puppeteer runs Chromium buddled with puppeteer
		});
		const page = await browser.newPage();
		// page.setViewport({ width: 1280, height: 720 });
		await page.goto(
			'https://www.ketquadientoan.com/tat-ca-ky-xo-so-power-655.html',
			// { waitUntil: 'networkidle2' },
		);

		// await page.screenshot({ path: 'kenh14.png' });

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
				console.log(123, dateCell);

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

		// console.log(result);

		// Write data to json
		// fs.writeFileSync('output.json', JSON.stringify(result, null, 2));
		// console.log('Data has been written to output.json file.');

		// await browser.close();
	} catch (err) {
		console.error('Error:', err);
	}
})();
