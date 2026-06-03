# IMPLEMENTATION PLAN

## 1. Структура проекта

```text
root/
├── backend/
│   ├── src/
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   └── pipes/
│   │   ├── config/
│   │   │   └── app.config.ts
│   │   ├── database/
│   │   │   └── database.module.ts
│   │   ├── modules/
│   │   │   ├── events/
│   │   │   │   ├── dto/
│   │   │   │   ├── schemas/
│   │   │   │   ├── events.controller.ts
│   │   │   │   ├── events.service.ts
│   │   │   │   ├── events.repository.ts
│   │   │   │   └── events.module.ts
│   │   │   ├── statistics/
│   │   │   │   ├── dto/
│   │   │   │   ├── statistics.controller.ts
│   │   │   │   ├── statistics.service.ts
│   │   │   │   └── statistics.module.ts
│   │   │   ├── counters/
│   │   │   │   ├── schemas/
│   │   │   │   ├── counters.service.ts
│   │   │   │   └── counters.module.ts
│   │   │   └── rpc/
│   │   │       ├── dto/
│   │   │       ├── rpc.controller.ts
│   │   │       ├── rpc.service.ts
│   │   │       └── rpc.module.ts
│   │   ├── swagger/
│   │   │   └── swagger.setup.ts
│   │   └── main.ts
│   ├── test/
│   │   ├── unit/
│   │   └── integration/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   └── providers.tsx
│   │   ├── pages/
│   │   │   └── MapPage/
│   │   ├── widgets/
│   │   │   ├── Map/
│   │   │   └── StatsDashboard/
│   │   ├── features/
│   │   │   └── EventMarker/
│   │   ├── entities/
│   │   │   └── Event/
│   │   ├── shared/
│   │   │   ├── ui/
│   │   │   ├── lib/
│   │   │   └── types/
│   │   └── api/
│   │       ├── events.ts
│   │       └── statistics.ts
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
├── README.md
├── PROTOCOL.md
└── IMPLEMENTATION_PLAN.md
```

## 2. Дизайн базы данных

### Коллекция `events`

```json
{
  "_id": ObjectId,
  "id": 123,
  "createdAt": ISODate,
  "lat": 55.123,
  "lng": 37.123,
  "oid": 100,
  "sp": 60,
  "location": {
    "type": "Point",
    "coordinates": [37.123, 55.123]
  }
}
```

Индексы:

- `location` — 2dsphere (геопространственный)
- `id` — уникальный числовой
- `createdAt` — для сортировки

### Коллекция `counters`

```json
{
  "_id": "events",
  "seq": 123
}
```

## 3. API Design

### REST API (для фронтенда)

| Метод | Путь         | Описание                    |
|-------|--------------|-----------------------------|
| GET   | /events      | События в области карты     |
| GET   | /statistics  | Статистика                  |

**GET /events** query params:

- `northEastLat`, `northEastLng`, `southWestLat`, `southWestLng`
- Возвращает max 100 новейших событий в вьюпорте

**GET /statistics**:

- Всего событий, последнее событие, средняя скорость, максимальная скорость

### JSON-RPC 2.0

| Метод | Путь  | Описание                              |
|-------|-------|---------------------------------------|
| POST  | /rpc  | JSON-RPC endpoint для внешних систем  |

Поддерживаемые методы:

- `event.create` — создание события

## 4. Стратегия тестирования

### Unit тесты

- `CountersService` — атомарный инкремент
- `EventsService` — создание, фильтрация по вьюпорту
- `StatisticsService` — агрегация
- `RpcService` — маршрутизация методов, валидация

### Integration тесты

- POST /rpc — создание события, обработка ошибок
- GET /events — фильтрация по вьюпорту
- GET /statistics — корректность агрегации
- Валидация входных данных

## 5. Docker архитектура

```text
nginx (80) → frontend (3000)
nginx (/api) → backend (3001)
backend → mongodb (27017)
```

Сервисы:

- `mongodb` — MongoDB 7
- `backend` — NestJS, multi-stage build
- `frontend` — Vite build + serve static
- `nginx` — reverse proxy

## 6. Архитектура фронтенда

### Стек

- React 18 + Vite
- TypeScript strict
- TanStack Query — data fetching
- Mapbox GL JS — карта
- shadcn/ui / Radix UI — компоненты
- Tailwind CSS — стили

### Слои (Feature-Sliced Design)

- `app/` — провайдеры, роутер
- `pages/` — страницы
- `widgets/` — сложные UI блоки (Map, StatsDashboard)
- `features/` — бизнес-фичи (кластеризация маркеров)
- `entities/` — бизнес-сущности (Event)
- `shared/` — переиспользуемые утилиты, UI
- `api/` — API клиент

### Ключевые компоненты

- `MapWidget` — карта Mapbox с маркерами и кластерами
- `StatsDashboard` — панель статистики
- `EventPopup` — попап с информацией о событии
- Хуки: `useEvents`, `useStatistics`, `useMapViewport`
