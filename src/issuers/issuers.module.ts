import { Module } from '@nestjs/common';
import { IssuersService } from './issuers.service';
import { IssuersController } from './issuers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { IDIssuer, IDIssuerSchema } from './entities/issuer.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: IDIssuer.name, schema:IDIssuerSchema }])
  ],
  controllers: [
    IssuersController
  ],
  providers: [
    IssuersService
  ],
})
export class IssuersModule {}
