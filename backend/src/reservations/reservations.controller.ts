import { Controller, Post, Body, UseGuards, Req, Get, Param, Query, Put } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from '../common/dtos/reservations.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../common/decorators/role.decorators';
import { Role } from '../common/enums/role';
import { RolesGuard } from '../common/guards/role.guard';
import { ReservationStatus } from '../common/enums/reservationStatus';

@Controller('reservations')
export class ReservationsController {
    constructor(private readonly reservationsService: ReservationsService) { }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles([Role.PARTICIPANT])
    @Post()
    async create(@Body() createReservationDto: CreateReservationDto, @Req() req) {
        return this.reservationsService.createReservation(createReservationDto, req.user.sub);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles([Role.PARTICIPANT, Role.ADMIN_ORG])
    @Get(':id')
    async get(@Param('id') id: string, @Req() req) {
        return this.reservationsService.getReservation(id, req.user.role, req.user.sub);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles([Role.PARTICIPANT, Role.ADMIN_ORG])
    @Get()
    async getAll(@Query('page') page: number, @Query('limit') limit: number, @Query('search') search: string, @Query('status') status: ReservationStatus, @Req() req) {
        return this.reservationsService.getAllReservations(req.user.role, req.user.sub, page, limit, search, status);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles([Role.ADMIN_ORG])
    @Put(':id/confirm')
    async confirm(@Param('id') id: string, @Req() req) {
        return this.reservationsService.updateReservationStatus(id, ReservationStatus.CONFIRMED, req.user.sub, req.user.role);
    }

    

    @UseGuards(AuthGuard, RolesGuard)
    @Roles([Role.ADMIN_ORG])
    @Put(':id/cancel')
    async cancel(@Param('id') id: string, @Req() req) {
        return this.reservationsService.updateReservationStatus(id, ReservationStatus.CANCELED, req.user.sub, req.user.role);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles([Role.ADMIN_ORG])
    @Put(':id/refuse')
    async refuse(@Param('id') id: string, @Req() req) {
        return this.reservationsService.updateReservationStatus(id, ReservationStatus.REFUSED, req.user.sub, req.user.role);
    }

}
