import { Controller, Get } from '@nestjs/common';
import { DisciplineService } from './discipline.service';
import { DisciplineDTO } from '../dtos/discipline.dto';
import { plainToClassCustom } from '../utils/transformer';

@Controller('disciplines')
export class DisciplineController {
  constructor(private readonly disciplineService: DisciplineService) {
  }

  @Get('')
  async getDisciplines(): Promise<DisciplineDTO[]> {
    const disciplines = await this.disciplineService.find({});
    return plainToClassCustom(DisciplineDTO, disciplines);
  }
}
