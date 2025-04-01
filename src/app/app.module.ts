import { HistoryModule } from './../modules/history/history.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { Connection } from 'mongoose';
import { CrawlController } from 'src/modules/crawl/crawl.controller';
import { CrawlModule } from 'src/modules/crawl/crawl.module';
import { CrawlService } from 'src/modules/crawl/crawl.service';
import { PredictController } from 'src/modules/predict/predict.controller';
import { PredictModule } from 'src/modules/predict/predict.module';
import { PredictService } from 'src/modules/predict/predict.service';
import { RedisModule } from 'src/modules/redis/redis.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HistoryController } from '@/modules/history/history.controller';
import { HistoryService } from '@/modules/history/history.service';

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
		RedisModule.forRoot(),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: async () => ({
				uri: process.env.MONGODB_URI,
				onConnectionCreate: (connection: Connection) => {
					connection.on('connected', () =>
						console.log('Mongoose connected'),
					);
					connection.on('disconnected', () =>
						console.log('Mongoose disconnected'),
					);
					connection.on('error', (error) => console.log(error));
					return connection;
				},
			}),
			// inject: [ConfigService],
		}),
		CrawlModule,
		PredictModule,
		HistoryModule,
	],
	controllers: [
		AppController,
		CrawlController,
		PredictController,
		// HistoryController,
	],
	providers: [
		AppService,
		CrawlService,
		PredictService,
		// HistoryService
	],
})
export class AppModule {}
// export class AppModule implements OnModuleInit {
// 	onModuleInit() {
// 		const connection = mongoose.connection;
// 		connection.on('connected', () => {
// 			console.log('MongoDB connected successfully');
// 		});
// 		connection.on('error', (error) => {
// 			console.error('MongoDB connection failed:', error);
// 		});
// 		connection.on('disconnected', () => {
// 			console.warn('MongoDB disconnected');
// 		});
// 	}
// }
