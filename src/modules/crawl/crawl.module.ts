import { Module } from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { CrawlController } from './crawl.controller';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
	imports: [
		CacheModule.register({
            isGlobal: true
        }),
	],
	controllers: [CrawlController],
	providers: [CrawlService],
})
export class CrawlModule {}
