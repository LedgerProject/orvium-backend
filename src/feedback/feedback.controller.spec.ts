import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackController } from './feedback.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { FeedbackService } from './feedback.service';
import { FeedbackDocument, FeedbackSchema } from './feedback.schema';
import { EventModule } from '../event/event.module';

describe('Feedback Controller', () => {
  let controller: FeedbackController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        MongooseModule.forFeature([{ name: FeedbackDocument.name, schema: FeedbackSchema }]),
        EventModule,
      ],
      providers: [FeedbackService],
      controllers: [FeedbackController],
    }).compile();

    controller = module.get<FeedbackController>(FeedbackController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
