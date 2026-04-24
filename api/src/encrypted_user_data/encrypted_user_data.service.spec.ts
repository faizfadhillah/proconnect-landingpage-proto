import { Test, TestingModule } from '@nestjs/testing';
import { EncryptedUserDataService } from './encrypted_user_data.service';

describe('EncryptedUserDataService', () => {
  let service: EncryptedUserDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptedUserDataService],
    }).compile();

    service = module.get<EncryptedUserDataService>(EncryptedUserDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
