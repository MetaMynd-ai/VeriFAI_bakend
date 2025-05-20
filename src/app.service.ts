import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IHedera, ISmartNode } from '@hsuite/types';

@Injectable()
export class AppService {
  private environment: string;
  private node: IHedera.IOperator;
  
  constructor(
    private configService: ConfigService
  ) {
    this.environment = this.configService.get<string>('environment');
    this.node = this.configService.get<IHedera.IOperator>(`${this.environment}.node`);
  }
 
  async smartNodeIdentifier(): Promise<ISmartNode.IOperator> {
    return new Promise(async(resolve, reject) => {
      try {
        resolve({
          accountId: this.node.accountId,
          publicKey: this.node.publicKey
        });        
      } catch(error) {
        reject(error);
      }
    });
  }
}
