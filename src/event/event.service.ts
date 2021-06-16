import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { EVENT_STATUS, EventDocument, EventDTO, RETRY_NUMBER } from './event.schema';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(EventDocument.name) private eventModel: Model<EventDocument>,
  ) {
  }

  async create(event: EventDTO): Promise<EventDocument> {
    const createdEvent = new this.eventModel(event);
    return createdEvent.save();
  }

  async findOne(filter: FilterQuery<EventDocument>): Promise<EventDocument | null> {
    return this.eventModel.findOne(filter).exec();
  }

  async setAsProcessed(event: EventDocument): Promise<EventDocument> {
    event.processedOn = Date.now();
    event.status = EVENT_STATUS.PROCESSED;
    console.log(`Event ${event._id} processed`);
    return await event.save();
  }

  async setAsProcessing(event: EventDocument): Promise<EventDocument> {
    event.retryCount++;
    event.status = EVENT_STATUS.PROCESSING;
    console.log(`Event ${event._id} processing`);
    return await event.save();
  }

  async setAsPending(event: EventDocument): Promise<EventDocument> {
    event.status = (event.retryCount == RETRY_NUMBER) ? EVENT_STATUS.FAILED : EVENT_STATUS.PENDING;
    console.log(`Event ${event._id} ${event.status}`);
    return await event.save();
  }
}
