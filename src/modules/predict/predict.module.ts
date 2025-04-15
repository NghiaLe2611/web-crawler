import { Module } from '@nestjs/common';
import { PredictService } from './predict.service';
import { PredictController } from './predict.controller';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import {
	TrainModelHistory,
	TrainModelSchema,
} from '@/common/schemas/train_history.schema';

@Module({
	imports: [
		HttpModule,
		MongooseModule.forFeature([
			{ name: TrainModelHistory.name, schema: TrainModelSchema },
		]),
	],
	controllers: [PredictController],
	providers: [PredictService],
	exports: [
		MongooseModule.forFeature([
			{ name: TrainModelHistory.name, schema: TrainModelSchema },
		]),
	],
})
export class PredictModule {}
