import { FactoryProvider } from '@nestjs/common';
import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

export const redisClientFactory: FactoryProvider<Redis> = {
	provide: 'RedisClient',
	useFactory: () => {
		const redisInstance = new Redis({
			host: process.env.REDIS_HOST || 'localhost',
			port: +process.env.REDIS_PORT || 6379,
			username: process.env.REDIS_USERNAME || '', // Required for Redis 6+
			password: process.env.REDIS_PASSWORD || '', // Set password
		});

		redisInstance.on('connect', () => {
			console.log(`✅ Redis connected`);
		});

		redisInstance.on('error', (e) => {
			console.error(`❌ Redis connection failed:`, e);
		});

		return redisInstance;
	},
	inject: [],
};
