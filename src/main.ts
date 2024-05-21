import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

const PORT = 5000;

const corsEnv = {
	'development': {
		origin: true,
		credentials: true,
	},
	'production': {
		origin: process.env.DOMAINS ? process.env.DOMAINS.split(",") : '*'
	}
}
const corsConfig = corsEnv[process.env.NODE_ENV || 'development'];

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors(corsConfig);
	console.log(corsConfig);
	await app.listen(PORT);
}
bootstrap();
