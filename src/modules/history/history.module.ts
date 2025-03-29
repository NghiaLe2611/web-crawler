import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
	PredictHistory,
	PredictHistorySchema,
} from 'src/common/schemas/history.schema';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: PredictHistory.name, schema: PredictHistorySchema },
		]),
		// RedisModule
	],
	controllers: [HistoryController],
	providers: [HistoryService],
	exports: [
		MongooseModule.forFeature([
			{ name: PredictHistory.name, schema: PredictHistorySchema },
		]),
	],
})
export class HistoryModule {}
