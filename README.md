# Карта событий

Монорепозиторий для системы визуализации событий на интерактивной карте.

## Возможности

- Интерактивная карта (Mapbox GL JS) с кластеризацией маркеров
- Автоматическая загрузка событий в пределах видимой области карты
- Попап с деталями события при клике на маркер или кластер
- Панель статистики: количество событий, средняя и максимальная скорость, последнее событие
- Диалог с полной информацией о последнем событии и кнопкой «Найти на карте»
- REST API для фронтенда + JSON-RPC 2.0 для внешних систем

## Архитектура

- **Backend** — NestJS, MongoDB (Mongoose), REST API + JSON-RPC 2.0
- **Frontend** — React 18, Vite, Mapbox GL JS, TanStack Query, shadcn/ui, Tailwind CSS v4
- **Infrastructure** — Docker, Docker Compose, Nginx (reverse proxy)

## Быстрый старт

### Требования

- Docker >= 24.0
- Docker Compose >= 2.20
- Токен Mapbox ([mapbox.com](https://mapbox.com))

### Запуск

1. Скопируйте файл переменных окружения:

   ```bash
   cp .env.example .env
   ```

1. Укажите ваш Mapbox-токен в файле `.env`:

   ```env
   VITE_MAPBOX_ACCESS_TOKEN=pk.your_token_here
   ```

1. Запустите проект:

   ```bash
   docker compose up -d
   ```

1. Откройте браузер: [http://localhost](http://localhost)

### Swagger документация

После запуска доступна по адресу: [http://localhost/api/docs](http://localhost/api/docs)

## API

### REST

| Метод | Путь              | Описание                          |
|-------|-------------------|-----------------------------------|
| GET   | /api/events       | События в пределах вьюпорта       |
| GET   | /api/statistics   | Агрегированная статистика         |
| POST  | /api/rpc          | JSON-RPC 2.0 endpoint             |

### Параметры GET /api/events

| Параметр     | Тип    | Описание                |
|--------------|--------|-------------------------|
| northEastLat | number | Широта северо-востока   |
| northEastLng | number | Долгота северо-востока  |
| southWestLat | number | Широта юго-запада       |
| southWestLng | number | Долгота юго-запада      |

Возвращает не более 100 новейших событий.

### JSON-RPC 2.0

Подробнее — в файле [PROTOCOL.md](./PROTOCOL.md).

## Разработка

### Backend

```bash
cd backend
yarn install
cp .env.example .env
yarn start:dev
```

### Frontend

```bash
cd frontend
yarn install
cp .env.example .env
# Укажите VITE_MAPBOX_ACCESS_TOKEN в .env
yarn dev
```

### Тесты

```bash
cd backend
yarn install
yarn test           # все тесты
yarn test:unit      # только юнит-тесты
yarn test:int       # только интеграционные тесты
```

## Структура проекта

```text
root/
├── backend/                    # NestJS приложение
│   ├── src/
│   │   ├── config/             # Конфигурация (порт, MongoDB URI)
│   │   ├── modules/
│   │   │   ├── counters/       # Атомарный счётчик ID (MongoDB findOneAndUpdate)
│   │   │   ├── events/         # CRUD событий, геопространственная фильтрация
│   │   │   ├── rpc/            # JSON-RPC 2.0: контроллер, реестр, обработчики
│   │   │   └── statistics/     # Агрегация через MongoDB pipeline
│   │   └── swagger/            # Настройка Swagger UI
│   └── test/
│       ├── unit/               # Юнит-тесты сервисов
│       └── integration/        # Интеграционные тесты API (MongoDB in-memory)
├── frontend/                   # React + Vite приложение (Feature-Sliced Design)
│   └── src/
│       ├── api/                # HTTP-клиент и функции запросов
│       ├── app/                # Провайдеры (QueryClient, Toaster) и корень
│       ├── entities/           # Бизнес-сущности и хуки (useEvents, useStatistics)
│       ├── features/           # EventPopup — попап с пагинацией событий
│       ├── pages/              # MapPage — главная страница
│       ├── shared/             # Типы, утилиты (formatDate, formatSpeed), UI
│       └── widgets/            # MapWidget (Mapbox + кластеры), StatsDashboard
├── infrastructure/
│   └── nginx/                  # Reverse proxy: /api → backend, / → frontend
├── docker-compose.yml
├── PROTOCOL.md                 # Спецификация JSON-RPC API
└── README.md
```

## Ключевые архитектурные решения

- **Автоинкрементный ID** — MongoDB не имеет встроенного автоинкремента; реализован через коллекцию `counters` с атомарным `$inc`, что гарантирует уникальность ID без гонок.
- **Геопространственный запрос** — для фильтрации событий по вьюпорту используется индекс `2dsphere` и оператор `$geoWithin/$box`.
- **JSON-RPC реестр** — обработчики методов обнаруживаются автоматически через `DiscoveryService` NestJS и декоратор `@RpcMethod`; добавление нового метода не требует изменений в контроллере.
- **Кластеризация на стороне Mapbox** — события группируются на клиенте через `cluster: true` в GeoJSON Source; при клике на неразделяемый кластер показывается попап вместо зума.
- **Feature-Sliced Design** — фронтенд разделён на слои (app → pages → widgets → features → entities → shared), что ограничивает направление зависимостей.
