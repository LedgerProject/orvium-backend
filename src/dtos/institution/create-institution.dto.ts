import { IsOptional, IsString } from 'class-validator';
import { IsNotBlankValidator } from '../../isNotBlankValidator';

export class CreateInstitutionDTO {
  @IsString() @IsNotBlankValidator({ message: 'Domain should not be empty' })
  domain!: string;
  @IsString() @IsNotBlankValidator({ message: 'Name should not be empty' })
  name!: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() synonym?: string;
}
