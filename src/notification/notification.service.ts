import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentDefinition, FilterQuery, Model, UpdateQuery } from 'mongoose';
import { AppNotificationDocument } from './notification.schema';

@Injectable()
export class NotificationService {
  constructor(@InjectModel(AppNotificationDocument.name) private notificationModel: Model<AppNotificationDocument>) {
  }

  async find(filter: FilterQuery<AppNotificationDocument>): Promise<AppNotificationDocument[]> {
    return this.notificationModel.find(filter).lean();
  }

  async findOneAndUpdate(
    filter: FilterQuery<AppNotificationDocument>,
    update: UpdateQuery<AppNotificationDocument>): Promise<AppNotificationDocument | null> {
    return this.notificationModel.findOneAndUpdate(filter, update).lean();
  }

  async create(newNotification: DocumentDefinition<AppNotificationDocument>): Promise<AppNotificationDocument> {
    const appNotification = await this.notificationModel.create(newNotification);
    return appNotification.save();
  }
}
