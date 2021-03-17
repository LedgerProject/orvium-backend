import { Injectable } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Domain } from './domains.schema';

@Injectable()
export class DomainsService {
  constructor(@InjectModel(Domain.name) private domainModel: Model<Domain>,
  ) {
  }

  async find(filter: FilterQuery<Domain>): Promise<Domain[]> {
    return this.domainModel.find(filter).exec();
  }

  async findOne(filter: FilterQuery<Domain>): Promise<Domain | null> {
    return this.domainModel.findOne(filter).exec();
  }
}
