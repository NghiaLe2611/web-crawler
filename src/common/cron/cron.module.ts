import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CrawlService } from 'src/modules/crawl/crawl.service';

@Module({
	providers: [CronService, CrawlService],
})
export class CronModule {}
