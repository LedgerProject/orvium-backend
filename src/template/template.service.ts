import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { Template } from './template.schema';

@Injectable()
export class TemplateService {
  constructor(@InjectModel(Template.name) private templateModel: Model<Template>,
  ) {
  }

  async findOne(filter: FilterQuery<Template>): Promise<Template | null> {
    return this.templateModel.findOne(filter).exec();
  }
}
