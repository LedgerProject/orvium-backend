import { Exclude, Expose } from 'class-transformer';
import { CREDIT_TYPE } from '../deposit/deposit.schema';

@Exclude()
export class AuthorDTO {
  @Expose() userId?: string;
  @Expose() name!: string;
  @Expose({ groups: ['owner', 'admin'] }) email?: string;
  @Expose() surname!: string;
  @Expose() nickname?: string;
  @Expose() orcid?: string;
  @Expose() credit?: CREDIT_TYPE[];
  @Expose() gravatar?: string;
}
