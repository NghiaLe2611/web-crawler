import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import path from 'path';

const MAX_NUMBER = 55;

@Injectable()
export class PredictService {
	predictLottery(data) {
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
			const result = await this.runPythonScript(inputData) as any;
			console.log('Prediction:', result.prediction);
			console.log('Final Loss:', result.final_loss);
			console.log('Final Accuracy:', result.final_accuracy);
		} catch (error) {
			console.error('Error:', error.message);
		}
	}
}
