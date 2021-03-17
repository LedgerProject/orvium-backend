import { Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AppNotification } from './notification.schema';
import { Request } from 'express';
import { UsersService } from '../users/users.service';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly userService: UsersService,

  ) {
  }

  @Get('myNotifications')
  async getMyNotifications(
    @Req() request: Request,
  ): Promise<AppNotification[]> {
    const user = await this.userService.findOne({});
    return await this.notificationService.find(
      { userId: user?.userId, isRead: false });
  }


  @Patch(':id/read')
  async markNotificationAsRead(
    @Req() request: Request,
    @Param('id') id: string,
  ): Promise<AppNotification | null> {
    const user = await this.userService.findOne({});
    return await this.notificationService.findOneAndUpdate(
      { userId: user?.userId, _id: id },
      { isRead: true });
  }
}
