import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CreateReviewDTO, Review } from './review.schema';

@Injectable()
export class ReviewService {
  constructor(@InjectModel(Review.name) public reviewModel: Model<Review>) {
  }

  async find(filter: FilterQuery<Review>): Promise<Review[]> {
    return this.reviewModel.find(filter).populate('deposit').exec();
  }

  async findOne(filter: FilterQuery<Review>): Promise<Review | null> {
    return this.reviewModel.findOne(filter).populate('deposit').exec();
  }

  async findById(id: string): Promise<Review | null> {
    return this.reviewModel.findById(id).populate('deposit').exec();
  }

  async create(review: CreateReviewDTO): Promise<Review> {
    const createdReview = new this.reviewModel(review);
    return createdReview.save();
  }
}
