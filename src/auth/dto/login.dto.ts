import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ default: 'inam' }) email_or_username: string;
  @ApiProperty({ default: 'abc123' }) password: string;
}
