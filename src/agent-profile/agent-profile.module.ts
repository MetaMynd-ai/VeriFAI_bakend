import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentProfile, AgentProfileSchema } from './entities/agent-profile.entity';
import { AgentProfileService } from './agent-profile.service';
import { AgentProfileController } from './agent-profile.controller';
import { IdentitiesModule } from '../identities/identities.module';
import { HcsModule } from '../hcs/hcs.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AgentProfile.name, schema: AgentProfileSchema }]),
    IdentitiesModule,
    HcsModule,
  ],
  controllers: [AgentProfileController],
  providers: [AgentProfileService],
  exports: [AgentProfileService],
})
export class AgentProfileModule {}
