import { HistoryModule } from './../modules/history/history.module';
import {
	MiddlewareConsumer,
	Module,
	NestModule,
	RequestMethod,
} from '@nestjs/common';
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
import { AuthModule } from '@/modules/auth/auth.module';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { HttpModule } from '@nestjs/axios';
import { AuthMiddleware } from '@/middlewares/auth.middleware';
// import { HistoryController } from '@/modules/history/history.controller';
// import { HistoryService } from '@/modules/history/history.service';

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
		HttpModule,
		CrawlModule,
		PredictModule,
		HistoryModule,
		AuthModule,
	],
	controllers: [
		AppController,
		CrawlController,
		PredictController,
		AuthController,
		// HistoryController,
	],
	providers: [
		AppService,
		CrawlService,
		PredictService,
		AuthService,
		// HistoryService
	],
})

// export class AppModule {}
export class AppModule implements NestModule {
	protected protectedRoutes = ['get:/crawl/update'];

	// configure(consumer: MiddlewareConsumer) {
	// 	consumer
	// 		.apply(AuthMiddleware)
	// 		.forRoutes({ path: 'auth/secure', method: RequestMethod.GET });
	// }

	configure(consumer: MiddlewareConsumer) {
		const protectedRoutes = [
			'get:/crawl/update',
			'get:/crawl/save',
			'post:/crawl/cache*',
			'post:/analyze/train',
			'post:/analyze/trainAll',
			'delete:/analyze/delete',
		];

		const methodMap = {
			get: RequestMethod.GET,
			post: RequestMethod.POST,
			put: RequestMethod.PUT,
			delete: RequestMethod.DELETE,
			patch: RequestMethod.PATCH,
			all: RequestMethod.ALL,
		};

		const parsedRoutes = protectedRoutes.map((entry) => {
			const [method, path] = entry.split(':');
			return {
				path,
				method: methodMap[method.toLowerCase()] ?? RequestMethod.ALL,
			};
		});

		consumer.apply(AuthMiddleware).forRoutes(...parsedRoutes);
	}
}

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
