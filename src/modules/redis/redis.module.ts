import { DynamicModule, Module } from '@nestjs/common';

import { RedisRepository } from './redis.repository';
import { RedisService } from './redis.service';
import { redisClientFactory } from './redis.client.factory';

@Module({
	imports: [],
	controllers: [],
	providers: [redisClientFactory, RedisRepository, RedisService],
	exports: [RedisService],
})
export class RedisModule {
	static forRoot(): DynamicModule {
		return {
			module: RedisModule,
			global: true,
			providers: [RedisService],
			exports: [RedisService],
		};
	}
}
