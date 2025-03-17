import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Jackpot, LotteryBase } from './lottery.schema';

export type Mega645Document = Mega645 & Document;

@Schema({ collection: 'mega645', timestamps: true })
export class Mega645 implements LotteryBase {
	// @Prop({ required: true, unique: true })
	@Prop({ type: Date, required: true, index: true })
	date: string;

	@Prop({ type: [String], required: true })
	numbers: string[];

	@Prop({ type: Jackpot, required: true })
	jackpot1: Jackpot;
}

export const Mega645Schema = SchemaFactory.createForClass(Mega645);
