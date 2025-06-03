import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ default: 'inam' }) username: string;
  @ApiProperty({ default: 'inam@ai.com' }) email: string;
  @ApiProperty({ default: 'abc123' }) password: string;
}
