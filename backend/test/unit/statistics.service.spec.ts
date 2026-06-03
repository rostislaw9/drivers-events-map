import { Test, TestingModule } from "@nestjs/testing";

import { EventsRepository } from "../../src/modules/events/events.repository";
import { StatisticsService } from "../../src/modules/statistics/statistics.service";

describe("StatisticsService", () => {
  let service: StatisticsService;
  let eventsRepository: jest.Mocked<EventsRepository>;

  function createMockDocument<T>(data: T) {
    return {
      ...data,
      toObject: jest.fn().mockReturnValue(data),
    };
  }

  const mockLastEvent = createMockDocument({
    id: 5,
    createdAt: new Date("2026-01-05T00:00:00.000Z"),
    lat: 55.5,
    lng: 37.5,
    oid: 200,
    sp: 80,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        {
          provide: EventsRepository,
          useValue: {
            aggregate: jest.fn(),
            findLast: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
    eventsRepository = module.get(EventsRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe("getStatistics", () => {
    it("должен вернуть корректную статистику при наличии данных", async () => {
      eventsRepository.aggregate.mockResolvedValue([
        { totalEvents: 10, averageSpeed: 55.55555, maxSpeed: 120 },
      ]);
      eventsRepository.findLast.mockResolvedValue(mockLastEvent as never);

      const result = await service.getStatistics();

      expect(result.totalEvents).toBe(10);
      expect(result.averageSpeed).toBe(55.56);
      expect(result.maxSpeed).toBe(120);
      expect(result.lastEvent?.id).toBe(5);
    });

    it("должен вернуть нулевые значения если событий нет", async () => {
      eventsRepository.aggregate.mockResolvedValue([]);
      eventsRepository.findLast.mockResolvedValue(null);

      const result = await service.getStatistics();

      expect(result.totalEvents).toBe(0);
      expect(result.averageSpeed).toBe(0);
      expect(result.maxSpeed).toBe(0);
      expect(result.lastEvent).toBeNull();
    });

    it("должен округлять среднюю скорость до 2 знаков", async () => {
      eventsRepository.aggregate.mockResolvedValue([
        { totalEvents: 3, averageSpeed: 33.333333, maxSpeed: 60 },
      ]);
      eventsRepository.findLast.mockResolvedValue(mockLastEvent as never);

      const result = await service.getStatistics();

      expect(result.averageSpeed).toBe(33.33);
    });
  });
});
