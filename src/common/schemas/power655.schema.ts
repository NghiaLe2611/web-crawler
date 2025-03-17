import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Jackpot, LotteryBase } from './lottery.schema';

export type Power655Document = Power655 & Document;

@Schema({ collection: 'power655', timestamps: true })
export class Power655 implements LotteryBase {
	// @Prop({ required: true, unique: true })
	@Prop({ type: Date, required: true, index: true })
	date: string;

	@Prop({ type: [String], required: true })
	numbers: string[];

	@Prop({ type: Jackpot, required: true })
	jackpot1: Jackpot;

	@Prop({ type: Jackpot, required: false }) // Power655 có jackpot2
	jackpot2?: Jackpot;
}

export const Power655Schema = SchemaFactory.createForClass(Power655);
