import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";

import { EventsController } from "../../src/modules/events/events.controller";
import { EventsService } from "../../src/modules/events/events.service";

describe("EventsController (integration)", () => {
  let app: INestApplication;
  const mockEventsService = {
    create: jest.fn(),
    findByViewport: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: mockEventsService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe("GET /api/events", () => {
    it("должен вернуть события в пределах вьюпорта", async () => {
      const mockEvents = [
        {
          id: 1,
          createdAt: new Date(),
          lat: 55.5,
          lng: 37.5,
          oid: 100,
          sp: 60,
        },
      ];
      mockEventsService.findByViewport.mockResolvedValue(mockEvents);

      const response = await request(app.getHttpServer())
        .get("/api/events")
        .query({
          northEastLat: 56,
          northEastLng: 38,
          southWestLat: 55,
          southWestLng: 36,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(1);
    });

    it("должен принимать вьюпорт через антимеридиан", async () => {
      mockEventsService.findByViewport.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get("/api/events")
        .query({
          northEastLat: 20,
          northEastLng: 190,
          southWestLat: 10,
          southWestLng: 170,
        });

      expect(response.status).toBe(200);
      expect(mockEventsService.findByViewport).toHaveBeenCalledWith({
        northEastLat: 20,
        northEastLng: 190,
        southWestLat: 10,
        southWestLng: 170,
      });
    });

    it("должен принимать вьюпорт через антимеридиан с southWestLng меньше -180", async () => {
      mockEventsService.findByViewport.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get("/api/events")
        .query({
          northEastLat: 55.56030491940223,
          northEastLng: -178.75650200913995,
          southWestLat: 54.35763945371127,
          southWestLng: -181.0994478456442,
        });

      expect(response.status).toBe(200);
      expect(mockEventsService.findByViewport).toHaveBeenCalledWith({
        northEastLat: 55.56030491940223,
        northEastLng: -178.75650200913995,
        southWestLat: 54.35763945371127,
        southWestLng: -181.0994478456442,
      });
    });

    it("должен вернуть 400 если параметры вьюпорта отсутствуют", async () => {
      const response = await request(app.getHttpServer()).get("/api/events");
      expect(response.status).toBe(400);
    });

    it("должен вернуть 400 если широта вне допустимого диапазона", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/events")
        .query({
          northEastLat: 200,
          northEastLng: 38,
          southWestLat: 55,
          southWestLng: 36,
        });
      expect(response.status).toBe(400);
    });
  });
});
