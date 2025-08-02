import { Injectable, Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DiscordLogger extends Logger {
  private webhookUrl: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.webhookUrl = this.configService.get<string>('DISCORD_WEBHOOK_URL');
  }

  async log(message: any, context?: string) {
    super.log(message, context);
    await this.sendToDiscord('log', message, context);
  }

  async error(message: any, trace?: string, context?: string) {
    super.error(message, trace, context);
    await this.sendToDiscord('error', `${message}\nTrace: ${trace}`, context);
  }

  async warn(message: any, context?: string) {
    super.warn(message, context);
    await this.sendToDiscord('warn', message, context);
  }

  async debug(message: any, context?: string) {
    super.debug(message, context);
    await this.sendToDiscord('debug', message, context);
  }

  async verbose(message: any, context?: string) {
    super.verbose(message, context);
    await this.sendToDiscord('verbose', message, context);
  }

  private async sendToDiscord(level: LogLevel, message: string, context?: string) {
    if (!this.webhookUrl) {
      return;
    }
    const logMessage = {
      username: 'IVC Logger',
      embeds: [
        {
          title: `${level} - ${context || 'Application'}`,
          description: `\`\`\`${message}\`\`\``,
          color: this.getColor(level),
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      await axios.post(this.webhookUrl, logMessage);
    } catch (error) {
      super.error(`Failed to send log to Discord: ${error.message}`);
    }
  }

  private getColor(level: LogLevel): number {
    const colors: Record<LogLevel, number> = {
        error: 0xff0000,
        warn: 0xffff00,
        log: 0x00ff00,
        debug: 0x3498db,
        verbose: 0x95a5a6,
        fatal: 0xff0000,
    };
    return colors[level] || 0xffffff;
  }
}
