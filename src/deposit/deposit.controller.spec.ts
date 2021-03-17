import { Test, TestingModule } from '@nestjs/testing';
import { DepositController } from './deposit.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { DepositModule } from './deposit.module';
import { UsersModule } from '../users/users.module';
import { EventModule } from '../event/event.module';
import { LocalStorageService } from '../local-storage.service';

describe('Deposit Controller', () => {
  let controller: DepositController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        DepositModule,
        UsersModule,
        EventModule,
      ],
      providers: [
        {
          provide: 'IStorageService',
          useClass: LocalStorageService
        }
      ],
      controllers: [DepositController],
    }).compile();

    controller = module.get<DepositController>(DepositController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
