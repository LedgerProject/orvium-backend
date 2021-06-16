import { Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Request } from 'express';
import { Auth0UserProfile } from 'auth0-js';
import { AppNotificationDTO } from '../dtos/notification.dto';
import { plainToClassCustom } from '../utils/transformer';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {
  }

  @Get('myNotifications')
  async getMyNotifications(
    @Req() request: Request,
  ): Promise<AppNotificationDTO[]> {
    const auth0Profile = request.user as Auth0UserProfile;
    const notifications = await this.notificationService.find(
      { userId: auth0Profile.sub, isRead: false });

    return plainToClassCustom(AppNotificationDTO, notifications);
  }


  @Patch(':id/read')
  async markNotificationAsRead(
    @Req() request: Request,
    @Param('id') id: string,
  ): Promise<AppNotificationDTO | null> {
    const auth0Profile = request.user as Auth0UserProfile;
    const notification = await this.notificationService.findOneAndUpdate(
      { userId: auth0Profile.sub, _id: id },
      { isRead: true });

    return plainToClassCustom(AppNotificationDTO, notification);
  }
}
