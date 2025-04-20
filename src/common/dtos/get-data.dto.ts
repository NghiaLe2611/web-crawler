import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Matches } from 'class-validator';
import { LotteryType } from 'src/types';

export class GetDataDto {
	@IsOptional()
	@IsInt()
	@Type(() => Number)
	count: number;

	@IsEnum(['Mega645', 'Power655', 'Max3D'])
	type: LotteryType;

	@IsOptional()
	@Matches(/^\d{2}-\d{2}-\d{4}$/, {
		message: 'fromDate must be in format dd-MM-yyyy',
	})
	fromDate?: string;

	@IsOptional()
	@Matches(/^\d{2}-\d{2}-\d{4}$/, {
		message: 'toDate must be in format dd-MM-yyyy',
	})
	toDate?: string;

	// @IsString()
	// userId: string;
}
