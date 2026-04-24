import { Test, TestingModule } from '@nestjs/testing';
import { MstRightToWorksController } from './mst_right_to_works.controller';
import { MstRightToWorksService } from './mst_right_to_works.service';

describe('MstRightToWorksController', () => {
  let controller: MstRightToWorksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MstRightToWorksController],
      providers: [MstRightToWorksService],
    }).compile();

    controller = module.get<MstRightToWorksController>(MstRightToWorksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
