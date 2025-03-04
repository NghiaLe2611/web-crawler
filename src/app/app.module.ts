import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CrawlController } from 'src/modules/crawl/crawl.controller';
import { CrawlModule } from 'src/modules/crawl/crawl.module';
import { CrawlService } from 'src/modules/crawl/crawl.service';
import { PredictController } from 'src/modules/predict/predict.controller';
import { PredictService } from 'src/modules/predict/predict.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath:
				process.env.NODE_ENV === 'production'
					? '.env.production'
					: '.env',
			isGlobal: true, // Makes ConfigModule available globally
		}),
		ScheduleModule.forRoot(),
		CrawlModule,
	],
	controllers: [AppController, CrawlController, PredictController],
	providers: [AppService, CrawlService, PredictService],
})
export class AppModule {}
