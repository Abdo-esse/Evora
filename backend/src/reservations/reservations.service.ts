import { Injectable, BadRequestException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from '../common/dtos/reservations.dto';
import { EventStatus } from '../common/enums/eventStatus';
import { ReservationStatus } from '../common/enums/reservationStatus';
import { Role } from '../common/enums/role';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReservationsService {
    constructor(private readonly prisma: PrismaService) { }

    async createReservation( createReservationDto: CreateReservationDto, userId: string) {
        return this.prisma.$transaction(async (tx) => {

            const event = await tx.event.findUnique({
                where: { id: createReservationDto.eventId },
            });

            if (!event) {
                throw new NotFoundException('Event not found');
            }

            if (event.status !== EventStatus.PUBLISHED) {
                throw new BadRequestException('Event is not published');
            }

            const existingReservation = await tx.reservation.findFirst({
                where: {
                    eventId: createReservationDto.eventId,
                    userId,
                },
            });

            if (existingReservation) {
                throw new ConflictException('You already have a reservation for this event, with status : ' + existingReservation.status);
            }

            const count = await tx.reservation.count({
                where: {
                    eventId: createReservationDto.eventId,
                    status: {
                        in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING],
                    },
                },
            });

            if (count >= event.maxAttendees) {
                throw new BadRequestException('Event is full');
            }

            return tx.reservation.create({
                data: {
                    ...createReservationDto,
                    userId: createReservationDto.userId,
                    status: ReservationStatus.PENDING, 
                },
            });
        });
    }

    async updateReservationStatus(
        reservationId: string,
        newStatus: ReservationStatus,
        userId: string,
        role: Role,
    ) {
        return this.prisma.$transaction(async (tx) => {
            if(role === Role.PARTICIPANT && newStatus !== ReservationStatus.CANCELED){
                throw new ForbiddenException('Not allowed');
            }
            const reservation = await tx.reservation.findUnique({
                where: { id: reservationId },
                include: { event: true },
            });

            if (!reservation) {
                throw new NotFoundException('Reservation not found');
            }

            if (role === Role.PARTICIPANT && reservation.userId !== userId) {
                throw new ForbiddenException('Not allowed');
            }

            const allowedTransitions: Record<ReservationStatus, ReservationStatus[]> = {
                [ReservationStatus.PENDING]: [
                    ReservationStatus.CONFIRMED,
                    ReservationStatus.REFUSED,
                    ReservationStatus.CANCELED,
                ],
                [ReservationStatus.CONFIRMED]: [ReservationStatus.CANCELED ],
                [ReservationStatus.REFUSED]: [],
                [ReservationStatus.CANCELED]: [],
            };

            if (!allowedTransitions[reservation.status].includes(newStatus)) {
                throw new BadRequestException(
                    `Invalid transition from ${reservation.status} to ${newStatus}`,
                );
            }

            if (newStatus === ReservationStatus.CONFIRMED) {
                const count = await tx.reservation.count({
                    where: {
                        eventId: reservation.eventId,
                        status: ReservationStatus.CONFIRMED,
                    },
                });

                if (count >= reservation.event.maxAttendees) {
                    throw new BadRequestException('Event is full');
                }
            }

            return tx.reservation.update({
                where: { id: reservationId },
                data: { status: newStatus },
            });
        });

    }

    async getReservation(id: string,role: Role,userId: string) {
        const reservation = await this.prisma.reservation.findUnique({
            where: { id },
            include: {
                user: true,
                event: true,
            },
        });

        if (!reservation) {
            throw new NotFoundException('Reservation not found');
        }

        if(role === Role.PARTICIPANT && reservation.userId !== userId){
            throw new ForbiddenException('Not allowed');
        }

        return reservation;
    }


    async getAllReservations(
    role: Role,
    userId?: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: ReservationStatus,
    ) {
        const skip = Math.max(0, (page - 1) * limit);

        const where: Prisma.ReservationWhereInput = {};

        // Restriction PARTICIPANT
        if (role === Role.PARTICIPANT && userId) {
            where.userId = userId;
        }

        // Filtre status
        if (status) {
            where.status = status;
        }

        // Recherche (event.title OU user.name)
        if (search && search.trim() !== '') {
            where.OR = [
            {
                event: {
                title: { contains: search, mode: 'insensitive' },
                },
            },
            {
                user: {
                firstName: { contains: search, mode: 'insensitive' },
                lastName: { contains: search, mode: 'insensitive' },
                },
            },
            ];
        }

        const [data, total] = await this.prisma.$transaction([
            this.prisma.reservation.findMany({
            where,
            skip,
            take: limit,
            include: {
            user: true,
            event: true,
            },
            orderBy: { createdAt: 'desc' },
            }),
            this.prisma.reservation.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }



}
