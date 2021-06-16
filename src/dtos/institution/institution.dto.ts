import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class InstitutionDTO {
  @Expose() name!: string;
  @Expose() domain!: string;
  @Expose() country?: string;
  @Expose() city?: string;
  @Expose() synonym?: string;
}
