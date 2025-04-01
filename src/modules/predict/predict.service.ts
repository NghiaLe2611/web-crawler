import { Injectable, NotFoundException } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import { MAX_NUMBER, NUMBERS } from 'src/constants';
import { LotteryType } from 'src/types';
import { RedisService } from '../redis/redis.service';

// Window Size (w): Determines the number of previous data points used as input features to predict the next data point.
const WINDOW_LENGTH = 2;
// const BATCH_SIZE = 32;

// function shuffleArray(array) {
// 	for (let i = array.length - 1; i > 0; i--) {
// 		const j = Math.floor(Math.random() * (i + 1));
// 		[array[i], array[j]] = [array[j], array[i]]; // Using destructuring assignment for swapping
// 	}
// }

// function shuffleArrayOfArrays(arrayOfArrays) {
// 	arrayOfArrays.forEach(shuffleArray); // Apply shuffle to each sub-array
// }

interface Metrics {
	loss: number;
	mse: number;
	mae: number;
	acc: number;
}

@Injectable()
export class PredictService {
	constructor(private readonly redisService: RedisService) {}
	private CACHE_PREFIX = 'lottery_data';

	private getModelPath(
		lotteryType: LotteryType,
		optimizer: string,
		loss: string,
	): string {
		// const modelPath = path.resolve(
		// 	process.cwd(),
		// 	'models',
		// 	`model_${optimizer}_${loss}`,
		// );

		// const modelPath = path.resolve(__dirname, `models/model_${optimizer}_${loss}`);
		const modelDir = path.resolve(process.cwd(), `models/${lotteryType}`);
		const modelPath = path.resolve(modelDir, `model_${optimizer}_${loss}`);

		return modelPath;
	}

	// private getAccuracyPath(modelPath: string): string {
	// 	return path.join(modelPath, 'accuracy.json');
	// }

	// async saveAccuracy(modelPath: string, accuracy: number): Promise<void> {
	// 	const accuracyPath = this.getAccuracyPath(modelPath);
	// 	const accuracyData = JSON.stringify({ accuracy }, null, 2);
	// 	fs.writeFileSync(accuracyPath, accuracyData);
	// }

	// async loadAccuracy(modelPath: string): Promise<number | null> {
	// 	const accuracyPath = this.getAccuracyPath(modelPath);
	// 	if (fs.existsSync(accuracyPath)) {
	// 		const accuracyData = fs.readFileSync(accuracyPath, 'utf-8');
	// 		const { accuracy } = JSON.parse(accuracyData);
	// 		return accuracy;
	// 	}
	// 	return null;
	// }

	private getMetrics(modelPath: string): string {
		return path.join(modelPath, 'mse.json');
	}

	async saveMetrics(modelPath: string, metrics: Metrics): Promise<void> {
		const msePath = this.getMetrics(modelPath);
		const mseData = JSON.stringify(metrics, null, 2);
		fs.writeFileSync(msePath, mseData);
	}

	async loadMetrics(modelPath: string): Promise<Metrics | null> {
		const msePath = this.getMetrics(modelPath);
		if (fs.existsSync(msePath)) {
			const mseData = fs.readFileSync(msePath, 'utf-8');
			const metrics = JSON.parse(mseData);
			return metrics;
		}
		return null;
	}

	async createNewModel(
		optimizer: string,
		loss: string,
		windowLength: number,
		numberOfFeatures: number,
	) {
		// Create the LSTM model
		const model = tf.sequential();
		model.add(
			tf.layers.lstm({
				units: 50,
				inputShape: [windowLength, numberOfFeatures],
				returnSequences: true,
			}),
		);
		model.add(tf.layers.dropout({ rate: 0.2 })); // Dropout for regularization
		model.add(tf.layers.lstm({ units: 50 })); // Second LSTM layer
		model.add(tf.layers.dropout({ rate: 0.2 })); // Dropout for regularization
		model.add(tf.layers.dense({ units: numberOfFeatures })); // Dense output layer (6 features)

		model.compile({
			optimizer,
			loss,
			metrics: ['accuracy'],
		});

		return model;
	}

	async saveModel(
		model,
		lotteryType: LotteryType,
		optimizer: string,
		loss: string,
	) {
		const modelPath = this.getModelPath(lotteryType, optimizer, loss);

		// Ensure the models directory exists, create it if not
		if (!fs.existsSync(path.dirname(modelPath))) {
			fs.mkdirSync(path.dirname(modelPath), { recursive: true });
		}

		// Save the model
		await model.save(`file://${modelPath}`);
		console.log(`Model saved to ${modelPath}`);

		return modelPath;
	}

	async loadModel(modelPath: string) {
		if (fs.existsSync(modelPath)) {
			return await tf.loadLayersModel(`file://${modelPath}/model.json`);
		} else {
			throw new Error(`Model at ${modelPath} does not exist.`);
		}
	}

	async loadOrCreateModel(
		lotteryType: LotteryType,
		optimizer: string,
		loss: string,
		windowLength: number,
		numberOfFeatures: number,
	) {
		const modelPath = this.getModelPath(lotteryType, optimizer, loss);
		let model;

		if (fs.existsSync(modelPath)) {
			console.log('Load model');
			model = await tf.loadLayersModel(`file://${modelPath}/model.json`);

			model.compile({
				optimizer,
				loss,
				metrics: ['accuracy'],
			});
		} else {
			console.log('Create new model');
			model = await this.createNewModel(
				optimizer,
				loss,
				windowLength,
				numberOfFeatures,
			);
		}

		return model;
	}

	async trainModel(
		lotteryType: LotteryType = 'Power655',
		lotteryHistory: Record<string, any>[],
		optimizer: string,
		loss: string,
		epochs: number,
	) {
		const numberOfRows = lotteryHistory.length;
		const maxNumber = MAX_NUMBER[lotteryType];
		const numberOfFeatures = NUMBERS[lotteryType];

		// Kiểm tra số lượng dữ liệu đầu vào
		if (numberOfRows <= WINDOW_LENGTH) {
			throw new Error(
				`Not enough data points to create training examples. Need more than ${WINDOW_LENGTH} data points.`,
			);
		}

		// Chuẩn hóa dữ liệu
		const scaledLotteryHistory = lotteryHistory.map((row) => {
			const numbers = Array.isArray(row)
				? row.slice(0, 6)
				: Object.values(row).slice(0, 6);
			if (numbers.length !== 6) {
				throw new Error(
					`Each lottery draw must contain exactly 6 numbers, got ${numbers.length}`,
				);
			}
			return numbers.map((num) => num / maxNumber);
		});

		// Chuẩn bị dữ liệu train & label
		const train = [];
		const label = [];
		for (let i = 0; i < numberOfRows - WINDOW_LENGTH; i++) {
			const window = scaledLotteryHistory.slice(i, i + WINDOW_LENGTH);
			train.push(window);
			label.push(scaledLotteryHistory[i + WINDOW_LENGTH]);
		}

		const trainTensor = tf.tensor3d(train, [
			train.length,
			WINDOW_LENGTH,
			numberOfFeatures,
		]);
		const labelTensor = tf.tensor2d(label, [
			label.length,
			numberOfFeatures,
		]);

		let model;
		const modelPath = this.getModelPath(lotteryType, optimizer, loss);

		let isIncremental = false;
		try {
			model = await this.loadModel(modelPath);
			console.log(
				'Existing model found. Performing incremental learning.',
			);

			// Freeze tất cả lớp trừ lớp cuối cùng
			for (let i = 0; i < model.layers.length - 2; i++) {
				model.layers[i].trainable = false;
			}

			// Fine-tuning
			let learningRate = 0.001;

			if (optimizer === 'rmsprop' && loss === 'meanSquaredError') {
				learningRate = 0.0005;
			} else if (optimizer === 'adam' && loss === 'meanAbsoluteError') {
				learningRate = 0.0005;
			} else if (optimizer === 'adam' && loss === 'huberLoss') {
				learningRate = 0.001;
			}
			const newOptimizer =
				optimizer === 'adam'
					? tf.train.adam(learningRate)
					: tf.train.rmsprop(learningRate);

			model.compile({
				optimizer: newOptimizer,
				loss: loss,
				metrics: ['mse', 'mae', 'accuracy'],
			});
			isIncremental = true;
		} catch (error) {
			// Tạo mới mô hình
			console.log('No existing model found. Creating a new model.');
			model = await this.createNewModel(
				optimizer,
				loss,
				WINDOW_LENGTH,
				numberOfFeatures,
			);
		}

		let lastEpochLogs;

		// Huấn luyện mô hình
		await model.fit(trainTensor, labelTensor, {
			epochs,
			shuffle: true,
			callbacks: {
				onEpochEnd: (epoch, logs) => {
					console.log('lastEpochLogs', lastEpochLogs);
					lastEpochLogs = logs;
				},
			},
		});

		const savePath = await this.saveModel(
			model,
			lotteryType,
			optimizer,
			loss,
		);

		// Dọn dẹp bộ nhớ
		// trainTensor.dispose();
		// labelTensor.dispose();

		if (lastEpochLogs) {
			await this.saveMetrics(savePath, lastEpochLogs);
			// MSE càng nhỏ càng tốt, accuracy ngược lại
		}

		return {
			model,
			modelPath: savePath,
			lastEpochLogs,
			existed: isIncremental,
		};
	}

	// Train all history
	async trainAll(
		lotteryType: LotteryType = 'Power655',
		optimizer: string,
		loss: string,
		epochs: number,
	) {
		const lotteryHistory = await this.redisService.get(
			this.CACHE_PREFIX,
			lotteryType,
		);

        throw new NotFoundException(`History not found`);

        if (!lotteryHistory) {
            return;
        } 
        
        // return JSON.parse(lotteryHistory);

        const maxNumber = MAX_NUMBER[lotteryType];
		const numberOfFeatures = NUMBERS[lotteryType];
		const numberOfRows = lotteryHistory.length;

		if (numberOfRows <= WINDOW_LENGTH) {
			throw new Error(
				`Not enough data points to create training examples. Need more than ${WINDOW_LENGTH} data points.`,
			);
		}

		const scaledLotteryHistory = lotteryHistory.map((row) => {
			const numbers = Array.isArray(row.numbers)
				? row.numbers.slice(0, 6)
				: [];
			if (numbers.length !== 6) {
				throw new Error(
					`Each lottery draw must contain exactly 6 numbers, got ${numbers.length}`,
				);
			}
			return numbers.map((num) => num / maxNumber);
		});

		const train = [];
		const label = [];
		for (let i = 0; i < numberOfRows - WINDOW_LENGTH; i++) {
			const window = scaledLotteryHistory.slice(i, i + WINDOW_LENGTH);
			train.push(window);
			label.push(scaledLotteryHistory[i + WINDOW_LENGTH]);
		}

		const trainTensor = tf.tensor3d(train, [
			train.length,
			WINDOW_LENGTH,
			numberOfFeatures,
		]);
		const labelTensor = tf.tensor2d(label, [
			label.length,
			numberOfFeatures,
		]);

		let model = await this.createNewModel(
			optimizer,
			loss,
			WINDOW_LENGTH,
			numberOfFeatures,
		);

		let learningRate = 0.001;

		if (optimizer === 'rmsprop' && loss === 'meanSquaredError') {
			learningRate = 0.0005;
		} else if (optimizer === 'adam' && loss === 'meanAbsoluteError') {
			learningRate = 0.0005;
		} else if (optimizer === 'adam' && loss === 'huberLoss') {
			learningRate = 0.001;
		}
		const newOptimizer =
			optimizer === 'adam'
				? tf.train.adam(learningRate)
				: tf.train.rmsprop(learningRate);

		model.compile({
			optimizer: newOptimizer,
			loss: loss,
			metrics: ['mse', 'mae', 'accuracy'],
		});

		let lastEpochLogs;

		// Huấn luyện mô hình
		await model.fit(trainTensor, labelTensor, {
			epochs,
			shuffle: true,
			callbacks: {
				onEpochEnd: (epoch, logs) => {
					lastEpochLogs = logs;
				},
			},
		});

		// Lưu mô hình
		const savePath = await this.saveModel(
			model,
			lotteryType,
			optimizer,
			loss,
		);

		// Dọn dẹp bộ nhớ
		// trainTensor.dispose();
		// labelTensor.dispose();

		if (lastEpochLogs) {
			await this.saveMetrics(savePath, lastEpochLogs);
		}

		return {
			model,
			modelPath: savePath,
			lastEpochLogs,
			existed: false,
		};
	}

	async predict(
		lotteryType: LotteryType = 'Power655',
		history: number[][],
		modelPath: string,
	) {
		const model = await this.loadModel(modelPath);
		const mse = await this.loadMetrics(modelPath);

		const toPredict = history.slice(0, 2);
		// Normalize the prediction input
		// const scaledToPredict = toPredict.map((row) =>
		// 	row.map((value) => value / MAX_NUMBER[lotteryType]),
		// );
		const scaledToPredict = toPredict.map((row) => {
			const numbers = row.slice(0, 6);
			if (numbers.length !== 6) {
				throw new Error(
					`Each prediction input must contain exactly 6 numbers, got ${numbers.length}`,
				);
			}
			return numbers.map((value) => value / MAX_NUMBER[lotteryType]);
		});
		const predictionTensor = tf.tensor3d([scaledToPredict]);
		const scaledPredictionOutput = model.predict(predictionTensor);
		// const predictionOutput = scaledPredictionOutput.arraySync()[0];

		let predictionOutputArray;

		if (Array.isArray(scaledPredictionOutput)) {
			predictionOutputArray = scaledPredictionOutput[0].arraySync();
		} else {
			predictionOutputArray = scaledPredictionOutput.arraySync();
		}

		// Ensure predictionOutputArray is of type number[][]
		if (!Array.isArray(predictionOutputArray)) {
			throw new Error('Prediction output is not an array');
		}

		const predictionOutput = predictionOutputArray.flat();
		// Reverse the scaling
		/*
            If you normalized the data by dividing each number by a maximum value (e.g., 55), you need to multiply the normalized values by the maximum value to revert them to the original scale.
            After reversing the normalization, round the values to the nearest integers if your original data consists of discrete numbers (like lottery numbers).
		*/
		return {
			data: predictionOutput.map((value) =>
				Math.round(value * MAX_NUMBER[lotteryType]),
			),
			mse,
		};
	}

	async cleanModel(modelName: string) {
		// const folderPath = path.resolve(process.cwd(), 'models', modelName);
		const folderPath = path.resolve(
			process.cwd(),
			'models',
			modelName.trim(),
		);

		try {
			if (fs.existsSync(folderPath)) {
				fs.rmSync(folderPath, { recursive: true, force: true });
				console.log(`Folder ${modelName} deleted successfully.`);
			} else {
				console.log(`Folder ${modelName} does not exist.`);
			}
		} catch (error) {
			console.error(
				`Error deleting folder ${modelName}: ${error.message}`,
			);
		}
	}

	// predict(data) {
	// 	const rootDir = process.cwd();
	// 	const fileName = path.join(rootDir, 'python', 'app.py');
	// 	// const pythonProcess = spawn('python', [fileName, JSON.stringify(data)]);

	// 	return new Promise((resolve, reject) => {
	// 		const pythonProcess = spawn('python', [
	// 			fileName,
	// 			JSON.stringify(data),
	// 		]);

	// 		let result = null;
	// 		let error = '';

	// 		pythonProcess.stdout.on('data', (data) => {
	// 			result = data.toString();
	// 		});

	// 		pythonProcess.stderr.on('data', (data) => {
	// 			error += data.toString();
	// 		});

	// 		pythonProcess.on('close', (code) => {
	// 			if (code !== 0) {
	// 				reject(
	// 					new Error(
	// 						`Python script exited with code ${code}. Error: ${error}`,
	// 					),
	// 				);
	// 			} else {
	// 				resolve(result.trim());
	// 			}
	// 		});
	// 	});
	// }

	// async runPythonScript(data) {
	// 	return new Promise((resolve, reject) => {
	// 		const pythonProcess = spawn('python', [
	// 			path.join(__dirname, 'train_model.py'),
	// 			JSON.stringify(data),
	// 		]);

	// 		let result = '';
	// 		let error = '';

	// 		pythonProcess.stdout.on('data', (data) => {
	// 			result += data.toString();
	// 		});

	// 		pythonProcess.stderr.on('data', (data) => {
	// 			error += data.toString();
	// 		});

	// 		pythonProcess.on('close', (code) => {
	// 			if (code !== 0) {
	// 				reject(
	// 					new Error(
	// 						`Python script exited with code ${code}. Error: ${error}`,
	// 					),
	// 				);
	// 			} else {
	// 				try {
	// 					const parsedResult = JSON.parse(result);
	// 					resolve(parsedResult);
	// 				} catch (e) {
	// 					reject(
	// 						new Error(
	// 							`Failed to parse Python script output: ${result}`,
	// 						),
	// 					);
	// 				}
	// 			}
	// 		});
	// 	});
	// }

	// async test(optimizer = 'adam', historyData) {
	// 	const lotteryHistory = historyData.map((item) =>
	// 		item.numbers.map((num) => Number(num)),
	// 	);
	// 	const toPredict = lotteryHistory.slice(0, 2);

	// 	const inputData = {
	// 		lottery_history: lotteryHistory,
	// 		to_predict: toPredict,
	// 		optimizer: optimizer,
	// 		max_number: MAX_NUMBER,
	// 	};

	// 	try {
	// 		const result = (await this.runPythonScript(inputData)) as any;
	// 		console.log('Prediction:', result.prediction);
	// 		console.log('Final Loss:', result.final_loss);
	// 		console.log('Final Accuracy:', result.final_accuracy);
	// 	} catch (error) {
	// 		console.error('Error:', error.message);
	// 	}
	// }
}

/*
async trainModel(
    lotteryHistory,
    optimizer = DEFAULT_PREDICT_PARAMS.optimizer,
    loss = DEFAULT_PREDICT_PARAMS.loss,
    epochs = DEFAULT_PREDICT_PARAMS.epochs,
) {
    // Prepare feature and target data
    const features = [];
    const targets = [];

    const reversedHistory = lotteryHistory.slice().reverse();

    for (let i = 0; i < reversedHistory.length - 1; i++) {
        features.push(reversedHistory[i]);
        targets.push(reversedHistory[i + 1]);
    }

    // Convert arrays to tensors with explicit shape
    const xTrain = tf.tensor2d(features, [
        features.length,
        features[0].length,
    ]);
    const yTrain = tf.tensor2d(targets, [
        targets.length,
        targets[0].length,
    ]);

    // Define the model
    const model = tf.sequential();
    model.add(
        tf.layers.dense({
            units: 128,
            activation: 'relu',
            inputShape: [xTrain.shape[1]],
        }),
    );
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(
        tf.layers.dense({ units: xTrain.shape[1], activation: 'linear' }),
    );

    model.compile({
        optimizer, // sdg, rmsprop
        loss, // sparseCategoricalCrossentropy
        metrics: ['accuracy'],
    });

    let lastEpochLogs;

    // Train the model
    await model.fit(xTrain, yTrain, {
        epochs,
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                lastEpochLogs = logs;
                // console.log(
                // 	`Epoch ${epoch + 1}: loss = ${logs.loss}, accuracy = ${logs.acc}`,
                // );
            },
        },
    });

    // Ensure the models directory exists, create it if not
    // const modelPath = path.resolve(__dirname, `models/model_${optimizer}_${loss}`);
    const modelDir = path.resolve(process.cwd(), 'models');
    const modelPath = path.resolve(modelDir, `model_${optimizer}_${loss}`);

    // Ensure the models directory exists, create it if not
    if (!fs.existsSync(path.dirname(modelPath))) {
        fs.mkdirSync(path.dirname(modelPath), { recursive: true });
    }

    // Save the model
    await model.save(`file://${modelPath}`);
    console.log(`Model saved to ${modelPath}`);

    return { model, modelPath, lastEpochLogs };
}

async function handlePredict() {
	const lotteryHistory = data.map((item) =>
		item.numbers.map((num) => Number(num)),
	);
	// Train the model
	const model = await trainModel(lotteryHistory);

	// Make a prediction using the latest data
	const latestData = lotteryHistory[0].slice(0, 7); // Use the most recent 7 numbers as input
	const predictionTensor = model.predict(tf.tensor2d([latestData]));
	const predictedNumbers = predictionTensor.dataSync();
	// const roundedPredictedNumbers = Array.from(predictedNumbers).map((number) => Math.round(number));
	const roundedPredictedNumbers = Array.from(predictedNumbers).map(
		(number) => {
			let roundedNumber = Math.round(number);
			if (roundedNumber < 1) {
				roundedNumber = 1;
			} else if (roundedNumber > 55) {
				roundedNumber = 55;
			}
			return roundedNumber;
		},
	);
	return roundedPredictedNumbers;
}
*/

// Feature Engineering: Thêm các thuộc tính mới vào dữ liệu đầu vào:

// Tần suất xuất hiện của các số
// Khoảng thời gian giữa các lần xuất hiện
// Các mẫu tuần hoàn trong lịch sử

// chống overfiting: model.add(tf.layers.dropout({ rate: 0.2 }));
// sparse_categorical_crossentropy categorical_crossentropy
