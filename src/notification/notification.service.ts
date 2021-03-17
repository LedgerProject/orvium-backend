import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateQuery, FilterQuery, Model, UpdateQuery } from 'mongoose';
import { AppNotification } from './notification.schema';

@Injectable()
export class NotificationService {
  constructor(@InjectModel(AppNotification.name) private notificationModel: Model<AppNotification>) {
  }

  async find(filter: FilterQuery<AppNotification>): Promise<AppNotification[]> {
    return this.notificationModel.find(filter).lean();
  }

  async findOneAndUpdate(filter: FilterQuery<AppNotification>,
                         update: UpdateQuery<AppNotification>): Promise<AppNotification | null> {
    return this.notificationModel.findOneAndUpdate(filter, update).lean();
  }

  async create(newNotification: CreateQuery<AppNotification>): Promise<AppNotification> {
    const appNotification = await this.notificationModel.create(newNotification);
    return appNotification.save();
  }
}
