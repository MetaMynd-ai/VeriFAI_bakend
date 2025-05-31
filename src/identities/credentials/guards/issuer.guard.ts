import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { CredentialsService } from '../credentials.service';

@Injectable()
export class IssuerAuthGuard implements CanActivate {
  constructor(
    private credentialsService: CredentialsService
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
   

    // if(!['admin', 'issuer','user'].includes(request.user.role)) {
    //   throw new UnauthorizedException('Sorry, only admin or issuer can issue a VC.');
    // }

    // if(request.user.role === 'issuer') {
    //   try {
    //     await this.credentialsService.getIssuerForOwner(request.user._id);
    //   } catch(error) {
    //       throw new UnauthorizedException(error.message);
    //   }
    // }

    return true;
  }
}
