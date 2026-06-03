import { Test, TestingModule } from "@nestjs/testing";

import { RPC_ERROR_CODES } from "../../src/modules/rpc/rpc-error-codes";
import { RpcValidationError } from "../../src/modules/rpc/rpc-validation-error";
import { RpcRegistry } from "../../src/modules/rpc/rpc.registry";
import { RpcService } from "../../src/modules/rpc/rpc.service";

describe("RpcService", () => {
  let service: RpcService;
  const mockHandler = { execute: jest.fn() };
  const mockRegistry = { resolve: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RpcService, { provide: RpcRegistry, useValue: mockRegistry }],
    }).compile();

    service = module.get<RpcService>(RpcService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockRegistry.resolve.mockReset();
    mockHandler.execute.mockReset();
  });

  describe("handle", () => {
    it("должен вернуть ошибку INVALID_REQUEST для не-объекта", async () => {
      const result = await service.handle("not an object");
      expect(result.error?.code).toBe(RPC_ERROR_CODES.INVALID_REQUEST);
    });

    it("должен вернуть ошибку INVALID_REQUEST для null", async () => {
      const result = await service.handle(null);
      expect(result.error?.code).toBe(RPC_ERROR_CODES.INVALID_REQUEST);
    });

    it('должен вернуть ошибку INVALID_REQUEST если jsonrpc не "2.0"', async () => {
      const result = await service.handle({
        jsonrpc: "1.0",
        method: "event.create",
        params: {},
        id: 1,
      });
      expect(result.error?.code).toBe(RPC_ERROR_CODES.INVALID_REQUEST);
    });

    it("должен вернуть ошибку INVALID_REQUEST если method отсутствует", async () => {
      const result = await service.handle({
        jsonrpc: "2.0",
        params: {},
        id: 1,
      });
      expect(result.error?.code).toBe(RPC_ERROR_CODES.INVALID_REQUEST);
    });

    it("должен вернуть ошибку METHOD_NOT_FOUND для неизвестного метода", async () => {
      mockRegistry.resolve.mockReturnValue(undefined);
      const result = await service.handle({
        jsonrpc: "2.0",
        method: "unknown.method",
        params: {},
        id: 1,
      });
      expect(result.error?.code).toBe(RPC_ERROR_CODES.METHOD_NOT_FOUND);
      expect(result.id).toBe(1);
    });

    it("должен вернуть ошибку INVALID_PARAMS если handler бросает RpcValidationError", async () => {
      mockHandler.execute.mockRejectedValue(
        new RpcValidationError("невалидные поля"),
      );
      mockRegistry.resolve.mockReturnValue(mockHandler);

      const result = await service.handle({
        jsonrpc: "2.0",
        method: "event.create",
        params: { lat: 999, lng: 37, oid: 100, sp: 60 },
        id: 1,
      });
      expect(result.error?.code).toBe(RPC_ERROR_CODES.INVALID_PARAMS);
    });

    it("должен вернуть ошибку INTERNAL_ERROR если handler бросает неожиданное исключение", async () => {
      mockHandler.execute.mockRejectedValue(new Error("db failure"));
      mockRegistry.resolve.mockReturnValue(mockHandler);

      const result = await service.handle({
        jsonrpc: "2.0",
        method: "event.create",
        params: { lat: 55.0, lng: 37.0, oid: 1, sp: 60 },
        id: 1,
      });
      expect(result.error?.code).toBe(RPC_ERROR_CODES.INTERNAL_ERROR);
    });

    it("должен успешно вернуть результат от handler", async () => {
      mockHandler.execute.mockResolvedValue({ id: 42 });
      mockRegistry.resolve.mockReturnValue(mockHandler);

      const result = await service.handle({
        jsonrpc: "2.0",
        method: "event.create",
        params: { lat: 55.123, lng: 37.123, oid: 100, sp: 60 },
        id: 1,
      });

      expect(result.result).toEqual({ id: 42 });
      expect(result.error).toBeUndefined();
      expect(result.id).toBe(1);
    });

    it("должен сохранять строковый id из запроса в ответе с ошибкой", async () => {
      mockRegistry.resolve.mockReturnValue(undefined);
      const result = await service.handle({
        jsonrpc: "2.0",
        method: "unknown",
        params: {},
        id: "req-123",
      });
      expect(result.id).toBe("req-123");
    });
  });
});
