import { Module } from '@nestjs/common';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { InviteDocument, InviteSchema } from './invite.schema';
import { DepositModule } from '../deposit/deposit.module';
import { EventModule } from '../event/event.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: InviteDocument.name, schema: InviteSchema }]),
    UsersModule,
    DepositModule,
    EventModule,
    AuthorizationModule,
  ],
  providers: [InviteService],
  exports: [InviteService],
  controllers: [InviteController]
})
export class InviteModule {
}
