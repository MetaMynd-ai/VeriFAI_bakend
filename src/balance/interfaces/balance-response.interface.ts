import { ApiProperty } from '@nestjs/swagger';

class Balance {
  @ApiProperty()
  account: string;

  @ApiProperty()
  balance: number;
}

export class BalanceResponse {
  @ApiProperty()
  timestamp: string | null;

  @ApiProperty({ type: [Balance] })
  balances: Balance[];
}