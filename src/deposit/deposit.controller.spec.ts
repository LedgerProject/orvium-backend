import { Test, TestingModule } from '@nestjs/testing';
import { DepositController } from './deposit.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { UsersModule } from '../users/users.module';
import { EventModule } from '../event/event.module';
import { DataciteModule } from '../datacite/datacite.module';
import { DepositService } from './deposit.service';
import { CommunitiesService } from '../communities/communities.service';
import { HttpModule } from '@nestjs/common';
import { AuthorizationService } from '../authorization/authorization.service';
import { LocalStorageService } from '../common/local-storage.service';

describe('Deposit Controller', () => {
  let controller: DepositController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        UsersModule,
        EventModule,
        DataciteModule,
        HttpModule
      ],
      controllers: [DepositController],
      providers: [
        { provide: DepositService, useValue: {} },
        { provide: LocalStorageService, useValue: {} },
        { provide: CommunitiesService, useValue: {} },
        { provide: AuthorizationService, useValue: {} },
      ]
    }).compile();

    controller = module.get<DepositController>(DepositController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
