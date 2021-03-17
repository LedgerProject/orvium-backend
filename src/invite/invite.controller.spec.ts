import { Test, TestingModule } from '@nestjs/testing';
import { InviteController } from './invite.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { UsersModule } from '../users/users.module';
import { DepositModule } from '../deposit/deposit.module';
import { InviteModule } from './invite.module';
import { EventModule } from '../event/event.module';

describe('Invite Controller', () => {
  let controller: InviteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        InviteModule,
        UsersModule,
        DepositModule,
        EventModule
      ],
      controllers: [InviteController],
    }).compile();

    controller = module.get<InviteController>(InviteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
