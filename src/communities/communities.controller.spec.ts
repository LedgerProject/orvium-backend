import { Test, TestingModule } from '@nestjs/testing';
import { CommunitiesController } from './communities.controller';
import { UsersModule } from '../users/users.module';
import { DepositModule } from '../deposit/deposit.module';
import { CommunitiesModule } from './communities.module';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { LocalStorageService } from '../local-storage.service';

describe('Communities Controller', () => {
  let controller: CommunitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunitiesController],
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CommunitiesModule,
        UsersModule,
        DepositModule,
      ],
      providers: [
        {
          provide: 'IStorageService',
          useClass: LocalStorageService
        }
      ]
    }).compile();

    controller = module.get<CommunitiesController>(CommunitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
