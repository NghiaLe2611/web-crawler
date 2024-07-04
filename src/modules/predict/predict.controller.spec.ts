import { Test, TestingModule } from '@nestjs/testing';
import { PredictController } from './predict.controller';
import { PredictService } from './predict.service';

describe('PredictController', () => {
  let controller: PredictController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PredictController],
      providers: [PredictService],
    }).compile();

    controller = module.get<PredictController>(PredictController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
