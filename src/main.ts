import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

const PORT = 5000;

const corsEnv = {
	development: {
		origin: true,
		credentials: true,
	},
	production: {
		origin: process.env.DOMAINS ? process.env.DOMAINS.split(',') : '*',
	},
};
const corsConfig = corsEnv[process.env.NODE_ENV || 'development'];

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors();

	// Set up HTTP server
	// await app.listen(PORT, () => {
	// 	console.log(`HTTP server running on http://localhost:${PORT}`);
	// });

	// Set up TCP microservice
	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.TCP,
		options: {
			host: 'localhost',
			port: PORT,
		},
	});
	await app.startAllMicroservices();
}
bootstrap();
