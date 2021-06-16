import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { IsString } from 'class-validator';
import { PushSubscription } from 'web-push';

export class Keys {
  @IsString() p256dh!: string;
  @IsString() auth!: string;
}

@Schema({ collection: 'pushSubscriptions', timestamps: true })
export class PushSubscriptionDocument extends Document implements PushSubscription {
  @Prop({ required: true, trim: true }) endpoint!: string;
  @Prop() expirationTime?: Date;
  @Prop({ type: mongoose.SchemaTypes.Mixed }) keys!: Keys;
  @Prop({ required: true }) userId!: string;
}

export const PushSubscriptionSchema = SchemaFactory.createForClass(PushSubscriptionDocument);
