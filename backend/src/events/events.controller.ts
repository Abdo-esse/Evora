import { Controller, Post, Body, UseGuards, Req, Put, Delete, Get, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from 'src/common/dtos/events.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../common/decorators/role.decorators';
import { Role } from 'src/common/enums/role';
import { EventStatus } from 'src/common/enums/eventStatus';
import { RolesGuard } from '../common/guards/role.guard';

@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles([Role.ADMIN_ORG])
    @Post()
    async create(@Body() createEventDto: CreateEventDto, @Req() req) {
        return this.eventsService.createEvent(createEventDto, req.user.sub);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles([Role.ADMIN_ORG])
    @Put(':id')
    async update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
        return this.eventsService.updateEvent(id, updateEventDto);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles([Role.ADMIN_ORG])
    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.eventsService.deleteEvent(id);
    }

    @UseGuards(AuthGuard)
    @Get(':id')
    async get(@Param('id') id: string, @Req() req) {
        return this.eventsService.getEvent(id, req.user.role);
    }
    @UseGuards(AuthGuard)
    @Get()
    async getAll(@Query('page') page: number, @Query('limit') limit: number, @Query('search') search: string, @Query('status') status: EventStatus, @Req() req) {
        return this.eventsService.getAllEvents(page, limit, search, status, req.user.role);
    }
}
