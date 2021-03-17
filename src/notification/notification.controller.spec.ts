import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { AppNotification, AppNotificationSchema } from './notification.schema';
import { NotificationService } from './notification.service';
import { UsersModule } from '../users/users.module';

describe('Notification Controller', () => {
  let controller: NotificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        MongooseModule.forFeature([{ name: AppNotification.name, schema: AppNotificationSchema }]),
        UsersModule
      ],
      controllers: [NotificationController],
      providers: [NotificationService],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
