import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'notification', timestamps: true })
export class AppNotification extends Document {
  @Prop() userId: string;
  @Prop({ trim: true }) title: string;
  @Prop({ trim: true }) body: string;
  @Prop() icon: string;
  @Prop() createdOn: Date;
  @Prop({ default: false }) isRead: boolean;
  @Prop() action: string;
}

export const AppNotificationSchema = SchemaFactory.createForClass(AppNotification);
