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

  it("строит один гео-фильтр для обычного диапазона долготы", async () => {
    const filter = await expectFindFilter({
      northEastLat: 20,
      northEastLng: 50,
      southWestLat: 10,
      southWestLng: 30,
    });

    expect(filter).toEqual({
      location: {
        $geoWithin: {
          $box: [
            [30, 10],
            [50, 20],
          ],
        },
      },
    });
  });

  it("разбивает диапазон через антимеридиан на два гео-фильтра", async () => {
    const filter = await expectFindFilter({
      northEastLat: 20,
      northEastLng: 190,
      southWestLat: 10,
      southWestLng: 170,
    });

    expect(filter).toEqual({
      $or: [
        {
          location: {
            $geoWithin: {
              $box: [
                [170, 10],
                [180, 20],
              ],
            },
          },
        },
        {
          location: {
            $geoWithin: {
              $box: [
                [-180, 10],
                [-170, 20],
              ],
            },
          },
        },
      ],
    });
  });

  it("разбивает диапазон через -180 на два гео-фильтра", async () => {
    const filter = await expectFindFilter({
      northEastLat: 55.56030491940223,
      northEastLng: -178.75650200913995,
      southWestLat: 54.35763945371127,
      southWestLng: -181.0994478456442,
    });

    expect(filter).toEqual({
      $or: [
        {
          location: {
            $geoWithin: {
              $box: [
                [178.9005521543558, 54.35763945371127],
                [180, 55.56030491940223],
              ],
            },
          },
        },
        {
          location: {
            $geoWithin: {
              $box: [
                [-180, 54.35763945371127],
                [-178.75650200913995, 55.56030491940223],
              ],
            },
          },
        },
      ],
    });
  });

  it("считает диапазон 360 градусов покрытием всего мира", async () => {
    const filter = await expectFindFilter({
      northEastLat: 20,
      northEastLng: 180,
      southWestLat: 10,
      southWestLng: -180,
    });

    expect(filter).toEqual({
      location: {
        $geoWithin: {
          $box: [
            [-180, 10],
            [180, 20],
          ],
        },
      },
    });
  });

  it("считает диапазон больше 360 градусов покрытием всего мира", async () => {
    const filter = await expectFindFilter({
      northEastLat: 20,
      northEastLng: 300,
      southWestLat: 10,
      southWestLng: -100,
    });

    expect(filter).toEqual({
      location: {
        $geoWithin: {
          $box: [
            [-180, 10],
            [180, 20],
          ],
        },
      },
    });
  });
});
