import { Module } from '@nestjs/common';
import { PushNotificationsController } from './push-notifications.controller';
import { PushNotificationsService } from './push-notifications.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PushSubscriptionDocument, PushSubscriptionSchema } from '../push-notifications/push-notification.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PushSubscriptionDocument.name, schema: PushSubscriptionSchema }]),
    UsersModule,
  ],
  controllers: [PushNotificationsController],
  exports: [PushNotificationsService],
  providers: [PushNotificationsService]
})
export class PushNotificationsModule {
}
