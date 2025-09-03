import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisRepositoryInterface } from './redis-repository.interface';
import { REDIS_CLIENT } from './redis.client.factory';

export const REDIS_REPOSITORY = 'REDIS_REPOSITORY';

@Injectable()
export class RedisRepository implements OnModuleDestroy, RedisRepositoryInterface {
	constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

	onModuleDestroy(): void {
		if (this.redisClient.status === 'ready') {
			this.redisClient.disconnect();
			console.log('✅ Redis client disconnected');
		}
	}

	async get(prefix: string, key: string): Promise<string | null> {
		return this.redisClient.get(`${prefix}:${key}`);
	}

	async set(prefix: string, key: string, value: string): Promise<void> {
		await this.redisClient.set(`${prefix}:${key}`, value);
	}

	async delete(prefix: string, key: string): Promise<void> {
		await this.redisClient.del(`${prefix}:${key}`);
	}

	async setWithExpiry(prefix: string, key: string, value: string, expiry: number): Promise<void> {
		await this.redisClient.set(`${prefix}:${key}`, value, 'EX', expiry);
	}
}