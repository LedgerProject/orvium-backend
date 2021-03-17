import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { Event, EventSchema } from './event.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from '../users/users.module';

describe('EventService', () => {
  let service: EventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventService],
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
        ScheduleModule.forRoot(),
        UsersModule
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
