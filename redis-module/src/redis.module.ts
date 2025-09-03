import { DynamicModule, Module, Provider } from '@nestjs/common';
import { redisClientFactory, REDIS_CLIENT } from './redis.client.factory';
import { RedisRepository, REDIS_REPOSITORY } from './redis.repository';
import { RedisService } from './redis.service';
import { RedisModuleOptions, RedisModuleAsyncOptions } from './redis-options.interface';
import { RedisOptions } from 'ioredis';

@Module({})
export class RedisModule {
	/**
	 * Registers the RedisModule with default configuration (uses environment variables).
	 */
	static forRoot(): DynamicModule {
		const defaultOptions: RedisOptions = {
			host: process.env.REDIS_HOST || 'localhost',
			port: Number(process.env.REDIS_PORT) || 6379,
			username: process.env.REDIS_USERNAME || '',
			password: process.env.REDIS_PASSWORD || '',
			db: Number(process.env.REDIS_DB) || 0,
		};

		return {
			module: RedisModule,
			global: true,
			providers: [
				{ provide: 'REDIS_OPTIONS', useValue: defaultOptions },
				redisClientFactory,
				{ provide: REDIS_REPOSITORY, useClass: RedisRepository },
				RedisService,
			],
			exports: [RedisService, REDIS_CLIENT],
		};
	}

	/**
	 * Registers the RedisModule with synchronous options.
	 * @param options - Redis connection options.
	 */
	static register(options: RedisModuleOptions): DynamicModule {
		return {
			module: RedisModule,
			global: true,
			providers: [
				{ provide: 'REDIS_OPTIONS', useValue: options },
				redisClientFactory,
				{ provide: REDIS_REPOSITORY, useClass: RedisRepository },
				RedisService,
			],
			exports: [RedisService, REDIS_CLIENT],
		};
	}

	/**
	 * Registers the RedisModule with asynchronous options (e.g., from a config service).
	 * @param options - Async options including useFactory and inject.
	 */
	static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
		const asyncProviders = this.createAsyncProviders(options);

		return {
			module: RedisModule,
			global: true,
			imports: options.imports || [],
			providers: [
				...asyncProviders,
				redisClientFactory,
				{ provide: REDIS_REPOSITORY, useClass: RedisRepository },
				RedisService,
			],
			exports: [RedisService, REDIS_CLIENT],
		};
	}

	/**
	 * Creates providers for async options.
	 * @param options - Async options to create providers from.
	 */
	private static createAsyncProviders(options: RedisModuleAsyncOptions): Provider[] {
		if (!options.useFactory) {
			throw new Error('forRootAsync requires a useFactory function');
		}

		return [
			{
				provide: 'REDIS_OPTIONS',
				useFactory: options.useFactory,
				inject: options.inject || [],
			},
		];
	}
}
