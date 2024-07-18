import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as tf from '@tensorflow/tfjs-node';
import * as path from 'path';
import * as fs from 'fs';
import { defaultPredictParams } from 'src/constants';

const MAX_NUMBER = 55;

@Injectable()
export class PredictService {
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

	predict(data) {
		const rootDir = process.cwd();
		const fileName = path.join(rootDir, 'python', 'app.py');
		// const pythonProcess = spawn('python', [fileName, JSON.stringify(data)]);

		return new Promise((resolve, reject) => {
			const pythonProcess = spawn('python', [
				fileName,
				JSON.stringify(data),
			]);

			let result = null;
			let error = '';

			pythonProcess.stdout.on('data', (data) => {
				result = data.toString();
			});

			pythonProcess.stderr.on('data', (data) => {
				error += data.toString();
			});

			pythonProcess.on('close', (code) => {
				if (code !== 0) {
					reject(
						new Error(
							`Python script exited with code ${code}. Error: ${error}`,
						),
					);
				} else {
					resolve(result.trim());
				}
			});
		});
	}

	async runPythonScript(data) {
		return new Promise((resolve, reject) => {
			const pythonProcess = spawn('python', [
				path.join(__dirname, 'train_model.py'),
				JSON.stringify(data),
			]);

			let result = '';
			let error = '';

			pythonProcess.stdout.on('data', (data) => {
				result += data.toString();
			});

			pythonProcess.stderr.on('data', (data) => {
				error += data.toString();
			});

			pythonProcess.on('close', (code) => {
				if (code !== 0) {
					reject(
						new Error(
							`Python script exited with code ${code}. Error: ${error}`,
						),
					);
				} else {
					try {
						const parsedResult = JSON.parse(result);
						resolve(parsedResult);
					} catch (e) {
						reject(
							new Error(
								`Failed to parse Python script output: ${result}`,
							),
						);
					}
				}
			});
		});
	}

	async test(optimizer = 'adam', historyData) {
		const lotteryHistory = historyData.map((item) =>
			item.numbers.map((num) => Number(num)),
		);
		const toPredict = lotteryHistory.slice(0, 2);

		const inputData = {
			lottery_history: lotteryHistory,
			to_predict: toPredict,
			optimizer: optimizer,
			max_number: MAX_NUMBER,
		};

		try {
			const result = (await this.runPythonScript(inputData)) as any;
			console.log('Prediction:', result.prediction);
			console.log('Final Loss:', result.final_loss);
			console.log('Final Accuracy:', result.final_accuracy);
		} catch (error) {
			console.error('Error:', error.message);
		}
	}
}
