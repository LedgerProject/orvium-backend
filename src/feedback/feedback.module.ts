import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackDocument, FeedbackSchema } from './feedback.schema';
import { FeedbackController } from './feedback.controller';
import { EventModule } from '../event/event.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FeedbackDocument.name, schema: FeedbackSchema }]),
    EventModule
  ],
  providers: [FeedbackService],
  exports: [FeedbackService],
  controllers: [FeedbackController],
})
export class FeedbackModule {
}
