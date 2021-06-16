import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentDefinition, FilterQuery, Model } from 'mongoose';
import { InstitutionDocument } from './institution.schema';

@Injectable()
export class InstitutionService {
  constructor(
    @InjectModel(InstitutionDocument.name) private institutionModel: Model<InstitutionDocument>,
  ) {
  }

  async create(filter: DocumentDefinition<InstitutionDocument>): Promise<InstitutionDocument> {
    return this.institutionModel.create(filter);
  }

  async exists(filter: FilterQuery<InstitutionDocument>): Promise<boolean> {
    return this.institutionModel.exists(filter);
  }

  async findOne(conditions: FilterQuery<InstitutionDocument>): Promise<InstitutionDocument | null> {
    return this.institutionModel.findOne(conditions).exec();
  }
}
