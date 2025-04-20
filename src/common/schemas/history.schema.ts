import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LotteryType } from '@/types/index';

import { Document, Schema as MongooseSchema } from 'mongoose';

export interface HistoryBase {
	date: string;
	type: LotteryType;
	numbers: string[];
}
export type HistoryDocument = HistoryBase & Document;

@Schema({ collection: 'history', timestamps: true })
export class PredictHistory {
	@Prop({ type: Date, required: true })
	date: string;

	@Prop({
		type: String,
		enum: ['Mega645', 'Power655', 'Max3D'],
		required: true,
	})
	type: LotteryType;

	@Prop({ type: [String], required: true })
	numbers: string[];

	@Prop({
		type: Boolean,
		required: false,
		default: false,
	})
	isAI?: boolean;

	@Prop({
		type: MongooseSchema.Types.ObjectId,
		// ref: 'User',
		required: true,
	})
	userId: string;
}

export const PredictHistorySchema =
	SchemaFactory.createForClass(PredictHistory);
// PredictHistorySchema.index({ userId: 1, date: -1 });
