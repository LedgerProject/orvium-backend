import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DisciplineDTO {
  @Expose() name!: string;
  @Expose() description?: string;
}
