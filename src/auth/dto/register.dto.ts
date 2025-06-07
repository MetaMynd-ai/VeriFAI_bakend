import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty() username: string;
  @ApiProperty() email: string;
  @ApiProperty() password: string;
  @ApiProperty({
    type: Object,
    required: false,
    example: { key: 'name', value: 'John Doe' }
  })
  tags?: { key: string; value: string };
}
