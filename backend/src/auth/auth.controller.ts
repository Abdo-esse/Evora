import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Res,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from 'src/common/dtos/auth.dto';
import express from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    this.logger.log('info', 'Registering user', { createUserDto });
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    this.logger.log('info', 'Logging in user', { loginDto });
    const { accessToken, refreshToken, user } =
      await this.authService.login(loginDto);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    this.logger.log('info', 'User logged in', { user });
    return { accessToken, user };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req, @Res({ passthrough: true }) res: express.Response) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new BadRequestException('Refresh token manquant ou invalide');
    }
    this.logger.log('info', 'Logging out user', { refreshToken });
    res.clearCookie('refreshToken');
    return this.authService.logout(refreshToken);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req, @Res({ passthrough: true }) res: express.Response) {
    this.logger.log('info', 'Refreshing token', { req });
    const refreshToken = req.cookies.refreshToken;
    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refresh(refreshToken);
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    this.logger.log('info', 'Token refreshed', { accessToken });
    return { accessToken };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(@Req() req) {
    this.logger.log('info', 'Getting user info', { req });
    return req.user;
  }
}
