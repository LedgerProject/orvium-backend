import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


@Schema({ collection: 'institution', timestamps: true })
export class Institution extends Document {
  @Prop({ required: true, trim: true }) name: string;
  @Prop({ required: true, trim: true }) domain: string;
  @Prop({ trim: true }) country: string;
  @Prop({ trim: true }) city: string;
  @Prop({ trim: true }) synonym: string;
}

export const InstitutionSchema = SchemaFactory.createForClass(Institution);

