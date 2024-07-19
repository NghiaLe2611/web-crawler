import { Injectable } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs-node';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { MAX_NUMBER, NUMBERS } from 'src/constants';

// Window Size (w): Determines the number of previous data points used as input features to predict the next data point.
const WINDOW_LENGTH = 2;
const BATCH_SIZE = 32;

// function shuffleArray(array) {
// 	for (let i = array.length - 1; i > 0; i--) {
// 		const j = Math.floor(Math.random() * (i + 1));
// 		[array[i], array[j]] = [array[j], array[i]]; // Using destructuring assignment for swapping
// 	}
// }

// function shuffleArrayOfArrays(arrayOfArrays) {
// 	arrayOfArrays.forEach(shuffleArray); // Apply shuffle to each sub-array
// }

@Injectable()
export class PredictService {
	private getModelPath(optimizer: string, loss: string): string {
		// const modelPath = path.resolve(
		// 	process.cwd(),
		// 	'models',
		// 	`model_${optimizer}_${loss}`,
		// );

		// const modelPath = path.resolve(__dirname, `models/model_${optimizer}_${loss}`);
		const modelDir = path.resolve(process.cwd(), 'models');
		const modelPath = path.resolve(modelDir, `model_${optimizer}_${loss}`);

		return modelPath;
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

	async saveModel(model, optimizer: string, loss: string) {
		const modelPath = this.getModelPath(optimizer, loss);

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
		optimizer: string,
		loss: string,
		windowLength: number,
		numberOfFeatures: number,
	) {
		const modelPath = this.getModelPath(optimizer, loss);
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
		lotteryHistory,
		optimizer: string,
		loss: string,
		epochs: number,
		maxNumber = MAX_NUMBER['Power655'],
		numberOfFeatures = NUMBERS['Power655'],
	) {
		const numberOfRows = lotteryHistory.length;

		// Ensure there are enough data points
		if (numberOfRows <= WINDOW_LENGTH) {
			throw new Error(
				'Not enough data points to create training examples.',
			);
		}

		// shuffleArrayOfArrays(lotteryHistory);
		// Normalize the data to the range [0, 1]
		const scaledLotteryHistory = lotteryHistory.map((row) =>
			row.map((num) => num / maxNumber),
		);

		// Prepare train and label data
		const train = [];
		const label = [];

		for (let i = 0; i < numberOfRows - WINDOW_LENGTH; i++) {
			const window = scaledLotteryHistory.slice(i, i + WINDOW_LENGTH);
			train.push(window);
			label.push(scaledLotteryHistory[i + WINDOW_LENGTH]);
		}

		const trainTensor = tf.tensor3d(train);
		const labelTensor = tf.tensor2d(label);

		const model = await this.loadOrCreateModel(
			optimizer,
			loss,
			WINDOW_LENGTH,
			numberOfFeatures,
		);

		let lastEpochLogs;

		// Train the model
		// await model.fit(trainTensor, labelTensor, {
		// 	epochs,
		// 	shuffle: true,
		// 	callbacks: {
		// 		onEpochEnd: (epoch, logs) => {
		// 			lastEpochLogs = logs;
		// 			// console.log(
		// 			// 	`Epoch ${epoch + 1}: loss = ${logs.loss}, accuracy = ${logs.acc}`,
		// 			// );
		// 		},
		// 	},
		// });

		// Train the model incrementally
		for (let epoch = 0; epoch < epochs; epoch++) {
			for (let i = 0; i < trainTensor.shape[0]; i += BATCH_SIZE) {
				const batchEnd = Math.min(i + BATCH_SIZE, trainTensor.shape[0]);
				const batchX = trainTensor.slice(
					[i, 0, 0],
					[batchEnd - i, -1, -1],
				);
				const batchY = labelTensor.slice([i, 0], [batchEnd - i, -1]);

				await model.fit(batchX, batchY, {
					epochs: 1,
					shuffle: false,
					callbacks: {
						onEpochEnd: (epoch, logs) => {
							lastEpochLogs = logs;
						},
					},
				});

				// console.log(
				// 	`Batch ${i / BATCH_SIZE + 1}: loss = ${history.history.loss[0]}, accuracy = ${history.history.acc[0]}`,
				// );
			}
		}

		const savePath = await this.saveModel(model, optimizer, loss);

		return { model, modelPath: savePath, lastEpochLogs };
	}

	async predict(history: number[][], modelPath: string) {
		const model = await this.loadModel(modelPath);

		const toPredict = history.slice(0, 2);
		// Normalize the prediction input
		const scaledToPredict = toPredict.map((row) =>
			row.map((value) => value / MAX_NUMBER.Power655),
		);
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
		return predictionOutput.map((value) =>
			Math.round(value * MAX_NUMBER.Power655),
		);
	}

	async cleanModel(modelName: string) {
		// const folderPath = path.resolve(process.cwd(), 'models', modelName);
        const folderPath = path.resolve(process.cwd(), 'models', modelName.trim());

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
    optimizer = defaultPredictParams.optimizer,
    loss = defaultPredictParams.loss,
    epochs = defaultPredictParams.epochs,
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
