import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentDefinition, FilterQuery, Model } from 'mongoose';
import { ReviewDocument } from './review.schema';

@Injectable()
export class ReviewService {
  constructor(@InjectModel(ReviewDocument.name) public reviewModel: Model<ReviewDocument>) {
  }

  async find(filter: FilterQuery<ReviewDocument>): Promise<ReviewDocument[]> {
    return this.reviewModel.find(filter)
      .populate('deposit')
      .populate('ownerProfile', ['userId', 'firstName', 'lastName', 'nickname'])
      .exec();
  }

  async findOne(filter: FilterQuery<ReviewDocument>): Promise<ReviewDocument | null> {
    return this.reviewModel.findOne(filter)
      .populate('deposit')
      .populate('ownerProfile', ['userId', 'firstName', 'lastName', 'nickname'])
      .exec();
  }

  async findById(id: string): Promise<ReviewDocument | null> {
    return this.reviewModel.findById(id)
      .populate('deposit')
      .populate('ownerProfile', ['userId', 'firstName', 'lastName', 'nickname'])
      .exec();
  }

  async create(filter: DocumentDefinition<ReviewDocument>): Promise<ReviewDocument> {
    return this.reviewModel.create(filter);
  }
}
