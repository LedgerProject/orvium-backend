import { Controller, Get } from '@nestjs/common';
import { DisciplineService } from './discipline.service';
import { Discipline } from './discipline.schema';

@Controller('disciplines')
export class DisciplineController {
  constructor(private readonly disciplineService: DisciplineService) {
  }

  @Get('')
  async getDisciplines(): Promise<Discipline[]> {
    return await this.disciplineService.find({});
  }
}
