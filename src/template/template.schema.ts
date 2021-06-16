import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'templates', timestamps: true })
export class Template extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  template!: string;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);

