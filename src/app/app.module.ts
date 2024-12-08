import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrawlService } from 'src/modules/crawl/crawl.service';
import { CrawlController } from 'src/modules/crawl/crawl.controller';
import { PredictController } from 'src/modules/predict/predict.controller';
import { PredictService } from 'src/modules/predict/predict.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from 'src/common/cron/cron.module';

@Module({
	imports: [ScheduleModule.forRoot(), CronModule],
	controllers: [AppController, CrawlController, PredictController],
	providers: [AppService, CrawlService, PredictService],
})
export class AppModule {}
