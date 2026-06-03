import { Test, TestingModule } from "@nestjs/testing";

import { EventsService } from "../../src/modules/events/events.service";
import { EventCreateHandler } from "../../src/modules/rpc/handlers/event-create.handler";
import { RpcValidationError } from "../../src/modules/rpc/rpc-validation-error";

describe("EventCreateHandler", () => {
  let handler: EventCreateHandler;
  let eventsService: jest.Mocked<EventsService>;

  const mockEvent = {
    id: 1,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    lat: 55.123,
    lng: 37.123,
    oid: 100,
    sp: 60,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventCreateHandler,
        {
          provide: EventsService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    handler = module.get<EventCreateHandler>(EventCreateHandler);
    eventsService = module.get(EventsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe("execute", () => {
    it("должен создать событие и вернуть его id", async () => {
      eventsService.create.mockResolvedValue(mockEvent);

      const result = await handler.execute({
        lat: 55.123,
        lng: 37.123,
        oid: 100,
        sp: 60,
      });

      expect(result).toEqual({ id: 1 });
      expect(eventsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ lat: 55.123, lng: 37.123, oid: 100, sp: 60 }),
      );
    });

    it("должен бросить RpcValidationError если lat вне диапазона [-90, 90]", async () => {
      await expect(
        handler.execute({ lat: 200, lng: 37.0, oid: 1, sp: 60 }),
      ).rejects.toThrow(RpcValidationError);
    });

    it("должен бросить RpcValidationError если lng вне диапазона [-180, 180]", async () => {
      await expect(
        handler.execute({ lat: 55.0, lng: 200, oid: 1, sp: 60 }),
      ).rejects.toThrow(RpcValidationError);
    });

    it("должен бросить RpcValidationError если oid равен 0 (минимум 1)", async () => {
      await expect(
        handler.execute({ lat: 55.0, lng: 37.0, oid: 0, sp: 60 }),
      ).rejects.toThrow(RpcValidationError);
    });

    it("должен бросить RpcValidationError если sp отрицательный", async () => {
      await expect(
        handler.execute({ lat: 55.0, lng: 37.0, oid: 1, sp: -10 }),
      ).rejects.toThrow(RpcValidationError);
    });

    it("должен бросить RpcValidationError если обязательные поля отсутствуют", async () => {
      await expect(handler.execute({})).rejects.toThrow(RpcValidationError);
    });

    it("должен принимать граничные значения координат (Москва)", async () => {
      eventsService.create.mockResolvedValue({
        ...mockEvent,
        lat: 55.755,
        lng: 37.617,
      });

      const result = await handler.execute({
        lat: 55.755,
        lng: 37.617,
        oid: 42,
        sp: 0,
      });

      expect(result).toEqual({ id: 1 });
    });

    it("должен принимать нулевую скорость", async () => {
      eventsService.create.mockResolvedValue({ ...mockEvent, sp: 0 });

      const result = await handler.execute({
        lat: 55.0,
        lng: 37.0,
        oid: 1,
        sp: 0,
      });

      expect(result).toEqual({ id: 1 });
    });
  });
});
