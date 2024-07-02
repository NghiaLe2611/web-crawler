// import { exec, spawn } from 'child_process';
const { spawn, exec } = require('child_process');

async function predictExec(data) {
	console.log('predict');
	exec('python ./python/app.py', (error, stdout, stderr) => {
		if (error) {
			console.error(`Error executing Python script: ${error.message}`);
			return;
		}
		if (stderr) {
			console.error(`Python script encountered an error: ${stderr}`);
			return;
		}
		// Assuming the Python function returns a JSON-encoded array
		try {
			const result = JSON.parse(stdout);
			console.log('Python script returned:', result);
		} catch (e) {
			console.error(`Error parsing JSON output: ${e}`);
		}
	});
}

async function predictSpawn(data) {
	const pythonProcess = spawn('python', ['./python/app.py']);

	pythonProcess.stdout.on('data', (data) => {
		try {
			const result = JSON.parse(data.toString());
			console.log('Python script returned:', result);
		} catch (e) {
			console.error(`Error parsing JSON output: ${e}`);
		}
	});

	pythonProcess.stderr.on('data', (data) => {
		console.error(`Error executing Python script: ${data.toString()}`);
	});

	pythonProcess.on('close', (code) => {
		if (code !== 0) {
			console.error(`Python script process exited with code ${code}`);
		}
	});
}

const dataToSend = [1, 2, 3, 4, 5, 1000];
const pythonProcess = spawn('python', [
	'./python/app.py',
	JSON.stringify(dataToSend),
]);

pythonProcess.stdout.on('data', (data) => {
	// console.log(`Python script response: ${data.toString()}`);
	// const result = parseFloat(data.toString()); // Parse the response as a number
	console.log(`Python script result: ${data.toString()}`);
});

pythonProcess.stderr.on('data', (data) => {
	console.error(`Error from Python script: ${data.toString()}`);
});

pythonProcess.on('close', (code) => {
	console.log(`Python script exited with code ${code}`);
});

// predictExec();
// predictSpawn();
