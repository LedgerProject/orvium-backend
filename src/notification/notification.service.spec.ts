import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { AppNotification, AppNotificationSchema } from './notification.schema';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        MongooseModule.forFeature([{ name: AppNotification.name, schema: AppNotificationSchema }]),
      ],
      providers: [NotificationService],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
