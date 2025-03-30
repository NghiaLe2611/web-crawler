import { LotteryType } from '@/types/index';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsDate,
	IsEnum,
	IsOptional,
	IsString,
	Validate,
} from 'class-validator';

import {
	ValidationArguments,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'numbersValidation', async: false })
export class NumbersValidator implements ValidatorConstraintInterface {
	validate(numbers: string[], args: ValidationArguments) {
		// Check if numbers is an array
		if (!Array.isArray(numbers)) return false;

		// Check if exactly 6 items
		if (numbers.length !== 6) return false;

		// Check if all items are valid string numbers
		return numbers.every((num) => {
			// Check if it's a string that represents a valid number
			const parsedNum = parseInt(num, 10);
			return (
				typeof num === 'string' &&
				!isNaN(parsedNum) &&
				parsedNum.toString() === num
			);
		});
	}

	defaultMessage(args: ValidationArguments) {
		return 'Numbers must be an array of 6 valid string numbers';
	}
}

class PredictHistoryDto {
	@IsDate()
	@Type(() => Date)
	date: Date;

	@IsEnum(['Mega645', 'Power655', 'Max3D'])
	type: LotteryType;

	@Validate(NumbersValidator)
	numbers: string[];

	@IsBoolean()
	@IsOptional()
	isAI: boolean = false;
}

export class CreatePredictHistoryDto extends PredictHistoryDto {}

// export class UpdatePredictHistoryDto extends PredictHistoryDto {}
export class UpdatePredictHistoryDto implements Partial<PredictHistoryDto> {
	@IsDate()
	@Type(() => Date)
	@IsOptional()
	date?: Date;

	@Validate(NumbersValidator)
	@IsOptional()
	numbers?: string[];

	@IsBoolean()
	@IsOptional()
	isAI?: boolean;
}
