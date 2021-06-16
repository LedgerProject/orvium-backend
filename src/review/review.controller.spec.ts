import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from './review.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { ReviewService } from './review.service';
import { UsersModule } from '../users/users.module';
import { EventModule } from '../event/event.module';
import { DepositService } from '../deposit/deposit.service';
import { InviteService } from '../invite/invite.service';
import { AuthorizationService } from '../authorization/authorization.service';
import { LocalStorageService } from '../common/local-storage.service';


describe('Review Controller', () => {
  let controller: ReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        UsersModule,
        EventModule
      ],
      controllers: [ReviewController],
      providers: [
        { provide: ReviewService, useValue: {} },
        { provide: LocalStorageService, useValue: {} },
        { provide: DepositService, useValue: {} },
        { provide: InviteService, useValue: {} },
        { provide: AuthorizationService, useValue: {} },
      ],
    }).compile();

    controller = module.get<ReviewController>(ReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
