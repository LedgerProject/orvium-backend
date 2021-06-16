import { Test, TestingModule } from '@nestjs/testing';
import { PushNotificationsController } from './push-notifications.controller';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { PushNotificationsModule } from './push-notifications.module';

describe('PushNotificationsController', () => {
  let controller: PushNotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushNotificationsController],
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        UsersModule,
        PushNotificationsModule
      ],
    }).compile();

    controller = module.get<PushNotificationsController>(PushNotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
