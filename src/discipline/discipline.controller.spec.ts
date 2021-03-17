import { Test, TestingModule } from '@nestjs/testing';
import { DisciplineController } from './discipline.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { DisciplineModule } from './discipline.module';

describe('Discipline Controller', () => {
  let controller: DisciplineController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisciplineController],
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        DisciplineModule
      ]
    }).compile();

    controller = module.get<DisciplineController>(DisciplineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
