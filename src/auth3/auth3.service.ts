import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { rejects } from 'assert';

@Injectable()
export class Auth3Service {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async profile(user: any) {
    console.log('Fetching user profile from session:', user);
    // Return the user profile from the session
    return user;
  }

  async register(credentials: RegisterDto): Promise<any> {
    // Check for existing user by email or username
    const existing = await this.userModel.findOne({
      $or: [{ email: credentials.email }, { username: credentials.username }],
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
        qr_code: '',
      },
      created_at: now,
      updated_at: now,
    });
    const saved = await user.save();
    // Return a safe user object (omit password)
    const { password, ...safeUser } = saved.toObject();
    return safeUser;
  }

  async login(credentials: LoginDto, req: any, res: any): Promise<any> {
    try {
      const user = await this.userModel.findOne({
        $or: [{ email: credentials.email }, { username: credentials.username }],
      });
      if (!user) throw new Error('Invalid email/username or password');
      const valid = await bcrypt.compare(credentials.password, user.password);
      if (!valid) throw new Error('Invalid email/username or password');
      req.login(user, (err: any) => {
        if (err) {
          return res
            .status(500)
            .send({ success: false, message: 'Login failed' });
        }
        const { password, ...safeUser } = user.toObject();
        res.send({ success: true, user: safeUser });
      });
    } catch (error) {
      return res
        .status(401)
        .json({ success: false, message: error.message || 'Unauthorized' });
    }
  }

  async passwordRecoveryRequest(email: string): Promise<boolean> {
    // Implement password recovery request logic here
    return true;
  }

  async passwordRecoveryReset(
    token: string,
    newPassword: string,
  ): Promise<boolean> {
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
    if (req.session) {
      console.log('Logging out user1:', req.session.user);
      req.session.destroy(() => {
        res.clearCookie('connect.sid'); // or your session cookie name
        res.send({ logout: true, message: 'Logged out' });
      });
      return true;
    }
    res.send({ logout: false, message: 'No session found' });
    return false;
  }
}
