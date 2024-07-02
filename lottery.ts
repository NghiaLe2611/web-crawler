// @ts-nocheck

import * as tf from '@tensorflow/tfjs-node'
import * as path from 'path';
import * as fs from 'fs';

async function trainModel(
	lotteryHistory,
	optimizer = 'adam',
	loss = 'meanSquaredError',
	epochs = 100,
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
	const xTrain = tf.tensor2d(features, [features.length, features[0].length]);
	const yTrain = tf.tensor2d(targets, [targets.length, targets[0].length]);

	// xTrain.print();
	// yTrain.print();

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

	// Train the model
	await model.fit(xTrain, yTrain, {
		epochs,
		shuffle: true,
		// callbacks: {
		// 	onEpochEnd: (epoch, logs) => {
		// 		console.log(`Epoch ${epoch + 1}: loss = ${logs.loss}, accuracy = ${logs.acc}`);
		// 	},
		// },
	});

    // Ensure the models directory exists, create it if not
    const modelPath = path.resolve(__dirname, `models/model_${optimizer}_${loss}`);

    // Ensure the models directory exists, create it if not
    if (!fs.existsSync(path.dirname(modelPath))) {
        fs.mkdirSync(path.dirname(modelPath), { recursive: true });
    }

    // Save the model
    await model.save(`file://${modelPath}`);
    console.log(`Model saved to ${modelPath}`);

	return model;
}

const lotteryHistory = [
	[11, 15, 32, 34, 46, 48, 47],
	[7, 21, 22, 41, 43, 46, 32],
	[1, 5, 9, 13, 18, 27, 8],
	[17, 25, 31, 35, 41, 42, 36],
	[1, 10, 29, 34, 43, 55, 49],
	[20, 23, 27, 36, 38, 44, 52],
	[5, 10, 14, 20, 26, 51, 36],
	[8, 39, 45, 47, 49, 51, 16],
	[13, 16, 21, 30, 32, 39, 53],
	[13, 16, 32, 33, 35, 43, 42],
	[18, 26, 38, 39, 47, 51, 55],
	[1, 2, 7, 10, 13, 19, 24],
	[6, 24, 30, 31, 47, 49, 1],
	[4, 7, 8, 12, 23, 31, 45],
	[1, 25, 29, 37, 40, 54, 50],
	[15, 22, 38, 39, 43, 53, 20],
	[8, 12, 42, 47, 51, 52, 36],
	[1, 2, 14, 32, 33, 41, 4],
	[12, 18, 20, 25, 27, 52, 44],
	[20, 25, 27, 39, 45, 55, 44],
	[5, 17, 36, 40, 46, 50, 1],
	[19, 23, 25, 43, 46, 54, 42],
	[3, 16, 21, 36, 37, 40, 31],
	[21, 26, 35, 41, 44, 52, 13],
	[5, 27, 35, 45, 49, 55, 18],
	[30, 32, 33, 36, 42, 48, 18],
	[13, 16, 26, 46, 49, 54, 8],
	[7, 12, 38, 43, 48, 55, 8],
	[13, 19, 27, 38, 41, 54, 46],
	[1, 34, 39, 40, 49, 53, 9],
	[2, 6, 35, 43, 45, 47, 14],
	[1, 21, 23, 33, 43, 54, 28],
	[3, 5, 32, 40, 46, 50, 37],
	[29, 36, 37, 38, 40, 42, 46],
	[3, 6, 15, 25, 33, 43, 55],
	[4, 12, 27, 44, 46, 51, 22],
	[9, 13, 20, 30, 39, 54, 23],
	[3, 8, 12, 25, 47, 48, 15],
	[1, 12, 18, 20, 51, 52, 37],
	[14, 17, 27, 38, 54, 55, 23],
	[1, 7, 18, 26, 38, 49, 21],
	[1, 8, 13, 16, 38, 44, 47],
	[3, 10, 13, 30, 40, 52, 4],
	[12, 13, 41, 48, 49, 53, 43],
	[6, 25, 39, 45, 46, 55, 26],
	[8, 36, 42, 43, 44, 55, 54],
	[21, 25, 26, 29, 41, 51, 39],
	[11, 14, 18, 20, 22, 43, 16],
	[11, 13, 22, 36, 46, 49, 37],
	[13, 20, 33, 47, 53, 54, 19],
	[12, 19, 21, 23, 28, 54, 31],
	[1, 19, 21, 31, 50, 55, 37],
	[4, 11, 20, 38, 52, 53, 33],
	[1, 4, 6, 8, 24, 35, 53],
	[1, 3, 22, 27, 38, 40, 26],
	[8, 19, 24, 31, 35, 55, 1],
	[34, 46, 50, 51, 52, 55, 5],
	[8, 12, 17, 27, 38, 55, 47],
	[3, 7, 8, 18, 21, 26, 19],
	[8, 17, 22, 31, 34, 49, 18],
	[22, 31, 35, 36, 38, 42, 11],
	[8, 19, 27, 34, 46, 51, 24],
	[4, 6, 7, 13, 18, 26, 49],
	[2, 7, 10, 22, 32, 40, 39],
	[3, 10, 13, 40, 49, 52, 9],
	[6, 12, 38, 41, 46, 55, 13],
	[13, 17, 35, 38, 42, 48, 7],
	[13, 27, 32, 48, 49, 51, 23],
	[6, 25, 29, 34, 49, 54, 38],
	[12, 20, 33, 38, 40, 52, 35],
	[9, 14, 18, 20, 27, 43, 42],
	[1, 5, 7, 23, 35, 42, 21],
	[2, 23, 32, 44, 51, 52, 28],
	[16, 32, 45, 50, 52, 53, 54],
	[15, 17, 21, 24, 34, 46, 11],
	[7, 34, 37, 43, 52, 54, 28],
	[2, 5, 18, 31, 37, 45, 20],
	[9, 17, 29, 32, 38, 52, 2],
	[20, 28, 30, 40, 45, 52, 32],
	[10, 14, 17, 27, 29, 40, 25],
	[22, 32, 39, 46, 48, 49, 43],
	[9, 31, 39, 41, 47, 48, 3],
	[11, 14, 15, 24, 34, 53, 18],
	[13, 15, 21, 26, 34, 35, 45],
	[1, 12, 23, 43, 48, 52, 30],
	[6, 7, 16, 21, 34, 50, 31],
	[6, 9, 26, 27, 34, 47, 41],
	[9, 13, 28, 33, 50, 53, 47],
	[2, 4, 19, 32, 35, 39, 49],
	[1, 10, 20, 37, 48, 51, 54],
	[9, 13, 21, 28, 50, 54, 51],
	[10, 24, 47, 48, 52, 55, 28],
	[7, 9, 10, 17, 25, 53, 49],
	[4, 6, 26, 33, 52, 55, 15],
	[3, 7, 16, 37, 39, 51, 9],
	[1, 7, 10, 14, 28, 29, 2],
	[3, 5, 10, 18, 44, 49, 28],
	[4, 9, 12, 15, 22, 38, 40],
	[2, 3, 4, 19, 41, 42, 23],
	[8, 17, 24, 34, 39, 48, 44],
];

const handlePredict = async () => {
    // Train the model
    const model = await trainModel(lotteryHistory);

    // Make a prediction using the latest data
    const latestData = lotteryHistory[0].slice(0, 7); // Use the most recent 7 numbers as input
    const predictionTensor = model.predict(tf.tensor2d([latestData]));
    const predictedNumbers = predictionTensor.dataSync();
    // const roundedPredictedNumbers = Array.from(predictedNumbers).map((number) => Math.round(number));
    const roundedPredictedNumbers = Array.from(predictedNumbers).map((number) => {
        let roundedNumber = Math.round(number);
        if (roundedNumber < 1) {
            roundedNumber = 1;
        } else if (roundedNumber > 55) {
            roundedNumber = 55;
        }
        return roundedNumber;
    });
    console.log(123, roundedPredictedNumbers);
};

// handlePredict();
trainModel(lotteryHistory);
