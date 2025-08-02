import { ApiProperty } from '@nestjs/swagger';

export class EmailConfirmationDto {
  @ApiProperty() token: string;
}
