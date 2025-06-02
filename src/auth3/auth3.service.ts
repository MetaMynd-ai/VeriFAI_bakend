import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class Auth3Service {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async profile(user: any) {
    // Return the user profile from the session
    return user;
  }

  async register(credentials: RegisterDto): Promise<any> {
    // Check for existing user by email or username
    const existing = await this.userModel.findOne({
      $or: [
        { email: credentials.email },
        { username: credentials.username }
      ]
    });
    if (existing) {
      throw new Error('User with this email or username already exists.');
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(credentials.password, 10);
    const now = Date.now().toString();
    const user = new this.userModel({
      ...credentials,
      password: hashedPassword,
      confirmed: false,
      type: 'web2',
      role: 'user',
      banned: false,
      twoFactorAuth: {
        status: 'disabled',
        factorSid: '',
        identity: '',
        qr_code: ''
      },
      created_at: now,
      updated_at: now
    });
    const saved = await user.save();
    // Return a safe user object (omit password)
    const { password, ...safeUser } = saved.toObject();
    return safeUser;
  }

  async login(credentials: any, req: any, res: any): Promise<any> {
    // Implement login logic here
    // e.g., validate credentials, set session, return user profile
    return { success: true, user: credentials };
  }

  async passwordRecoveryRequest(email: string): Promise<boolean> {
    // Implement password recovery request logic here
    return true;
  }

  async passwordRecoveryReset(token: string, newPassword: string): Promise<boolean> {
    // Implement password reset logic here
    return true;
  }

  async emailConfirmation(token: string): Promise<boolean> {
    // Implement email confirmation logic here
    return true;
  }

  async sendConfirmationEmail(userId: string, email: string): Promise<boolean> {
    // Implement send confirmation email logic here
    return true;
  }

  async logout(req: any, res: any): Promise<boolean> {
    // Implement logout logic here (destroy session)
    if (req.session) {
      req.session.destroy(() => res.send({ logout: true, message: 'Logged out' }));
      return true;
    }
    res.send({ logout: false, message: 'No session found' });
    return false;
  }
}
