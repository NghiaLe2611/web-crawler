import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';

const PORT = process.env.PORT;

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
	const configService = app.get(ConfigService);
	const port = configService.get<number>('PORT') || 5000;
    const env = configService.get<number>('NODE_ENV') || 'development';

	app.enableCors();
	console.log(`Lottery app started with port ${port} in ${env}`);
	await app.listen(PORT);
}
bootstrap();
