import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventStatus } from '../common/enums/eventStatus';
import { Role } from '../common/enums/role';

describe('EventsService', () => {
  let service: EventsService;
  let prismaMock: any;

  const fixedDate = new Date('2024-01-01T00:00:00Z');

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    role: Role.ADMIN_ORG,
  };

  const mockEvent = {
    id: 'event-id',
    title: 'Test Event',
    description: 'Test Description',
    startDate: fixedDate,
    endDate: fixedDate,
    location: 'Test Location',
    maxAttendees: 10,
    status: EventStatus.PUBLISHED,
    createdById: 'user-id',
    createdBy: mockUser,
    reservations: [],
  };

  beforeEach(async () => {
    prismaMock = {
      event: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      const createDto = {
        title: 'New Event',
        description: 'Desc',
        startDate: fixedDate,
        endDate: fixedDate,
        location: 'Loc',
        maxAttendees: 50,
        status: EventStatus.DRAFT,
      };

      prismaMock.event.create.mockResolvedValue({ id: 'new-id', ...createDto });

      const result = await service.createEvent(createDto, 'user-id');

      expect(result.id).toBe('new-id');
      expect(prismaMock.event.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          createdBy: { connect: { id: 'user-id' } },
        },
      });
    });
  });

  describe('updateEvent', () => {
    it('should update an event successfully', async () => {
      const updateDto = { title: 'Updated Title' };
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.event.update.mockResolvedValue({ ...mockEvent, ...updateDto });

      const result = await service.updateEvent('event-id', updateDto);

      expect(result.title).toBe('Updated Title');
      expect(prismaMock.event.update).toHaveBeenCalledWith({
        where: { id: 'event-id' },
        data: updateDto,
      });
    });

    it('should throw NotFoundException if event does not exist', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      await expect(service.updateEvent('invalid-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event successfully', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent); // Need findUnique because updateEvent calls it
      prismaMock.event.delete.mockResolvedValue(mockEvent);

      const result = await service.deleteEvent('event-id');

      expect(result).toBe(true);
      expect(prismaMock.event.delete).toHaveBeenCalledWith({ where: { id: 'event-id' } });
    });

    it('should throw BadRequestException on delete error', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.event.delete.mockRejectedValue(new Error('Prisma Error'));

      await expect(service.deleteEvent('event-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEvent', () => {
    it('should return event with limit calculation', async () => {
      const eventWithReservations = {
        ...mockEvent,
        reservations: [{ id: 'res-1' }, { id: 'res-2' }],
      };
      prismaMock.event.findUnique.mockResolvedValue(eventWithReservations);

      const result = await service.getEvent('event-id', Role.PARTICIPANT);

      expect(result.limit).toBe(8); // 10 - 2
      expect(result.id).toBe('event-id');
    });

    it('should throw BadRequestException if participant tries to view a non-published event', async () => {
      const draftEvent = { ...mockEvent, status: EventStatus.DRAFT };
      prismaMock.event.findUnique.mockResolvedValue(draftEvent);

      await expect(service.getEvent('event-id', Role.PARTICIPANT)).rejects.toThrow(BadRequestException);
    });

    it('should allow admin to view a non-published event', async () => {
      const draftEvent = { ...mockEvent, status: EventStatus.DRAFT };
      prismaMock.event.findUnique.mockResolvedValue(draftEvent);

      const result = await service.getEvent('event-id', Role.ADMIN_ORG);

      expect(result.id).toBe('event-id');
    });

    it('should throw NotFoundException if event not found', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      await expect(service.getEvent('event-id', Role.ADMIN_ORG)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllEvents', () => {
    it('should return events with pagination and filtering', async () => {
      prismaMock.event.findMany.mockResolvedValue([mockEvent]);

      const result = await service.getAllEvents(1, 10, 'search', EventStatus.PUBLISHED, Role.PARTICIPANT);

      expect(result).toHaveLength(1);
      expect(prismaMock.event.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          title: { contains: 'search' },
          status: EventStatus.PUBLISHED,
        },
      });
    });

    it('should allow admin to filter by status', async () => {
      prismaMock.event.findMany.mockResolvedValue([mockEvent]);

      await service.getAllEvents(1, 10, '', EventStatus.DRAFT, Role.ADMIN_ORG);

      expect(prismaMock.event.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          status: EventStatus.DRAFT,
        }),
      }));
    });
  });
});
