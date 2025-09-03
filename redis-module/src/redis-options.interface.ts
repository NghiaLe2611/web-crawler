export interface RedisModuleOptions {
	url?: string;
	host?: string;
	port?: number;
	password?: string;
	db?: number;
	keyPrefix?: string;
}

export interface RedisModuleAsyncOptions {
	useFactory: (...args: any[]) => Promise<RedisModuleOptions> | RedisModuleOptions;
	inject?: any[];
	imports?: any[];
}
