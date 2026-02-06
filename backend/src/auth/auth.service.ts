import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, LoginDto } from 'src/common/dtos/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (user) {
      throw new ConflictException('email already exists');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        role: 'PARTICIPANT',
      },
    });
    const { password: _password, ...userWithoutPassword } = newUser;
    return { user: userWithoutPassword };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        expiresIn: '15m',
        secret: process.env.JWT_SECRET,
        algorithm: (process.env.JWT_ALGORITHM as any) || 'HS256',
      },
    );
    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        expiresIn: '7d',
        secret: process.env.JWT_SECRET,
        algorithm: (process.env.JWT_ALGORITHM as any) || 'HS256',
      },
    );

    // Save refresh token to DB
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    const { password: _password, ...userWithoutPassword } = user;
    return { accessToken, refreshToken, user: userWithoutPassword };
  }

  async logout(refreshToken: string) {
    try {
      const refreshTokenDecoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
      if (refreshTokenDecoded) {
        await this.prisma.refreshToken.delete({
          where: { token: refreshToken },
        });
      }
    } catch (_error) {
      // If token is invalid or expired, we can still consider logout successful from user point of view
      // but we might want to log it or handle it. For now, let's just make sure it doesn't crash.
    }
    return true;
  }

  async refresh(refreshToken: string) {
    const found = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!found) throw new NotFoundException('Refresh token not found');

    let decoded: any;
    try {
      decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
        algorithms: [(process.env.JWT_ALGORITHM as any) || 'HS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!decoded?.sub) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
    });
    if (!user) throw new NotFoundException('User not found');

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        expiresIn: '15m',
        secret: process.env.JWT_SECRET,
        algorithm: (process.env.JWT_ALGORITHM as any) || 'HS256',
      },
    );

    // ✅ NEW refresh token (rotation)
    const newRefreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        expiresIn: '7d', // adapte à ton besoin
        secret: process.env.JWT_SECRET,
        algorithm: (process.env.JWT_ALGORITHM as any) || 'HS256',
      },
    );

    await this.prisma.refreshToken.update({
      where: { id: found.id },
      data: { token: newRefreshToken },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }
}
