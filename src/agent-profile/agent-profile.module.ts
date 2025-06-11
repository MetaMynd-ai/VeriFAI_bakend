import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentProfile, AgentProfileSchema } from './entities/agent-profile.entity';
import { AgentProfileService } from './agent-profile.service';
import { AgentProfileController } from './agent-profile.controller';
import { IdentitiesModule } from '../identities/identities.module';
import { HcsModule } from '../hcs/hcs.module';
import { DidKeyModule } from '../did-key/did-key.module';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AgentProfile.name, schema: AgentProfileSchema }]),
    forwardRef(() => IdentitiesModule),
    HcsModule,
    DidKeyModule,
    forwardRef(() => WalletsModule),
  ],
  controllers: [AgentProfileController],
  providers: [AgentProfileService],
  exports: [AgentProfileService],
})
export class AgentProfileModule {}
