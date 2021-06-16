import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { DisciplineDocument } from './discipline.schema';

@Injectable()
export class DisciplineService {
  constructor(@InjectModel(DisciplineDocument.name) public disciplineModel: Model<DisciplineDocument>,
  ) {
  }

  async find(filter: FilterQuery<DisciplineDocument>): Promise<DisciplineDocument[]> {
    return this.disciplineModel.find(filter).exec();
  }
}
