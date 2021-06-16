import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'network', timestamps: true })
export class BlockchainNetworkDocument extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ required: true, unique: true })
  networkId!: number;

  @Prop({ required: true })
  appAddress!: string;

  @Prop({ required: true })
  escrowAddress!: string;

  @Prop({ required: true })
  tokenAddress!: string;

  @Prop({ required: true })
  explorerUrl!: string;
}

export const BlockchainNetworkSchema = SchemaFactory.createForClass(BlockchainNetworkDocument);
