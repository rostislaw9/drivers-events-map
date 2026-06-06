import { ViewportQueryDto } from "../../src/modules/events/dto";
import { EventsRepository } from "../../src/modules/events/events.repository";

describe("EventsRepository", () => {
  const exec = jest.fn().mockResolvedValue([]);
  const limit = jest.fn().mockReturnValue({ exec });
  const sort = jest.fn().mockReturnValue({ limit });
  const find = jest.fn().mockReturnValue({ sort });

  let repository: EventsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new EventsRepository({ find } as never);
  });

  async function expectFindFilter(viewport: ViewportQueryDto) {
    await repository.findByViewport(viewport);
    return find.mock.calls[0][0];
  }

  function expectPolygonGeometry(
    westLng: number,
    eastLng: number,
    southLat: number,
    northLat: number,
  ) {
    return {
      type: "Polygon",
      coordinates: [
        [
          [westLng, southLat],
          [eastLng, southLat],
          [eastLng, northLat],
          [westLng, northLat],
          [westLng, southLat],
        ],
      ],
    };
  }

  it("строит Polygon для обычного вьюпорта", async () => {
    const filter = await expectFindFilter({
      northEastLat: 20,
      northEastLng: 50,
      southWestLat: 10,
      southWestLng: 30,
    });

    expect(filter).toEqual({
      location: {
        $geoWithin: {
          $geometry: expectPolygonGeometry(30, 50, 10, 20),
        },
      },
    });
  });

  it("строит MultiPolygon для вьюпорта, пересекающего антимеридиан вправо (northEastLng > 180)", async () => {
    const filter = await expectFindFilter({
      northEastLat: 20,
      northEastLng: 190,
      southWestLat: 10,
      southWestLng: 170,
    });

    expect(filter).toEqual({
      location: {
        $geoWithin: {
          $geometry: {
            type: "MultiPolygon",
            coordinates: [
              [expectPolygonGeometry(170, 180, 10, 20).coordinates[0]],
              [expectPolygonGeometry(-180, -170, 10, 20).coordinates[0]],
            ],
          },
        },
      },
    });
  });

  it("строит MultiPolygon для вьюпорта, пересекающего антимеридиан влево (southWestLng < -180)", async () => {
    const filter = await expectFindFilter({
      northEastLat: 20,
      northEastLng: -170,
      southWestLat: 10,
      southWestLng: -190,
    });

    expect(filter).toEqual({
      location: {
        $geoWithin: {
          $geometry: {
            type: "MultiPolygon",
            coordinates: [
              [expectPolygonGeometry(170, 180, 10, 20).coordinates[0]],
              [expectPolygonGeometry(-180, -170, 10, 20).coordinates[0]],
            ],
          },
        },
      },
    });
  });

  it("строит MultiPolygon для антимеридиана вправо где западный кусок сам > 180°", async () => {
    // northEastLng=203.9, southWestLng=-6.1 -> левый кусок [-6.1..180] = 186.1° -> нужен split
    const filter = await expectFindFilter({
      northEastLat: 82,
      northEastLng: 203,
      southWestLat: -6,
      southWestLng: -6,
    });

    const geometry = filter.location.$geoWithin.$geometry;
    expect(geometry.type).toBe("MultiPolygon");
    // Все куски должны быть < 180° по долготе
    for (const [ring] of geometry.coordinates) {
      const lngs = ring.map(([lng]: [number, number]) => lng);
      const span = Math.max(...lngs) - Math.min(...lngs);
      expect(span).toBeLessThan(180);
    }
    // Правый кусок после антимеридиана: [MIN_LONGITUDE .. 203-360] = [-180 .. -157]
    const allWest = geometry.coordinates.map(
      ([[first]]: [[[number, number]]]) => first[0],
    );
    expect(allWest.some((w: number) => w < 0 && w >= -180)).toBe(true);
  });

  it("строит MultiPolygon для широкого вьюпорта > 180° (без пересечения антимеридиана)", async () => {
    const filter = await expectFindFilter({
      northEastLat: 84,
      northEastLng: 152,
      southWestLat: 1,
      southWestLng: -67,
    });

    const span = 152 - -67;
    const midLng = -67 + span / 2;

    expect(filter).toEqual({
      location: {
        $geoWithin: {
          $geometry: {
            type: "MultiPolygon",
            coordinates: [
              [expectPolygonGeometry(-67, midLng, 1, 84).coordinates[0]],
              [expectPolygonGeometry(midLng, 152, 1, 84).coordinates[0]],
            ],
          },
        },
      },
    });
  });

  it("возвращает пустой фильтр {} для вьюпорта, покрывающего весь мир (span >= 360°)", async () => {
    const filter = await expectFindFilter({
      northEastLat: 20,
      northEastLng: 180,
      southWestLat: 10,
      southWestLng: -180,
    });

    expect(filter).toEqual({});
  });
});
