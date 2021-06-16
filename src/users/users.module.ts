import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserDocument, UserSchema } from './user.schema';
import { UserController } from './user.controller';
import { EventModule } from '../event/event.module';
import { InstitutionModule } from '../institution/institution.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserDocument.name, schema: UserSchema }]),
    HttpModule,
    EventModule,
    forwardRef(() => InstitutionModule),
    AuthorizationModule
  ],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UserController],
})
export class UsersModule {
}
