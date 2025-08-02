import { Test, TestingModule } from '@nestjs/testing';
import { HtsController } from './hts.controller';
import { HtsService } from './hts.service';

describe('HtsController', () => {
  let controller: HtsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HtsController],
      providers: [HtsService],
    }).compile();

    controller = module.get<HtsController>(HtsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
