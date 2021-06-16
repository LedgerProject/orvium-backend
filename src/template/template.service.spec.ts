import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { ScheduleModule } from '@nestjs/schedule';
import { TemplateService } from './template.service';
import { Template, TemplateSchema } from './template.schema';

describe('TemplateService', () => {
  let service: TemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateService],
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        MongooseModule.forFeature([{ name: Template.name, schema: TemplateSchema }]),
        ScheduleModule.forRoot()
      ],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
