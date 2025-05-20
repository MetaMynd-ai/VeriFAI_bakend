import { ApiProperty } from '@nestjs/swagger';

export class UnfreezeAccountsDto {
  @ApiProperty({
    description: 'Array of account IDs to unfreeze',
    type: [String],
    example: ['0.0.xxxxxa', '0.0.xxxxxb', '0.0.xxxxxc'],
  })
  accountIds: string[];
}
