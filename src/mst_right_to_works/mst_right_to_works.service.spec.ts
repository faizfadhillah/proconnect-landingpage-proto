import { Test, TestingModule } from '@nestjs/testing';
import { MstRightToWorksService } from './mst_right_to_works.service';

describe('MstRightToWorksService', () => {
  let service: MstRightToWorksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MstRightToWorksService],
    }).compile();

    service = module.get<MstRightToWorksService>(MstRightToWorksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
