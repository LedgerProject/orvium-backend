import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Discipline } from './discipline.schema';

@Injectable()
export class DisciplineService {
  constructor(@InjectModel(Discipline.name) private disciplineModel: Model<Discipline>,
  ) {
  }

  async find(filter: FilterQuery<Discipline>): Promise<Discipline[]> {
    return this.disciplineModel.find(filter).exec();
  }
}
