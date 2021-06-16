import { Test, TestingModule } from '@nestjs/testing';
import { DisciplineController } from './discipline.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { DisciplineDocument, DisciplineSchema } from './discipline.schema';
import { DisciplineService } from './discipline.service';

describe('Discipline Controller', () => {
  let controller: DisciplineController;
  let disciplineService: DisciplineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisciplineController],
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        MongooseModule.forFeature([
          { name: DisciplineDocument.name, schema: DisciplineSchema, collection: 'discipline-discipline' },
        ]),
      ],
      providers: [
        DisciplineService
      ]
    }).compile();

    controller = module.get<DisciplineController>(DisciplineController);
    disciplineService = module.get<DisciplineService>(DisciplineService);

    await disciplineService.disciplineModel.deleteMany();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should be defined', async () => {
    await disciplineService.disciplineModel.insertMany([
      {
        name: 'Medicine',
        description: 'This is medicine field'
      },
      {
        name: 'Computing',
        description: 'This is computing field'
      }
    ]);

    const disciplines = await controller.getDisciplines();
    expect(disciplines.length).toBe(2);
    expect(disciplines[1].name).toBe('Computing');
  });
});
