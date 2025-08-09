import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class TransferHbarDto {
  @ApiProperty({
    description: 'Sender account ID',
    example: '0.0.12345',
  })
  @IsString()
  sender: string;

  @ApiProperty({
    description: 'Receiver account ID',
    example: '0.0.67890',
  })
  @IsString()
  receiver: string;

  @ApiProperty({
    description: 'Amount of HBAR to transfer (in tinybars)',
    example: 100000000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Optional memo for the transfer',
    example: 'Payment for services',
    required: false,
  })
  @IsOptional()
  @IsString()
  memo?: string;
}