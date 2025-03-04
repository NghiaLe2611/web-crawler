import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PuppeteerService } from 'src/modules/puppeteer/puppeteer.service';
import { PuppeteerController } from 'src/modules/puppeteer/puppeteer.controller';
import { ConfigModule } from '@nestjs/config';

// import { config } from 'dotenv';
// config();

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath:
				process.env.NODE_ENV === 'production'
					? '.env.production'
					: '.env',
			isGlobal: true, // Makes ConfigModule available globally
		}),
	],
	controllers: [AppController, PuppeteerController],
	providers: [AppService, PuppeteerService],
})
export class AppModule {}
