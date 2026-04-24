import { Test, TestingModule } from '@nestjs/testing';
import { ConfigsController } from './config.controller';
import { ConfigsService } from './config.service';

describe('ConfigController', () => {
  let controller: ConfigsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigsController],
      providers: [ConfigsService],
    }).compile();

    controller = module.get<ConfigsController>(ConfigsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
