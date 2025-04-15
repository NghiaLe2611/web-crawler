import { IsEnum, IsString } from 'class-validator';
import { LotteryType } from '@/types';

export class CreateTrainDto {
	@IsEnum(['Mega645', 'Power655', 'Max3D'])
	type: LotteryType;

	@IsString()
	optimizer: string;

	@IsString()
	loss: string;
}
