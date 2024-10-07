import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PuppeteerService } from 'src/modules/puppeteer/puppeteer.service';
import { PuppeteerController } from 'src/modules/puppeteer/puppeteer.controller';
import { PredictController } from 'src/modules/predict/predict.controller';
import { PredictService } from 'src/modules/predict/predict.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from 'src/common/cron/cron.module';

@Module({
	imports: [ScheduleModule.forRoot(), CronModule],
	controllers: [AppController, PuppeteerController, PredictController],
	providers: [AppService, PuppeteerService, PredictService],
})
export class AppModule {}
