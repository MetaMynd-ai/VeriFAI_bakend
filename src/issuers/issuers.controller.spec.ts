import { Test, TestingModule } from '@nestjs/testing';
import { IssuersController } from './issuers.controller';
import { IssuersService } from './issuers.service';

describe('IssuersController', () => {
  let controller: IssuersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IssuersController],
      providers: [IssuersService],
    }).compile();

    controller = module.get<IssuersController>(IssuersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
