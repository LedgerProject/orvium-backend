import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Institution } from './institution.schema';

@Injectable()
export class InstitutionService {
  constructor(
    @InjectModel(Institution.name) private institutionModel: Model<Institution>,
  ) {
  }

  async findOne(conditions: FilterQuery<Institution>): Promise<Institution | null> {
    return this.institutionModel.findOne(conditions).exec();
  }
}
