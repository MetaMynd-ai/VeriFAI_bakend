import { Test, TestingModule } from '@nestjs/testing';
import { IssuersService } from './issuers.service';

describe('IssuersService', () => {
  let service: IssuersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IssuersService],
    }).compile();

    service = module.get<IssuersService>(IssuersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
