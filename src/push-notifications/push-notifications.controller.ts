import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { PushNotificationsService } from './push-notifications.service';
import { Request } from 'express';
import * as webPush from 'web-push';
import { Auth0UserProfile } from 'auth0-js';
import { environment } from '../environments/environment';
import { DocumentDefinition } from 'mongoose';
import { PushSubscriptionDTO } from '../dtos/push-subscription.dto';
import { PushSubscriptionDocument } from './push-notification.schema';
import { plainToClassCustom } from '../utils/transformer';

@Controller('push-notifications')
export class PushNotificationsController {
  constructor(private readonly pushNotificationsService: PushNotificationsService) {
    // TODO: do not add the keys in the code
    if (environment.push_notifications_private_key && environment.push_notifications_public_key) {
      webPush.setVapidDetails(
        'mailto:info@orvium.io',
        environment.push_notifications_public_key,
        environment.push_notifications_private_key
      );
    }
  }

  /**
   * Store the notifications subscription objects
   */
  @Post('')
  async createPushNotificationsSubscription(
    @Req() req: Request,
    @Body() newSub: PushSubscriptionDTO,
  ): Promise<PushSubscriptionDTO> {
    const auth0Profile = req.user as Auth0UserProfile;
    // Generate query
    const query: DocumentDefinition<PushSubscriptionDocument> = {
      endpoint: newSub.endpoint,
      expirationTime: newSub.expirationTime,
      keys: {
        p256dh: newSub.keys.p256dh,
        auth: newSub.keys.auth,
      },
      userId: auth0Profile.sub
    };
    const savedSubscription = await this.pushNotificationsService.create(query);
    return plainToClassCustom(PushSubscriptionDTO, savedSubscription);
  }

  /**
   * Check it is subscribe
   */
  @Get('')
  async checkPushNotificationsSubscription(
    @Req() req: Request
  ): Promise<boolean> {
    const auth0Profile = req.user as Auth0UserProfile;
    return await this.pushNotificationsService.exists({ userId: auth0Profile.sub });
  }

  /**
   * sendNewsletter
   * TODO: we can control that only admin can send general notifications
   */
  @Post('sendNewsletter')
  async sendNewsletter(
    @Req() req: Request,
  ): Promise<void> {
    const allSubscriptions = await this.pushNotificationsService.find({});

    console.log('Total subscriptions', allSubscriptions.length);

    const notificationPayload = {
      'notification': {
        'title': 'Orvium notification',
        'body': 'New features available!',
        'icon': 'assets/icon-96x96.png',
        'vibrate': [100, 50, 100],
        'data': {
          'dateOfArrival': Date.now(),
          'primaryKey': 1
        },
        'actions': []
      }
    };
    Promise.all(allSubscriptions.map(async sub => webPush.sendNotification(
      sub, JSON.stringify(notificationPayload))))
      .then(() => console.log('Notification send'))
      .catch(err => {
        console.error('Error sending notification, reason: ', err);
        throw new Error('Error sending notification');
      });
  }
}
