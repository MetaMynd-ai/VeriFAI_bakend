import { Module } from '@nestjs/common';
import { Auth3Controller } from './auth3.controller';
import { Auth3Service } from './auth3.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [Auth3Controller],
  providers: [Auth3Service],
  exports: [Auth3Service],
})
export class Auth3Module {}
