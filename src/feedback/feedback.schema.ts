import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'feedback', timestamps: true })
export class FeedbackDocument extends Document {
  @Prop({ default: Date.now() })
  created!: Date;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  description!: string;

  @Prop({ type: mongoose.SchemaTypes.Buffer })
  screenshot?: Buffer;

  @Prop({ type: mongoose.SchemaTypes.Mixed })
  data?: Record<string, unknown>;
}

export const FeedbackSchema = SchemaFactory.createForClass(FeedbackDocument);

