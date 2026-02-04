import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventStatus } from '../common/enums/eventStatus';
import { ReservationStatus } from '../common/enums/reservationStatus';
import { Role } from '../common/enums/role';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: any;

  const prismaMock = {
    event: {
      findUnique: jest.fn(),
    },
    reservation: {
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('createReservation', () => {
    it('should create reservation', async () => {
      prisma.$transaction.mockImplementation(async (cb) => cb(prismaMock));

      prisma.event.findUnique.mockResolvedValue({
        id: 'event1',
        status: EventStatus.PUBLISHED,
        maxAttendees: 10,
      });

      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.reservation.count.mockResolvedValue(5);
      prisma.reservation.create.mockResolvedValue({ id: 'res1' });

      const result = await service.createReservation(
        { eventId: 'event1', userId: 'user1' } as any,
        'user1',
      );

      expect(result).toEqual({ id: 'res1' });
    });

    it('should throw if event not found', async () => {
      prisma.$transaction.mockImplementation(async (cb) => cb(prismaMock));
      prisma.event.findUnique.mockResolvedValue(null);

      await expect(
        service.createReservation({ eventId: 'x' } as any, 'user1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if already reserved', async () => {
      prisma.$transaction.mockImplementation(async (cb) => cb(prismaMock));
      prisma.event.findUnique.mockResolvedValue({
        status: EventStatus.PUBLISHED,
        maxAttendees: 10,
      });

      prisma.reservation.findFirst.mockResolvedValue({
        status: ReservationStatus.PENDING,
      });

      await expect(
        service.createReservation({ eventId: 'e1' } as any, 'user1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw if event is full', async () => {
      prisma.$transaction.mockImplementation(async (cb) => cb(prismaMock));
      prisma.event.findUnique.mockResolvedValue({
        status: EventStatus.PUBLISHED,
        maxAttendees: 5,
      });

      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.reservation.count.mockResolvedValue(5);

      await expect(
        service.createReservation({ eventId: 'e1' } as any, 'user1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateReservationStatus', () => {
    it('should update status', async () => {
      prisma.$transaction.mockImplementation(async (cb) => cb(prismaMock));

      prisma.reservation.findUnique.mockResolvedValue({
        id: 'r1',
        status: ReservationStatus.PENDING,
        userId: 'user1',
        eventId: 'e1',
        event: { maxAttendees: 10 },
      });

      prisma.reservation.count.mockResolvedValue(2);
      prisma.reservation.update.mockResolvedValue({ status: ReservationStatus.CONFIRMED });

      const result = await service.updateReservationStatus(
        'r1',
        ReservationStatus.CONFIRMED,
        'user1',
        Role.ADMIN_ORG,
      );

      expect(result.status).toBe(ReservationStatus.CONFIRMED);
    });

    it('should forbid participant to confirm', async () => {
      prisma.$transaction.mockImplementation(async (cb) => cb(prismaMock));

      await expect(
        service.updateReservationStatus(
          'r1',
          ReservationStatus.CONFIRMED,
          'user1',
          Role.PARTICIPANT,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw on invalid transition', async () => {
      prisma.$transaction.mockImplementation(async (cb) => cb(prismaMock));

      prisma.reservation.findUnique.mockResolvedValue({
        status: ReservationStatus.CANCELED,
        userId: 'user1',
        event: { maxAttendees: 10 },
      });

      await expect(
        service.updateReservationStatus(
          'r1',
          ReservationStatus.CONFIRMED,
          'user1',
          Role.ADMIN_ORG,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getReservation', () => {
    it('should return reservation', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 'user1',
      });

      const res = await service.getReservation('r1', Role.ADMIN_ORG, 'x');
      expect(res.id).toBe('r1');
    });

    it('should forbid access to other user', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 'user1',
      });

      await expect(
        service.getReservation('r1', Role.PARTICIPANT, 'user2'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAllReservations', () => {
    it('should return paginated result', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'r1' }], 1]);

      const result = await service.getAllReservations(Role.ADMIN_ORG);

      expect(result.total).toBe(1);
      expect(result.data.length).toBe(1);
    });
  });
});
