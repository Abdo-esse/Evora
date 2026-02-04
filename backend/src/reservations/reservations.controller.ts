import { Controller, Post, Body, UseGuards, Req, Get, Param, Query } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from '../common/dtos/reservations.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../common/decorators/role.decorators';
import { Role } from '../common/enums/role';
import { RolesGuard } from '../common/guards/role.guard';

@Controller('reservations')
export class ReservationsController {
    constructor(private readonly reservationsService: ReservationsService) { }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles([Role.PARTICIPANT])
    @Post()
    async create(@Body() createReservationDto: CreateReservationDto, @Req() req) {
        return this.reservationsService.createReservation(createReservationDto, req.user.sub);
    }

}
