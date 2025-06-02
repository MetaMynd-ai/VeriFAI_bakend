import { ApiProperty } from '@nestjs/swagger';

export class PasswordRecoveryRequestDto {
  @ApiProperty() email: string;
}

export class PasswordRecoveryResetDto {
  @ApiProperty() token: string;
  @ApiProperty() newPassword: string;
}
