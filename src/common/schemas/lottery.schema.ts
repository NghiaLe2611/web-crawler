import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface LotteryBase {
	date: string;
	numbers: string[];
	jackpot1: Jackpot;
	jackpot2?: Jackpot;
}
export type LotteryDocument = LotteryBase & Document;

export class Jackpot {
	@Prop({ required: true })
	value: string;

	@Prop({ required: true })
	isLottery: boolean;
}

@Schema({ collection: 'data', timestamps: true })
export class Lottery {
	// @Prop({ required: true, enum: ['Mega645', 'Power655'] })
	// type: 'Mega645' | 'Power655';

	// @Prop({ required: true, unique: true })
	@Prop({ type: Date, required: true, index: true })
	date: string;

	@Prop({ type: [String], required: true })
	numbers: string[];

	@Prop({ type: Jackpot, required: true })
	jackpot1: Jackpot;

	@Prop({ type: Jackpot, required: false }) // Power655
	jackpot2?: Jackpot;
}

export const LotterySchema = SchemaFactory.createForClass(Lottery);
