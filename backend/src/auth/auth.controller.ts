import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto} from 'src/common/dtos/auth.dto';
import express from 'express';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: express.Response) {
        const {accessToken, refreshToken, user} = await this.authService.login(loginDto);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {accessToken, user};
    }
    
    @UseGuards(AuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Req() req, @Res({ passthrough: true }) res: express.Response) {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken || typeof refreshToken !== "string") {
            throw new BadRequestException("Refresh token manquant ou invalide");
        }
        res.clearCookie('refreshToken');
        return this.authService.logout(refreshToken);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Req() req, @Res({ passthrough: true }) res: express.Response) {
        const refreshToken = req.cookies.refreshToken;
        const {accessToken, refreshToken: newRefreshToken} = await this.authService.refresh(refreshToken);
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {accessToken};
    }

    @UseGuards(AuthGuard)
    @Get('me')
    @HttpCode(HttpStatus.OK)
    async me(@Req() req) {
        return req.user;
    }
}
