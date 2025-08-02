import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DidKey, DidKeySchema } from './entities/did-key.entity';
import { DidKeyService } from './did-key.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: DidKey.name, schema: DidKeySchema }])],
  providers: [DidKeyService],
  exports: [DidKeyService],
})
export class DidKeyModule {}
