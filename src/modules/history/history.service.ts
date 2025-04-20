import { GetDataDto } from '@/common/dtos/get-data.dto';
import { convertToMongoDate } from '@/utils/date.utils';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { format } from 'date-fns';
import { Model, Types } from 'mongoose';
import {
    PredictHistory
} from 'src/common/schemas/history.schema';
import {
    CreatePredictHistoryDto,
    UpdatePredictHistoryDto,
} from './dtos/history.dto';

@Injectable()
export class HistoryService {
	constructor(
		@InjectModel(PredictHistory.name)
		private historyModel: Model<PredictHistory>,
	) {}

	// async create(
	// 	createHistoryDto: CreatePredictHistoryDto,
	// ): Promise<PredictHistory> {
	// 	const createdHistory = new this.historyModel(createHistoryDto);
	// 	return createdHistory.save();
	// }
	async create(
		createHistoryDto: CreatePredictHistoryDto,
		userId: string,
	): Promise<PredictHistory> {
		// Promise<{ data: PredictHistory; isUpdated?: boolean }>
		// Extract date from the DTO
		const predictionDate = createHistoryDto.date;

		const startOfDay = new Date(predictionDate);
		startOfDay.setUTCHours(0, 0, 0, 0);

		const endOfDay = new Date(predictionDate);
		endOfDay.setUTCHours(23, 59, 59, 999);

		// Check if prediction already exists
		// const existingPrediction = await this.historyModel.findOne({
		// 	date: {
		// 		$gte: startOfDay,
		// 		$lte: endOfDay,
		// 	},
		// 	type: createHistoryDto.type,
		// });

		// Update
		// if (existingPrediction) {
		// 	const updatedPrediction = await this.historyModel.findByIdAndUpdate(
		// 		existingPrediction._id,
		// 		{ ...createHistoryDto },
		// 		{ new: true },
		// 	);

		// 	return { data: updatedPrediction, isUpdated: true };
		// }

		// Create new
		const createdHistory = new this.historyModel({
			...createHistoryDto,
			userId,
		});
		const savedHistory = await createdHistory.save();
		return savedHistory;
	}

	// async findAll(): Promise<PredictHistory[]> {
	// 	return this.historyModel.find().exec();
	// }

	async findAll(query: GetDataDto, userId: string) {
		try {
			const limit = query.count ?? 100;
			const lotteryModel = this.historyModel;
			const dbQuery: any = { type: query.type, userId: userId };

			if (query.fromDate) {
				const formattedFrom = convertToMongoDate(query.fromDate);
				const formattedTo = query.toDate
					? convertToMongoDate(query.toDate)
					: convertToMongoDate(format(new Date(), 'dd-MM-yyyy'));

				dbQuery.date = { $gte: formattedFrom, $lte: formattedTo };
			}

			return await lotteryModel
				.find(dbQuery)
				.sort({ date: -1 })
				.limit(limit)
				.exec();
		} catch (error) {
			throw error;
		}
	}

	async findByType(type: string): Promise<PredictHistory[]> {
		return this.historyModel.find({ type }).exec();
	}

	// Schema.Types.ObjectId
	async findById(id: string): Promise<PredictHistory> {
        if (!Types.ObjectId.isValid(id)) {
			throw new NotFoundException(`History with not found`);
		}

		const history = await this.historyModel.findById(id).exec();
		if (!history) {
			throw new NotFoundException(`History with not found`);
		}
		return history;
	}

	async update(
		id: string,
		updateHistoryDto: UpdatePredictHistoryDto,
	): Promise<PredictHistory> {
		// const updatedHistory = await this.historyModel
		// 	.findByIdAndUpdate(id, updateHistoryDto, { new: true })
		// 	.exec();
		const updatedHistory = await this.historyModel
			.findByIdAndUpdate(id, { $set: updateHistoryDto }, { new: true })
			.exec();
		if (!updatedHistory) {
			throw new NotFoundException(`History not found`);
		}

		return updatedHistory;
	}

	async delete(id: string, userId: string): Promise<PredictHistory> {
		const deletedHistory = await this.historyModel
			.findOneAndDelete({ _id: id, userId })
			.exec();

		if (!deletedHistory) {
			throw new NotFoundException(`History not found`);
		}

		return deletedHistory;
	}
}
