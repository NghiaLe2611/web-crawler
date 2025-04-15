import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LotteryType } from '@/types/index';

@Schema({ collection: 'train_history', timestamps: true })
export class TrainModelHistory {
	@Prop({
		type: String,
		enum: ['Mega645', 'Power655', 'Max3D'],
		required: true,
	})
	type: LotteryType;

	@Prop({ type: String, required: true })
	optimizer;

	@Prop({ type: String, required: true })
	loss;
}

export const TrainModelSchema = SchemaFactory.createForClass(TrainModelHistory);
