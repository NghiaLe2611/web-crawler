import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PuppeteerService } from 'src/modules/puppeteer/puppeteer.service';

// giây phút giờ ngày tháng tuần
@Injectable()
export class CronService {
	constructor(private readonly puppeteerService: PuppeteerService) {}
	// private readonly logger = new Logger(CronService.name);

	@Cron('* * * * * *')
	handleCron() {
		// this.logger.debug('Called when the second is 45');
		// console.log('Called every seconds');
	}

	// 4 6 CN (0 is Sunday)
	@Cron('0 20 * * 3,5,0')
	trainModelForMega45() {
		console.log('Train model mega 45');
	}

	// 3 5 7
	@Cron('0 20 * * 2,4,6')
	trainModelForMega55() {
		console.log('Train model mega 55');
	}

	// @Interval(10000)
	// handleInterval() {
	// }

	// @Timeout(5000)
	// handleTimeout() {
	// }
}
