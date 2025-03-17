import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { endOfDay, format, parse, startOfDay } from 'date-fns';
import { promises as fs } from 'fs';
import { Model } from 'mongoose';
import { join } from 'path';
import puppeteer from 'puppeteer';
import {
	LotteryBase,
	LotteryDocument,
} from 'src/common/schemas/lottery.schema';
import { Mega645 } from 'src/common/schemas/mega645.schema';
import { Power655 } from 'src/common/schemas/power655.schema';
// import { RedisService } from 'src/modules/redis/redis.service';
import { LotteryCrawlUrl, LotteryType } from 'src/types';
import { GetDataDto } from './dtos/get-data.dto';
import { vi } from 'date-fns/locale';

interface LotteryData {
	type: LotteryType;
	data: any[];
}

@Injectable()
export class CrawlService implements OnModuleInit {
	constructor(
		// private readonly redisService: RedisService,
		@InjectModel(Mega645.name) private mega645Model: Model<Mega645>,
		@InjectModel(Power655.name) private power655Model: Model<Power655>,
	) {}
	private dataDirectory = join(process.cwd(), 'public', 'data');
	// private CACHE_PREFIX = 'lottery_data';
	private DRAW_DAYS: Partial<Record<LotteryType, number[]>> = {
		// CN: 0 .... T7: 6
		Mega645: [3, 5, 0], // CN, T4, T6
		Power655: [2, 4, 6], // T3 T5 T7
	};

	async onModuleInit() {
		// Auto update data
		// await this.updateLotteryData('Mega645');
		// await this.updateLotteryData('Power655');
		// Import data to mongodb from json
		// await this.importDataFromJson('Mega645');
		// await this.importDataFromJson('Power655');
	}

	// Mega 645: CN (0), T4 (3), T6 (5)
	@Cron('0 19 * * 0,3,5')
	async updateMega645() {
		console.log('⏳ Auto-updating Mega645 data...');
		await this.updateLotteryData('Mega645');
	}

	// Power 655: T3 (2), T5 (4), T7 (6)
	@Cron('0 19 * * 2,4,6')
	async updatePower655() {
		console.log('⏳ Auto-updating Power655 data...');
		await this.updateLotteryData('Power655');
	}

	// Create mongodb data from json
	// async importDataFromJson(type: LotteryType) {
	// 	try {
	// 		const filePath = join(this.dataDirectory, `${type}.json`);

	// 		// Read file
	// 		const fileContent = await fs.readFile(filePath, 'utf-8');
	// 		const jsonData = JSON.parse(fileContent);

	// 		if (!jsonData.length) {
	// 			console.warn(`⚠️ No data found in ${type}.json`);
	// 			return;
	// 		}

	// 		// const lotteryModel = (type === 'Mega645'
	// 		// 	? this.mega645Model
	// 		// 	: this.power655Model) as unknown as Model<LotteryDocument>;
	// 		const lotteryModel: Model<LotteryBase> =
	// 			type === 'Mega645' ? this.mega645Model : this.power655Model;

	// 		// Insert data
	// 		for (const record of jsonData) {
	// 			const exists = await lotteryModel
	// 				.findOne({ date: record.date })
	// 				.exec();
	// 			if (!exists) {
	// 				await lotteryModel.create(record);
	// 				// console.log(
	// 				// 	`✅ Inserted: ${record.date} into ${type} collection.`,
	// 				// );
	// 			} else {
	// 				// console.warn(`⚠️ Skipped: ${record.date} already exists.`);
	// 			}
	// 		}

	// 		console.log(`🎉 Finished importing ${type} data.`);
	// 	} catch (error) {
	// 		console.error(`❌ Error importing ${type} data:`, error);
	// 	}
	// }

	// Crawl data
	async scrapeData(type: LotteryType, isFullData = false) {
		const url = isFullData
			? LotteryCrawlUrl[`${type}_Full`]
			: LotteryCrawlUrl[type];

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
			const result = await page.evaluate((lotteryType: string) => {
				const data = [];
				// Get all table rows with the class "table-mini-result"
				const tableRows = document.querySelectorAll(
					'.table-mini-result tbody tr',
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
						rowNumbers.push(span?.textContent.trim() || '');
					});

					const tdCount = row.querySelectorAll('td').length;

					// Find jackpot 1
					const jackpot1 = row.querySelector('td:nth-child(3)');
					let jackpot1Content = null;
					let isJackpot1Lottery = false;

					if (jackpot1) {
						const jackpot1Span = jackpot1.querySelector('span');
						if (jackpot1Span) {
							jackpot1Content = jackpot1Span.textContent;
							isJackpot1Lottery =
								(jackpot1Span as HTMLElement).style.color ===
								'rgb(255, 0, 0)';
						} else {
							jackpot1Content =
								jackpot1.textContent?.trim() || null;
							isJackpot1Lottery = false;
						}
					}

					const commonResult: any = {
						date: dateCell.textContent,
						numbers: rowNumbers,
						jackpot1: {
							value: jackpot1Content,
							isLottery: isJackpot1Lottery,
						},
					};

					// Power655
					if (tdCount === 4) {
						const jackpot2 = row.querySelector('td:nth-child(4)');
						let jackpot2Content = null;
						let isJackpot2Lottery = false;

						if (jackpot2) {
							const jackpot2Span = jackpot2.querySelector('span');
							if (jackpot2Span) {
								jackpot2Content = jackpot2Span.textContent;
								isJackpot2Lottery =
									(jackpot2Span as HTMLElement).style
										.color === 'rgb(255, 0, 0)';
								// getAttribute('style') // color:#F00
							} else {
								jackpot2Content =
									jackpot2.textContent?.trim() || null;
								isJackpot2Lottery = false;
							}
						}
						commonResult.jackpot2 = {
							value: jackpot2Content,
							isLottery: isJackpot2Lottery,
						};
					}

					// Add the array of numbers from the current row to the main array
					if (rowNumbers.length) {
						data.push(commonResult);
					}
				});

				return data;
			}, type);

			// if (result) {
			// 	await this.redisService.set(
			// 		this.CACHE_PREFIX,
			// 		type,
			// 		JSON.stringify(result),
			// 	);
			// 	console.log(`✅ Cached data for ${type}`);
			// }
			await browser.close();
			return result;
		} catch (error) {
			console.log('Error:', error);
			throw new Error(error);
		}
	}

	// Update latest data
	async updateLotteryData(type: LotteryType, fullUpdate = false) {
		try {
			const lotteryModel: Model<LotteryBase> =
				type === 'Mega645' ? this.mega645Model : this.power655Model;

			// Get the latest record
			const latestRecord = await lotteryModel.findOne().exec();

			const now = new Date();
			const today = now.getDay();
			const currentTime = now.getHours() * 60 + now.getMinutes();
			const cutoffTime = 19 * 60; // 19h

			// Check if it's up to date
			if (latestRecord) {
				const latestDate = latestRecord.date;
				const latestDay = parseInt(
					latestDate.split(', ')[1].split('/')[0],
				); // Get day

				// Get latest day in data
				const drawDays = this.DRAW_DAYS[type];
				const lastDrawDay = Math.max(
					...drawDays.filter((d) => d <= today),
				);

				// Get latest result day
				const expectedDrawDate = now;
				expectedDrawDate.setDate(
					expectedDrawDate.getDate() - (today - lastDrawDay),
				);
				const expectedDrawDay = expectedDrawDate.getDate();

				if (latestDay >= expectedDrawDay) {
					console.log(
						`✅ Data for ${type} is already up to date. No need to update!`,
					);
					return;
				}

				// If today is a draw day, wait until after the cutoff time
				if (today === lastDrawDay && currentTime < cutoffTime) {
					console.log(
						`⏳ Waiting until 19:00 to update data for ${type}`,
					);
					return;
				}
			}
			const newData = await this.scrapeData(type, fullUpdate);

			if (!newData || newData.length === 0) {
				console.log(`❌ No data available for ${type}`);
				return;
			}

			// Get existing dates to avoid duplicates
			const existingDates = new Set(
				(await lotteryModel.distinct('date')).map((date: string) =>
					new Date(date).toISOString(),
				),
			);
			const formattedNewData = newData.map((item) => ({
				...item,
				date: parse(item.date, 'EEE, dd/MM/yyyy', new Date(), {
					locale: vi,
				}), // parse date
			}));

			// Filter records to add
			const newRecords = formattedNewData.filter(
				(item) => !existingDates.has(item.date.toISOString()), // compare ISO string
			);

			if (newRecords.length === 0) {
				console.log(`✅ No new records to add for ${type}`);
				return;
			}

			// Insert the new records
			try {
				const insertResult = await lotteryModel.insertMany(newRecords);

				return {
					data: insertResult,
					message: `✅ Inserted ${insertResult.length} new records for ${type}`,
				};
			} catch (error) {
				throw error;
			}
		} catch (error) {
			// console.error(`❌ Error updating ${type}:`, error);
			throw error;
		}
	}

	// Save all data to json file
	async saveJsonFile(type: LotteryType) {
		// Get file's path
		const filePath = join(this.dataDirectory, `${type}.json`);

		try {
			// Ensure the directory exists
			await fs.mkdir(this.dataDirectory, { recursive: true });

			// Scrape full data
			const fullData = await this.scrapeData(type, true);
			if (!fullData) {
				console.log(`No data retrieved for ${type}`);
				return;
			}

			// Convert the data to JSON string
			const jsonData = JSON.stringify(fullData, null, 2);
			await fs.writeFile(filePath, jsonData, 'utf8');

			return {
				message: `Saved file successfully for ${type}`,
				data: fullData,
			};
		} catch (error) {
			console.log(`Error updating lottery data for ${type}:`, error);
			throw new Error(`Failed to update lottery data: ${error.message}`);
		}
	}

	convertToMongoDate = (dateStr: string) => {
		const parsedDate = parse(dateStr, 'dd-MM-yyyy', new Date());
		return format(parsedDate, 'yyyy-MM-dd 00:00:00.000');
	};

	public async getLotteryData(query: GetDataDto) {
		try {
			// If has cache
			// const cachedData = await this.redisService.get(
			// 	this.CACHE_PREFIX,
			// 	type,
			// );

			// if (cachedData) {
			// 	console.log(`✅ Returning cached data for ${type}`);
			// 	return JSON.parse(cachedData);
			// }

			const limit = query.count ?? 100;
			const lotteryModel: Model<LotteryBase> =
				query.type === 'Mega645'
					? this.mega645Model
					: this.power655Model;
			let data: LotteryDocument[] = [];
			let dbQuery: any = {};

			if (query.count) {
				return await lotteryModel.find().limit(limit).exec();
			}
			if (query.fromDate && query.toDate) {
				const formattedFrom = this.convertToMongoDate(query.fromDate);
				const formattedTo = this.convertToMongoDate(query.toDate);

				dbQuery = {
					date: {
						$gte: formattedFrom,
						$lte: formattedTo,
					},
				};

				console.log(`Query from ${query.fromDate} - ${query.toDate}`);
				data = await lotteryModel.find(dbQuery).exec();
			} else if (query.fromDate) {
				const formattedFrom = this.convertToMongoDate(query.fromDate);
				const formattedTo = this.convertToMongoDate(format(new Date(), 'dd-MM-yyyy'));

				dbQuery = {
					date: {
						$gte: formattedFrom,
						$lte: formattedTo,
					},
				};

				console.log(
					`Query from ${query.fromDate} - now ${format(new Date(), 'dd-MM-yyyy')}`,
				);
				data = await lotteryModel.find(dbQuery).exec();
			} else {
				data = await lotteryModel.find().limit(limit).exec();
			}

			// Cache the results
			// await this.redisService.set(
			// 	this.CACHE_PREFIX,
			// 	type,
			// 	JSON.stringify(data),
			// );
			return data;

			// // If no data in MongoDB, scrape it
			// const scrapedData = await this.scrapeData(type);

			// // Save scraped data to MongoDB
			// if (scrapedData && scrapedData.length > 0) {
			// 	await lotteryModel.insertMany(scrapedData);
			// }
		} catch (error) {
			throw error;
		}
	}
}

// For case date format is "T6, 14/03/2025"
// const from = parse(query.fromDate, 'dd-MM-yyyy', new Date());
// const to = parse(query.toDate, 'dd-MM-yyyy', new Date());

// dbQuery = {
// 	$expr: {
// 		$and: [
// 			{
// 				$gte: [
// 					{
// 						$dateFromString: {
// 							dateString: {
// 								$substr: ['$date', 4, 10], // từ vị trí 4 lấy 10 ký tự
// 							},
// 							format: '%d/%m/%Y',
// 						},
// 					},
// 					from,
// 				],
// 			},
// 			{
// 				$lte: [
// 					{
// 						$dateFromString: {
// 							dateString: {
// 								$substr: ['$date', 4, 10],
// 							},
// 							format: '%d/%m/%Y',
// 						},
// 					},
// 					to,
// 				],
// 			},
// 		],
// 	},
// };
