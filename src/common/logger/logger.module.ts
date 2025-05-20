import { Module, Global } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { DiscordLogger } from './discord-logger.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';
import { ecsFormat } from '@elastic/ecs-pino-format';
import * as rfs from 'rotating-file-stream';

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logsDir = path.join(process.cwd(), 'logs');
        
        let logStream;
        try {
          if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
          }
          
          // Create a rotating file stream instead of a regular file stream
          logStream = rfs.createStream('app.log', {
            interval: '1d',       // Rotate daily
            path: logsDir,        // Log directory
            size: '10M',          // Also rotate when size exceeds 10MB
            compress: 'gzip',     // Compress rotated files
            maxFiles: 14,         // Keep logs for 14 days
            // The rotated file will be named with this pattern: app-YYYY-MM-DD-HH-MM-SS-N.log
            // where N is an incremental number
          });
          
        } catch (error) {
          console.error(`Failed to create logs directory or stream: ${error.message}`);
          // Fallback to stdout if we can't write to a file
          logStream = process.stdout;
        }
        
        const isDev = configService.get<string>('NODE_ENV') !== 'production';
        
        const ecsOptions = {
          serviceName: 'smart-app-backend'
        };
        
        return {
          pinoHttp: {
          
            level: 'info',
            stream: pino.multistream([
              { stream: process.stdout },  // Also log to console
              { stream: logStream }        // Log to rotating file
            ])
          }
        };
      }
    })
  ],
  providers: [DiscordLogger],
  exports: [PinoLoggerModule, DiscordLogger],
})
export class LoggerModule {}