import { Module } from '@nestjs/common';
import { CypherService } from './cypher.service';

@Module({
  imports: [],
  controllers: [],
  providers: [CypherService],
  exports: [CypherService]
})
export class CypherModule {}
