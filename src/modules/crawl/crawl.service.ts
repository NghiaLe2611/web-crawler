import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import {
	differenceInDays,
	format,
	getDay,
	getDayOfYear,
	isBefore,
	isSameDay,
	parse,
	subDays,
} from 'date-fns';
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
import { convertToMongoDate } from '@/utils/date.utils';
import { vi } from 'date-fns/locale';
import { LotteryCrawlUrl, LotteryType } from 'src/types';
import { GetDataDto } from '../../common/dtos/get-data.dto';
import { RedisService } from '@nghiale/redis-module';

interface LotteryData {
	type: LotteryType;
	data: any[];
}

@Injectable()
export class CrawlService implements OnModuleInit {
	constructor(
		private readonly redisService: RedisService,
		@InjectModel(Mega645.name) private mega645Model: Model<Mega645>,
		@InjectModel(Power655.name) private power655Model: Model<Power655>,
	) {}
	private dataDirectory = join(process.cwd(), 'public', 'data');
	private CACHE_PREFIX = 'lottery_data';
	private UPDATE_HOUR = 19;
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

	private async insertDataToDB(
		lotteryModel,
		type: LotteryType,
		fullUpdate: boolean,
	) {
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

            // Update cache
            await this.updateCacheAfterInsert(type, newRecords);

			return {
				data: insertResult,
				message: `✅ Inserted ${insertResult.length} new records for ${type}`,
			};
		} catch (error) {
			throw error;
		}
	}

	private toVietnamDate = (utcDate) => {
		const vietnamOffset = 7 * 60; // GMT+7 (phút)
		return new Date(utcDate.getTime() + vietnamOffset * 60 * 1000);
	};

	// private shouldUpdateData(type: LotteryType, latestRecordDate): boolean {
	// 	const now = new Date(); // Tự động lấy VN time
	// 	const today = now.getDay();
	// 	const currentTime = now.getHours() * 60 + now.getMinutes();
	// 	const cutoffTime = this.UPDATE_HOUR * 60;

	// 	// Lấy thời gian địa phương cụ thể thay vì dựa vào offset
	// 	// const vietnamTime = new Date(
	// 	// 	now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
	// 	// );
	// 	// const today = vietnamTime.getDay();
	// 	// const currentTime =
	// 	// 	vietnamTime.getHours() * 60 + vietnamTime.getMinutes();
	// 	// const cutoffTime = this.UPDATE_HOUR * 60;

	// 	const drawDays = this.DRAW_DAYS[type];
	// 	if (!drawDays) return false;

	// 	// Tìm ngày quay số gần nhất
	// 	const daysSinceLastDraw = drawDays
	// 		.map((drawDay) => {
	// 			let diff = today - drawDay;
	// 			if (diff < 0) diff += 7; // Quay lại tuần trước nếu cần
	// 			return diff;
	// 		})
	// 		.sort((a, b) => a - b)[0];

	// 	// Tạo ngày quay số gần nhất
	// 	const lastDrawDate = new Date(now);
	// 	lastDrawDate.setDate(now.getDate() - daysSinceLastDraw);
	// 	lastDrawDate.setHours(0, 0, 0, 0);

	// 	// Chuyển ngày từ MongoDB sang múi giờ đúng
	// 	const latestDate = this.toVietnamDate(new Date(latestRecordDate));
	// 	latestDate.setHours(0, 0, 0, 0);

	// 	// Nếu latestDate >= lastDrawDate, đã cập nhật đủ
	// 	if (latestDate >= lastDrawDate) {
	// 		console.log(
	// 			`✅ Data for ${type} is already up to date. No need to update!`,
	// 		);
	// 		return false;
	// 	}

	// 	// Nếu hôm nay là ngày quay SỐ HIỆN TẠI và chưa tới giờ quay
	// 	if (drawDays.includes(today) && currentTime < cutoffTime) {
	// 		// Kiểm tra dữ liệu
	// 		// const msPerDay = 24 * 60 * 60 * 1000;
	// 		const lastDrawBeforeToday = new Date(lastDrawDate);
	// 		if (daysSinceLastDraw === 0) {
	// 			// Nếu ngày quay là hôm nay, lùi về kỳ quay trước đó
	// 			const previousDrawDays = [...drawDays].sort((a, b) => a - b);
	// 			const prevDrawDay =
	// 				previousDrawDays[previousDrawDays.length - 1];
	// 			const diff = today - prevDrawDay;
	// 			const daysToPrevDraw = diff > 0 ? diff : diff + 7;
	// 			lastDrawBeforeToday.setDate(
	// 				now.getDate() - daysToPrevDraw,
	// 			);
	// 		}

	// 		// Kiểm tra xem latestDate có cũ hơn kỳ quay trước đó không
	// 		if (latestDate < lastDrawBeforeToday) {
	// 			console.log(
	// 				`📊 Missing previous draw data. Updating immediately for ${type}`,
	// 			);
	// 			return true;
	// 		}

	// 		console.log(
	// 			`⏳ Waiting until 19:00 to update data for ${type} for today's draw`,
	// 		);
	// 		return false;
	// 	}

	// 	console.log(`🔄 Need to update data for ${type}`);
	// 	return true;
	// }

	// Update latest data

	private getLastValidDrawDate = (type: LotteryType, today) => {
		const drawDays = this.DRAW_DAYS[type];

		for (let i = 1; i <= 7; i++) {
			const checkDate = subDays(today, i);
			if (drawDays.includes(getDay(checkDate))) {
				return checkDate;
			}
		}
		return null;
	};

	private shouldUpdateData = (
		type: LotteryType,
		latestRecordDate,
		now = new Date(),
	) => {
		const lastDate = this.toVietnamDate(latestRecordDate);
		const drawDays = this.DRAW_DAYS[type];

		if (!drawDays) return false;

		const isLastDrawDay = drawDays.includes(getDayOfYear(lastDate));
		const lastValidDrawDate = this.getLastValidDrawDate(type, now);
		const nowMinutes = now.getHours() * 60 + now.getMinutes();
		const lastMinutes = lastDate.getHours() * 60 + lastDate.getMinutes();

		// Nếu dữ liệu cũ hơn ngày quay số gần nhất
		if (lastValidDrawDate && isBefore(lastDate, lastValidDrawDate)) {
			return true;
		}

		// Nếu dữ liệu là hôm nay
		if (isSameDay(now, lastDate)) {
			console.log('wait to 19h to update');
			return (
				nowMinutes >= this.UPDATE_HOUR * 60 && lastMinutes < nowMinutes
			);
		}

		// Nếu dữ liệu là ngày quay số gần nhất và đã qua 19h
		if (isLastDrawDay && differenceInDays(now, lastDate) <= 7) {
			return (
				nowMinutes >= this.UPDATE_HOUR * 60 && lastMinutes < nowMinutes
			);
		}

		return isBefore(lastDate, now);
	};

	async updateLotteryData(type: LotteryType, fullUpdate = false) {
		try {
			const lotteryModel: Model<LotteryBase> =
				type === 'Mega645' ? this.mega645Model : this.power655Model;

			// Get the latest record
			const latestRecord = await lotteryModel
				.findOne()
				.sort({ date: -1 })
				.exec();

			if (!latestRecord) {
				// Update full data
				this.insertDataToDB(lotteryModel, type, true);
			}
			const shouldUpdate = this.shouldUpdateData(type, latestRecord.date);
			if (!shouldUpdate) {
				return {
					message: 'Data is up to date!',
				};
			}

			// console.log('updateeee');
			// return;

			return this.insertDataToDB(lotteryModel, type, false);
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
			const dbQuery: any = {};

			if (query.fromDate) {
				const formattedFrom = convertToMongoDate(query.fromDate);
				const formattedTo = query.toDate
					? convertToMongoDate(query.toDate)
					: convertToMongoDate(format(new Date(), 'dd-MM-yyyy'));

				dbQuery.date = { $gte: formattedFrom, $lte: formattedTo };
			}

			return await lotteryModel
				.find(dbQuery)
				.sort({ date: -1 })
				.limit(limit)
				.exec();

			// Cache the results
			// await this.redisService.set(
			// 	this.CACHE_PREFIX,
			// 	type,
			// 	JSON.stringify(data),
			// );

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

	async saveRedisCacheFromDb(type: LotteryType): Promise<void> {
		const lotteryModel: Model<LotteryBase> =
			type === 'Mega645' ? this.mega645Model : this.power655Model;

		// Get all data
		const data = await lotteryModel.find().lean().exec();

		if (!data || data.length === 0) {
			console.log(`❌ No data found in MongoDB for ${type}`);
			await this.redisService.set(
				this.CACHE_PREFIX,
				type,
				JSON.stringify(JSON.stringify([])),
			);
			return;
		}

		// Save to redis
		await this.redisService.set(
			this.CACHE_PREFIX,
			type,
			JSON.stringify(data),
		);
		console.log(`✅ Cached ${data.length} records for ${type} in Redis`);
	}

	private async updateCacheAfterInsert(
		type: LotteryType,
		newRecords: any[],
	): Promise<void> {
		const cachedData = await this.redisService.get(
			this.CACHE_PREFIX,
			type,
		);
		let currentData = cachedData ? JSON.parse(cachedData) : [];
		currentData = [...newRecords, ...currentData];

		// Ghi lại vào Redis
		await await this.redisService.set(
			this.CACHE_PREFIX,
			type,
			JSON.stringify(currentData),
		);
		console.log(
			`✅ Updated cache with ${newRecords.length} new records for ${type}`,
		);
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
