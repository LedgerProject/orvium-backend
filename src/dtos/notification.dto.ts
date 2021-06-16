import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AppNotificationDTO {
  @Expose() _id!: string;
  @Expose() userId!: string;
  @Expose() title!: string;
  @Expose() body!: string;
  @Expose() icon!: string;
  @Expose() createdOn!: Date;
  @Expose() isRead!: boolean;
  @Expose() action?: string;
}
