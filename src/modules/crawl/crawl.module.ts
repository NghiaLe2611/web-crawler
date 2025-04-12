import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Mega645, Mega645Schema } from 'src/common/schemas/mega645.schema';
import { Power655, Power655Schema } from 'src/common/schemas/power655.schema';
import { CrawlController } from './crawl.controller';
import { CrawlService } from './crawl.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
	imports: [
		CacheModule.register({
			isGlobal: true,
		}),
		MongooseModule.forFeature([
			// {
			// 	name: Lottery.name,
			// 	schema: LotterySchema,
			// },
			{ name: Mega645.name, schema: Mega645Schema },
			{ name: Power655.name, schema: Power655Schema },
		]),
		HttpModule,
		// RedisModule
	],
	controllers: [CrawlController],
	providers: [CrawlService],
	exports: [
		// Export the MongooseModule to make models available elsewhere
		MongooseModule.forFeature([
			{ name: Mega645.name, schema: Mega645Schema },
			{ name: Power655.name, schema: Power655Schema },
		]),
	],
})
export class CrawlModule {}
