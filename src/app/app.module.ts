import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PuppeteerService } from 'src/modules/puppeteer/puppeteer.service';
import { PuppeteerController } from 'src/modules/puppeteer/puppeteer.controller';
import { PredictController } from 'src/modules/predict/predict.controller';
import { PredictService } from 'src/modules/predict/predict.service';

@Module({
  imports: [],
  controllers: [AppController, PuppeteerController, PredictController],
  providers: [AppService, PuppeteerService, PredictService],
})
export class AppModule {}
