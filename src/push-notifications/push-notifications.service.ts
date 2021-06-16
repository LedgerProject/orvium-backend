import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentDefinition, FilterQuery, Model } from 'mongoose';
import { PushSubscriptionDocument } from './push-notification.schema';
import * as webPush from 'web-push';
import { PushSubscription } from 'web-push';

@Injectable()
export class PushNotificationsService {
  constructor(
    @InjectModel(PushSubscriptionDocument.name) private pushNotificationModel: Model<PushSubscriptionDocument>,
  ) {
  }

  async create(filter: DocumentDefinition<PushSubscriptionDocument>): Promise<PushSubscriptionDocument> {
    return this.pushNotificationModel.create(filter);
  }

  async findById(id: string): Promise<PushSubscriptionDocument | null> {
    return this.pushNotificationModel.findById(id).exec();
  }

  async findOne(filter: FilterQuery<PushSubscriptionDocument>): Promise<PushSubscriptionDocument | null> {
    return this.pushNotificationModel.findOne(filter).exec();
  }

  async find(filter: FilterQuery<PushSubscriptionDocument>): Promise<PushSubscriptionDocument[]> {
    return this.pushNotificationModel.find(filter).exec();
  }

  async exists(filter: FilterQuery<PushSubscriptionDocument>): Promise<boolean> {
    return this.pushNotificationModel.exists(filter);
  }

  async sendPushNotification(userId: string, notificationPayload: unknown): Promise<void> {
    const allSubscriptions = await this.find({ userId: userId });
    Promise.all(allSubscriptions.map(async (subscription: PushSubscription) => webPush.sendNotification(
      subscription, JSON.stringify(notificationPayload))))
      .then(() => console.log('Notification send'))
      .catch(err => {
        console.error('Error sending notification, reason: ', err);
        throw new Error('Error sending notification');
      });
  }
}
