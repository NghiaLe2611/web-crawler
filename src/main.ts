import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

const PORT = 5000;

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors();
	await app.listen(PORT);
}
bootstrap();
