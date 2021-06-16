import { IsDate, IsDefined, IsOptional, IsString } from 'class-validator';
import { Keys } from '../push-notifications/push-notification.schema';

export class PushSubscriptionDTO {
  @IsString() endpoint!: string;
  @IsOptional() @IsDate() expirationTime?: Date;
  @IsOptional() @IsString() userId?: string;
  @IsDefined() keys!: Keys;
}
