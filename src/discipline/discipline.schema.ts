import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'disciplines', timestamps: true })
export class Discipline extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;
}

export const DisciplineSchema = SchemaFactory.createForClass(Discipline);

