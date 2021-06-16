import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { EventDocument, EventSchema } from './event.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from '../users/users.module';
import { FeedbackModule } from '../feedback/feedback.module';

describe('EventService', () => {
  let service: EventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventService],
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        MongooseModule.forFeature([{ name: EventDocument.name, schema: EventSchema }]),
        ScheduleModule.forRoot(),
        UsersModule, FeedbackModule
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
