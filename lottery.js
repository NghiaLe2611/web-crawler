// // import * as tf from '@tensorflow/tfjs';
// // const tf = require('@tensorflow/tfjs-node');
// const tf = require('@tensorflow/tfjs')
// // Load the binding (CPU computation)
// require('@tensorflow/tfjs-node')
// // const fs = require('fs');
// // Chuẩn bị dữ liệu huấn luyện từ lịch sử kết quả lô đề
// function prepareTrainingData(historyResults) {
// 	const inputNumbers = [];
// 	const outputNumbers = [];
// 	historyResults.forEach((result) => {
// 		const input = result.slice(0, 5); // Sử dụng 5 số đầu tiên làm đầu vào
// 		const output = result.slice(5); // Sử dụng 6 số cuối cùng làm đầu ra (dự đoán)
// 		inputNumbers.push(input);
// 		outputNumbers.push(output);
// 	});
// 	// Chuyển đổi mảng thành TensorFlow tensors
// 	const inputTensor = tf.tensor2d(inputNumbers);
// 	const outputTensor = tf.tensor2d(outputNumbers);
// 	return { inputTensor, outputTensor };
// }
// // Xây dựng và huấn luyện mô hình dự đoán lô đề
// async function trainLotteryModel(historyResults) {
// 	const { inputTensor, outputTensor } = prepareTrainingData(historyResults);
// 	const model = tf.sequential();
// 	model.add(
// 		tf.layers.dense({ units: 32, inputShape: [5], activation: 'relu' }),
// 	);
// 	model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
// 	model.add(tf.layers.dense({ units: 6, activation: 'softmax' }));
// 	model.compile({
// 		optimizer: 'adam',
// 		loss: 'categoricalCrossentropy',
// 		metrics: ['accuracy'],
// 	});
// 	// Huấn luyện mô hình
// 	await model.fit(inputTensor, outputTensor, { epochs: 50 });
// 	return model;
// }
// // Dự đoán kết quả lô đề tiếp theo
// async function predictNextLotteryNumbers(model) {
// 	// Dự đoán một số lô đề mới dựa trên mô hình đã được huấn luyện
// 	const input = tf.tensor2d([[0, 0, 0, 0, 0]]); // Đầu vào là một giá trị ban đầu tùy ý
// 	const prediction = model.predict(input);
// 	const predictedNumbers = await prediction.data();
// 	return predictedNumbers.map((num) => Math.round(num)); // Làm tròn dự đoán thành số nguyên
// }
// // Chương trình chính
// async function main() {
// 	// Đọc và chuẩn bị dữ liệu lịch sử kết quả lô đề
// 	// const historyLotteryResults = JSON.parse(
// 	// 	fs.readFileSync('historyResults.json', 'utf8'),
// 	// );
// 	const historyLotteryResults = [
// 		[1, 2, 3, 4, 5, 6],
// 		[1, 2, 5, 6, 7, 8],
// 		[9, 10, 12, 14, 15, 22],
// 		[20, 21, 7, 30, 33, 45]
// 	];
// 	// Huấn luyện mô hình dự đoán lô đề từ lịch sử
// 	const model = await trainLotteryModel(historyLotteryResults);
// 	// Dự đoán kết quả lô đề tiếp theo
// 	const predictedNumbers = await predictNextLotteryNumbers(model);
// 	console.log('Predicted next lottery numbers:', predictedNumbers);
// }
// // Gọi chương trình chính để chạy
// main().catch((error) => console.error('Error:', error));
console.log(123);
