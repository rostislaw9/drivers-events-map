import { Test, TestingModule } from "@nestjs/testing";

import { CountersService } from "../../src/modules/counters/counters.service";
import { CreateEventDto, ViewportQueryDto } from "../../src/modules/events/dto";
import { EventsRepository } from "../../src/modules/events/events.repository";
import { EventsService } from "../../src/modules/events/events.service";

describe("EventsService", () => {
  let service: EventsService;
  let eventsRepository: jest.Mocked<EventsRepository>;
  let countersService: jest.Mocked<CountersService>;

  function createMockDocument<T>(data: T) {
    return {
      ...data,
      toObject: jest.fn().mockReturnValue(data),
    };
  }

  const mockEvent = createMockDocument({
    id: 1,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    lat: 55.123,
    lng: 37.123,
    oid: 100,
    sp: 60,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: EventsRepository,
          useValue: {
            create: jest.fn(),
            findByViewport: jest.fn(),
            findLast: jest.fn(),
          },
        },
        {
          provide: CountersService,
          useValue: {
            getNextSequence: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventsRepository = module.get(EventsRepository);
    countersService = module.get(CountersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe("create", () => {
    it("должен создать событие с инкрементным ID", async () => {
      countersService.getNextSequence.mockResolvedValue(1);
      eventsRepository.create.mockResolvedValue(mockEvent as never);

      const dto: CreateEventDto = {
        lat: 55.123,
        lng: 37.123,
        oid: 100,
        sp: 60,
      };
      const result = await service.create(dto);

      expect(countersService.getNextSequence).toHaveBeenCalledWith("events");
      expect(eventsRepository.create).toHaveBeenCalledWith(dto, 1);
      expect(result.id).toBe(1);
      expect(result.lat).toBe(55.123);
      expect(result.sp).toBe(60);
    });
  });

  describe("findByViewport", () => {
    it("должен возвращать события в пределах вьюпорта", async () => {
      eventsRepository.findByViewport.mockResolvedValue([mockEvent] as never);

      const viewport: ViewportQueryDto = {
        northEastLat: 56.0,
        northEastLng: 38.0,
        southWestLat: 55.0,
        southWestLng: 36.0,
      };

      const result = await service.findByViewport(viewport);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(eventsRepository.findByViewport).toHaveBeenCalledWith(viewport);
    });

    it("должен вернуть пустой массив если событий нет", async () => {
      eventsRepository.findByViewport.mockResolvedValue([]);

      const viewport: ViewportQueryDto = {
        northEastLat: 56.0,
        northEastLng: 38.0,
        southWestLat: 55.0,
        southWestLng: 36.0,
      };

      const result = await service.findByViewport(viewport);
      expect(result).toEqual([]);
    });
  });
});
