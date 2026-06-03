import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";

import { EventsService } from "../../src/modules/events/events.service";
import { EventCreateHandler } from "../../src/modules/rpc/handlers/event-create.handler";
import { RPC_ERROR_CODES } from "../../src/modules/rpc/rpc-error-codes";
import { RpcController } from "../../src/modules/rpc/rpc.controller";
import { RpcRegistry } from "../../src/modules/rpc/rpc.registry";
import { RpcService } from "../../src/modules/rpc/rpc.service";

describe("RpcController (integration)", () => {
  let app: INestApplication;
  const mockEventsService = {
    create: jest.fn(),
    findByViewport: jest.fn(),
  };

  beforeEach(async () => {
    const mockEventsServiceInstance =
      mockEventsService as unknown as EventsService;
    const handler = new EventCreateHandler(mockEventsServiceInstance);

    const handlerMap = new Map([["event.create", handler]]);
    const mockRegistry: Pick<RpcRegistry, "resolve"> = {
      resolve: (method: string) => handlerMap.get(method),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RpcController],
      providers: [RpcService, { provide: RpcRegistry, useValue: mockRegistry }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe("POST /api/rpc", () => {
    it("должен создать событие и вернуть его ID", async () => {
      mockEventsService.create.mockResolvedValue({
        id: 1,
        createdAt: new Date(),
        lat: 55.123,
        lng: 37.123,
        oid: 100,
        sp: 60,
      });

      const response = await request(app.getHttpServer())
        .post("/api/rpc")
        .send({
          jsonrpc: "2.0",
          method: "event.create",
          params: { lat: 55.123, lng: 37.123, oid: 100, sp: 60 },
          id: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.jsonrpc).toBe("2.0");
      expect(response.body.result.id).toBe(1);
      expect(response.body.id).toBe(1);
    });

    it("должен вернуть ошибку INVALID_REQUEST при неверной версии jsonrpc", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/rpc")
        .send({
          jsonrpc: "1.0",
          method: "event.create",
          params: {},
          id: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.error.code).toBe(RPC_ERROR_CODES.INVALID_REQUEST);
    });

    it("должен вернуть ошибку INVALID_PARAMS при невалидной широте", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/rpc")
        .send({
          jsonrpc: "2.0",
          method: "event.create",
          params: { lat: 200, lng: 37.123, oid: 100, sp: 60 },
          id: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.error.code).toBe(RPC_ERROR_CODES.INVALID_PARAMS);
    });

    it("должен вернуть ошибку METHOD_NOT_FOUND для несуществующего метода", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/rpc")
        .send({
          jsonrpc: "2.0",
          method: "nonexistent.method",
          params: {},
          id: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.error.code).toBe(RPC_ERROR_CODES.METHOD_NOT_FOUND);
      expect(response.body.id).toBe(2);
    });
  });
});
