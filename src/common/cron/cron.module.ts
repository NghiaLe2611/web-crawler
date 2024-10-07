import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { PuppeteerService } from 'src/modules/puppeteer/puppeteer.service';

@Module({
	providers: [CronService, PuppeteerService],
})
export class CronModule {}
