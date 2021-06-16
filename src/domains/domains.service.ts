import { Injectable } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DomainDocument } from './domains.schema';

@Injectable()
export class DomainsService {
  constructor(@InjectModel(DomainDocument.name) private domainModel: Model<DomainDocument>,
  ) {
  }

  async find(filter: FilterQuery<DomainDocument>): Promise<DomainDocument[]> {
    return this.domainModel.find(filter).exec();
  }

  async findOne(filter: FilterQuery<DomainDocument>): Promise<DomainDocument | null> {
    return this.domainModel.findOne(filter).exec();
  }
}
