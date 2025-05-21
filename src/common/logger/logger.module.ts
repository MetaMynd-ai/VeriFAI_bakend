import { Module, Global } from '@nestjs/common';
import { DiscordLogger } from './discord-logger.service';

@Global()
@Module({
  providers: [DiscordLogger],
  exports: [DiscordLogger]
})
export class LoggerModule {}