import { Module } from '@nestjs/common';
import { PredictService } from './predict.service';
import { PredictController } from './predict.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
	imports: [HttpModule],
	controllers: [PredictController],
	providers: [PredictService],
})
export class PredictModule {}
