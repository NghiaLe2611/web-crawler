import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LotteryType } from '@/types/index';

import { Document } from 'mongoose';

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
}

export const PredictHistorySchema =
	SchemaFactory.createForClass(PredictHistory);
