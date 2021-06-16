import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { FeedbackDocument } from './feedback.schema';
import { FeedbackDTO } from '../dtos/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(@InjectModel(FeedbackDocument.name) private feedbackModel: Model<FeedbackDocument>) {
  }

  async findOne(filter: FilterQuery<FeedbackDocument>): Promise<FeedbackDocument | null> {
    return this.feedbackModel.findOne(filter).exec();
  }

  async findById(id: string): Promise<FeedbackDocument | null> {
    return this.feedbackModel.findById(id);
  }

  async create(feedback: FeedbackDTO): Promise<FeedbackDocument> {
    if (feedback.screenshot) {
      feedback.screenshot = Buffer.from((feedback.screenshot as string).split(',')[1], 'base64');
    }
    const createdFeedback = new this.feedbackModel(feedback);
    return createdFeedback.save();
  }
}
