import { Body, Controller, Post } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { EVENT_TYPE, EventDTO } from '../event/event.schema';
import { EventService } from '../event/event.service';
import { FeedbackDTO } from '../dtos/feedback.dto';


@Controller('feedback')
export class FeedbackController {

  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly eventService: EventService,
  ) {
  }

  @Post('')
  async createFeedback(
    @Body() feedback: FeedbackDTO,
  ): Promise<void> {
    const feedbackCreated = await this.feedbackService.create(feedback);

    const eventPayload: EventDTO = {
      eventType: EVENT_TYPE.FEEDBACK,
      data: {
        feedbackId: feedbackCreated.id,
      },
    };

    await this.eventService.create(eventPayload);
  }
}
