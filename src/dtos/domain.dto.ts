import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DomainDTO {
  @Expose()
  emailDomain!: string;
}
