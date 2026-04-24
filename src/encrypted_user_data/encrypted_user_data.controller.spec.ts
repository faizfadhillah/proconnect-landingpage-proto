import { Test, TestingModule } from '@nestjs/testing';
import { EncryptedUserDataController } from './encrypted_user_data.controller';
import { EncryptedUserDataService } from './encrypted_user_data.service';

describe('EncryptedUserDataController', () => {
  let controller: EncryptedUserDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EncryptedUserDataController],
      providers: [EncryptedUserDataService],
    }).compile();

    controller = module.get<EncryptedUserDataController>(EncryptedUserDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
