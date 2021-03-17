import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class BlockchainNetworkDTO {
  @Expose() name: string;
  @Expose() displayName: string;
  @Expose() networkId: number;
  @Expose() appAddress: string;
  @Expose() escrowAddress: string;
  @Expose() tokenAddress: string;
  @Expose() explorerUrl: string;
}

@Schema({ collection: 'network', timestamps: true })
export class BlockchainNetwork extends Document {
  @Prop()
  name: string;

  @Prop()
  displayName: string;

  @Prop({ unique: true })
  networkId: number;

  @Prop()
  appAddress: string;

  @Prop()
  escrowAddress: string;

  @Prop()
  tokenAddress: string;

  @Prop()
  explorerUrl: string;
}

export const BlockchainNetworkSchema = SchemaFactory.createForClass(BlockchainNetwork);
