import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { PuppeteerController } from 'src/puppeteer/puppeteer.controller';

@Module({
  imports: [],
  controllers: [AppController, PuppeteerController],
  providers: [AppService, PuppeteerService],
})
export class AppModule {}
