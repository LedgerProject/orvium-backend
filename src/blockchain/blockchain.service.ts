import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { BlockchainNetwork } from './blockchain.schema';

@Injectable()
export class BlockchainService {
  constructor(@InjectModel(BlockchainNetwork.name) private blockchainNetworkModel: Model<BlockchainNetwork>) {
  }

  async find(filter: FilterQuery<BlockchainNetwork>): Promise<BlockchainNetwork[]> {
    return this.blockchainNetworkModel.find(filter).lean();
  }

  async create(rawJson: unknown): Promise<BlockchainNetwork> {
    const blockchainNetwork = new this.blockchainNetworkModel(rawJson);
    return blockchainNetwork.save();
  }

  model(): Model<BlockchainNetwork> {
    return this.blockchainNetworkModel;
  }
}
