import { Test, TestingModule } from '@nestjs/testing';
import { InviteController } from './invite.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { UsersModule } from '../users/users.module';
import { EventModule } from '../event/event.module';
import { DepositService } from '../deposit/deposit.service';
import { InviteService } from './invite.service';
import { AuthorizationService } from '../authorization/authorization.service';

describe('Invite Controller', () => {
  let controller: InviteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        UsersModule,
        EventModule,
      ],
      controllers: [InviteController],
      providers: [
        { provide: InviteService, useValue: {} },
        { provide: DepositService, useValue: {} },
        { provide: AuthorizationService, useValue: {} },
      ]
    }).compile();

    controller = module.get<InviteController>(InviteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
