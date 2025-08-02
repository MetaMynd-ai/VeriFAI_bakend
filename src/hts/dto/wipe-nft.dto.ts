import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WipeNftDto {
  @ApiProperty({
    description: 'Account ID of the NFT holder',
    example: '0.0.12345',
  })
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({
    description: 'Serial number of the NFT to be wiped',
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  serial_number: string;
}
