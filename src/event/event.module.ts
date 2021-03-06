import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventService } from './event.service';
import { EventDocument, EventSchema } from './event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: EventDocument.name, schema: EventSchema }]),
  ],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {
}
