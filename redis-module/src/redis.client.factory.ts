import { FactoryProvider } from '@nestjs/common';
import { Redis, RedisOptions } from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisClientFactory: FactoryProvider<Redis> = {
	provide: REDIS_CLIENT,
	useFactory: (options?: RedisOptions) => {
        // console.log(123, options);
		const config: RedisOptions = {
			host: options?.host || process.env.REDIS_HOST || 'localhost',
			port: options?.port || Number(process.env.REDIS_PORT) || 6379,
			username: options?.username || process.env.REDIS_USERNAME || '',
			password: options?.password || process.env.REDIS_PASSWORD || '',
			db: options?.db || Number(process.env.REDIS_DB) || 0,
		};

		const redisInstance = new Redis(config);

		redisInstance.on('connect', () => {
			console.log(`✅ Redis connected to ${config.host}:${config.port}`);
		});

		redisInstance.on('error', (e) => {
			console.error(`❌ Redis connection failed:`, e);
		});

		return redisInstance;
	},
	inject: ['REDIS_OPTIONS'],
};
