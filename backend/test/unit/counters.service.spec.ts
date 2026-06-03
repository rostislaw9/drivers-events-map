import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";

import { CountersService } from "../../src/modules/counters/counters.service";
import { Counter } from "../../src/modules/counters/schemas/counter.schema";

describe("CountersService", () => {
  let service: CountersService;

  const mockFindOneAndUpdate = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountersService,
        {
          provide: getModelToken(Counter.name),
          useValue: { findOneAndUpdate: mockFindOneAndUpdate },
        },
      ],
    }).compile();

    service = module.get<CountersService>(CountersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe("getNextSequence", () => {
    it("должен вернуть следующее значение счётчика", async () => {
      mockFindOneAndUpdate.mockResolvedValue({ seq: 1 });

      const result = await service.getNextSequence("events");

      expect(result).toBe(1);
      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { _id: "events" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
    });

    it("должен возвращать инкрементальные значения при последовательных вызовах", async () => {
      mockFindOneAndUpdate
        .mockResolvedValueOnce({ seq: 1 })
        .mockResolvedValueOnce({ seq: 2 })
        .mockResolvedValueOnce({ seq: 3 });

      const results = await Promise.all([
        service.getNextSequence("events"),
        service.getNextSequence("events"),
        service.getNextSequence("events"),
      ]);

      expect(results).toEqual([1, 2, 3]);
    });
  });
});
