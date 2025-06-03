import { IS_PUBLIC_KEY } from '@hsuite/decorators';
import { Injectable, ExecutionContext, CanActivate, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { Model } from 'mongoose';
import { User } from 'src/auth3/entities/user.entity';


@Injectable()
export class GlobalAuthGuard extends AuthGuard('session') implements CanActivate {
  constructor(private reflector: Reflector,
    @InjectModel(User.name) private userModel: Model<User>,) {
    console.log('GlobalAuthGuard: Constructed');
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('GlobalAuthGuard: canActivate called');
    const request = context.switchToHttp().getRequest();
    // check if the request is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log('GlobalAuthGuard canActivate called for ', context.getHandler().name, isPublic);
    if (isPublic) {
      console.log('GlobalAuthGuard canActivate called for public route');
      return true;
    }
    if (!request.session || !request.session.passport || !request.session.passport.user) {
      throw new UnauthorizedException('User not authenticated');
    } else {
      const user = await this.userModel.findOne({

        _id: request.session.passport.user


      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      // Remove password before attaching user to request
      const { password, ...safeUser } = user.toObject ? user.toObject() : user;
      request.user = safeUser; // Attach the user to the request object
      // get the user from mobgodb using user entity 

    }
    if (!request.session.passport.user) {
      throw new UnauthorizedException('User ID not found in session');
    }



    console.log('IssuerAuthGuard canActivate called ' + request.session.passport.user);

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

