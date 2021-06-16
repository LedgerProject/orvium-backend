import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AppNotificationDocument, AppNotificationSchema } from './notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AppNotificationDocument.name, schema: AppNotificationSchema }]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {
}
