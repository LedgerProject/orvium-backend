import { IsString } from 'class-validator';

export class InviteUpdateDTO {
  @IsString() status!: string;
}
