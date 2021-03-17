import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'domains', timestamps: true })
export class Domain extends Document {
  @Prop({ required: true, unique: true, trim: true })
  emailDomain: string;
}

export const DomainSchema = SchemaFactory.createForClass(Domain);
