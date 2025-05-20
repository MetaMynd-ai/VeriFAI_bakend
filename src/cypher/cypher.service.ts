import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IHedera } from '@hsuite/types';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

@Injectable()
export class CypherService {
    private logger: Logger = new Logger(CypherService.name);
    private environment: string;
    private node: IHedera.IOperator;

    constructor(
        private configService: ConfigService
    ) {
        this.environment = this.configService.get<string>('environment');
        this.node = this.configService.get<IHedera.IOperator>(`${this.environment}.node`);
    }

    async encrypt(textToEncrypt: string): Promise<{
        iv: any,
        encryptedText: any
    }> {
        return new Promise(async(resolve, reject) => {
            try {
                const iv = randomBytes(16);
                const key = (await promisify(scrypt)(this.node.privateKey, 'salt', 32)) as Buffer;
                const cipher = createCipheriv('aes-256-ctr', key, iv);
                
                const encryptedText = Buffer.concat([
                  cipher.update(textToEncrypt),
                  cipher.final(),
                ]);

                resolve({
                    iv: iv.toString('base64'),
                    encryptedText: encryptedText.toString('base64')
                });
            } catch(error) {
                reject(error);
            }
        })
    }

    async decrypt(encryptedText: any, iv: any): Promise<any> {
        return new Promise(async(resolve, reject) => {
            try {
                const key = (await promisify(scrypt)(this.node.privateKey, 'salt', 32)) as Buffer;
                const decipher = createDecipheriv('aes-256-ctr', key,  Buffer.from(iv, 'base64'));
                const decryptedText = Buffer.concat([
                  decipher.update(Buffer.from(encryptedText, 'base64')),
                  decipher.final(),
                ]);

                resolve(decryptedText.toString());
            } catch(error) {
                reject(error);
            }
        })
    }

}
