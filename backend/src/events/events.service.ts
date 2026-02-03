import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from 'src/common/dtos/events.dto';
import { EventStatus } from 'src/common/enums/eventStatus';
import { Role } from 'src/common/enums/role';

@Injectable()
export class EventsService {
    constructor(private readonly prisma: PrismaService) { }

    async createEvent(createEventDto: CreateEventDto, userId: string) {
        return this.prisma.event.create({
            data: {
                ...createEventDto,
                createdBy: {
                    connect: { id: userId },
                },
            },
        });
    }

    async updateEvent(id: string, updateEventDto: UpdateEventDto) {
        try {
            const event = await this.prisma.event.findUnique({ where: { id } });
            if (!event) {
                throw new NotFoundException('Event not found');
            }
            const updatedEvent = await this.prisma.event.update({ where: { id }, data:  updateEventDto });
            return updatedEvent;
        } catch (error) {
            throw new BadRequestException( error.message ||'Invalid update data');
        }
    }

    async deleteEvent(id: string) {
        try {
            const event = await this.prisma.event.findUnique({ where: { id } });
            if (!event) {
                throw new NotFoundException('Event not found');
            }
            
            await this.prisma.event.delete({ where: { id } });
            return true;
        } catch (error) {
            throw new BadRequestException( error.message ||'Invalid delete data');
        }
    }

    async getEvent(id: string, role: Role) {
        try {
            // get event with count of reservations
            const event = await this.prisma.event.findUnique({ where: { id }, include: { createdBy: true, reservations: { select: { id: true } } } });
            if (!event) {
                throw new NotFoundException('Event not found');
            }
            if(event.status !== EventStatus.PUBLISHED && role === Role.PARTICIPANT){
                throw new BadRequestException('Event is not published');
            }
            const limit = event.maxAttendees - event.reservations.length;
            return {...event, limit};
        } catch (error) {
            throw new BadRequestException( error.message ||'Invalid get data');
        }
    }

    async getAllEvents(page: number, limit: number, search: string, status: EventStatus, role: Role) {
        try {
            const skip = (page - 1) * limit;
            const events = await this.prisma.event.findMany({
                skip,
                take: limit,
                where: {
                    title: { contains: search },
                    status: role===Role.ADMIN_ORG? status: EventStatus.PUBLISHED,
                },
            });
            return events;
        } catch (error) {
            throw new BadRequestException( error.message ||'Invalid get data');
        }
    }

}
