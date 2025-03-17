import { Inject, Injectable } from '@nestjs/common';
import { RedisRepository } from './redis.repository';

// const oneDayInSeconds = 60 * 60 * 24;
// const tenMinutesInSeconds = 60 * 10;

@Injectable()
export class RedisService {
	constructor(
		@Inject(RedisRepository)
		private readonly redisRepository: RedisRepository,
	) {}

	// Get data from Redis cache
	async get(prefix: string, key: string): Promise<string | null> {
		return this.redisRepository.get(prefix, key);
	}

	// Set data in Redis cache
	async set(prefix: string, key: string, value: string): Promise<void> {
		await this.redisRepository.set(prefix, key, value);
	}

	// Set data in Redis with expiry time (in seconds)
	async setWithExpiry(
		prefix: string,
		key: string,
		value: string,
		expiry: number,
	): Promise<void> {
		if (expiry) {
			await this.redisRepository.setWithExpiry(
				prefix,
				key,
				value,
				expiry,
			);
		} else {
			await this.set(prefix, key, value); // No expiry
		}
	}

	// Delete data from Redis
	async delete(prefix: string, key: string): Promise<void> {
		await this.redisRepository.delete(prefix, key);
	}
}
