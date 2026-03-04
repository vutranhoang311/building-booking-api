Building Booking API
====================

RESTful API for **hierarchical building locations** and **room booking**, built with **NestJS**, **TypeORM**, and **PostgreSQL**. The service provides:

- Hierarchical building → floors → rooms (locations)
- Configurable room booking rules (capacity, department, open days/hours)
- Validation and conflict detection for bookings
- OpenAPI/Swagger documentation

> Tech stack: NestJS 11, TypeScript 5, TypeORM 0.3, PostgreSQL, `nestjs-pino` logging, class-validator/transformer.

---

## 1. Architecture Overview

- **Framework**: `@nestjs/core` modular architecture
- **Modules**:
  - `AppModule`: bootstraps config, logging, TypeORM connection, and feature modules.
  - `LocationModule`: manages hierarchical locations (`Building`, `Location`) and booking configuration (department, capacity, open time, open days).
  - `BookingModule`: booking use cases and HTTP API.
- **Layers (per feature)**:
  - **API / HTTP**: NestJS controllers and DTOs (`api/http/controller`, `api/http/dto`).
  - **Domain / Service**: core business logic and invariants (`domain/service`).
  - **Persistence**: TypeORM entities and repositories (`entities`, `database/repository`).

Global infrastructure:

- **Config**: `@nestjs/config` with `.env` (`ConfigModule.forRoot({ isGlobal: true })`).
- **Database**: `TypeOrmModule.forRootAsync` using `getDatabaseConfig()` to connect to PostgreSQL.
- **Logging**: `nestjs-pino` (`LoggerModule.forRoot(pinoLoggerOptions)`).
- **Validation**: global `ValidationPipe` with:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`
- **Error handling**: `HttpExceptionFilter` as a global filter.
- **API prefix**: all routes are mounted under `/api`.
- **Swagger**: configured via `setupSwagger(app)` and available at `/api/docs`.

On bootstrap, the app seeds a default **Building A** if it does not exist.

---

## 2. Domain Model (High Level)

- **Building**
  - Represents a building (e.g. "Building A").
  - One-to-many relationship with `Location`.
- **Location**
  - Represents a room or location within a building (may include floor/room semantics).
  - Key booking configuration:
    - `department`: department that owns the room.
    - `capacity`: max number of attendees.
    - `openTime`: textual time window, e.g. `"08:30-18:00"`.
    - `openDays`: enum `LocationOpenDays` (e.g. `MON_FRI`, `MON_SAT`, `MON_SUN`, `ALWAYS`).
- **Booking**
  - A reservation of a `Location` within a single calendar day.
  - Fields: `title`, `description`, `department`, `attendees`, `startAt`, `endAt`, timestamps.

---

## 3. Booking Rules & Invariants

The core business logic lives in `BookingService`:

- **Location must exist**
  - A booking is always associated with an existing `Location` by `locationId`.
- **Location must be properly configured**
  - `department` is required.
  - `capacity` must be a positive integer.
  - `openTime` must be configured.
  - `openDays` must be configured.
- **Time constraints**
  - `startAt` must be **in the future** relative to current server time.
  - `endAt` must be **strictly after** `startAt`.
  - `startAt` and `endAt` must fall on the **same calendar day**.
  - The booking window must be **fully contained** within `openTime` for the given `Location` and day.
- **Day-of-week constraints**
  - `openDays` is mapped to an allowed set of days (Mon–Sun) using `dayjs().day()`.
  - Booking day must be included in the allowed days set.
- **Department consistency**
  - The booking `department` must match the location `department` (case-insensitive, trimmed).
- **Capacity constraints**
  - `attendees` must be `> 0` and `<= location.capacity`.
- **No overlapping bookings**
  - For a given `Location`, the new booking \([startAt, endAt]\) must not overlap any existing booking in the database:
    - `existing.startAt < newEndAt` **and**
    - `existing.endAt > newStartAt`

Violations of these rules yield `BadRequestException` or `NotFoundException` with descriptive messages.

---

## 4. API Surface (High Level)

All routes are prefixed with `/api`. Swagger UI is available at:

- `GET /api/docs`

### 4.1 Booking

**Base path**: `/api/booking`

- **POST `/api/booking`** — Create a new booking
  - **Body**: `CreateBookingDto`
    - `locationId` (UUID/int – depends on entity definition)
    - `title` (string)
    - `description` (string, optional)
    - `department` (string)
    - `attendees` (number)
    - `startAt` (ISO datetime string)
    - `endAt` (ISO datetime string)
  - **Response**: `BookingResponseDto`
    - `id`
    - `locationId`
    - `title`
    - `description`
    - `department`
    - `attendees`
    - `startAt`
    - `endAt`
    - `createdAt`
    - `updatedAt`
  - **Status codes**:
    - `201 Created` on success.
    - `400 Bad Request` for validation and business rule violations.
    - `404 Not Found` if the `Location` does not exist.

Location APIs (CRUD, hierarchy management) live under the `location` tag and `LocationModule`. Refer to Swagger UI for exact endpoints and DTOs.

---

## 5. Environment & Configuration

Configuration is loaded from `.env`. See `.env.example` as the source of truth.

### 5.1 Core environment variables

- **Application**
  - `NODE_ENV` — `development | production | test`
  - `PORT` — HTTP port (default: `3000`)
- **Database (PostgreSQL)**
  - `DB_HOST` — database host (default: `localhost`)
  - `DB_PORT` — database port (default: `5432`)
  - `DB_USERNAME` — database user (default: `postgres`)
  - `DB_PASSWORD` — database password (default: `postgres`)
  - `DB_NAME` — database name (default: `building_booking`)
- **TypeORM**
  - `TYPEORM_SYNCHRONIZE` — auto sync schema with entities.
    - **Should be `false` in production**; use migrations instead.
  - `TYPEORM_LOGGING` — enable SQL logging in dev.

If a variable is omitted, `getDatabaseConfig()` supplies a sane default for local development.

---

## 6. Local Development

### 6.1 Prerequisites

- Node.js **>= 18**
- PostgreSQL instance reachable from the app
- Yarn or npm

### 6.2 Setup

1. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Create `.env`**

   ```bash
   cp .env.example .env
   # then adjust values as needed
   ```

3. **Prepare database**

   - Ensure the Postgres database from `.env` (`DB_NAME`) exists.
   - Grant privileges to `DB_USERNAME`.

4. **Run the app**

   ```bash
   npm run start:dev
   # or
   yarn start:dev
   ```

5. **Access API and docs**

   - API base URL: `http://localhost:<PORT>/api` (default `http://localhost:3000/api`)
   - Swagger UI: `http://localhost:<PORT>/api/docs`

---

## 7. NPM Scripts

- `npm run start` — start NestJS in production mode.
- `npm run start:dev` — start in watch mode for local development.
- `npm run start:prod` — run compiled app (`node dist/main.js`).
- `npm run build` — compile TypeScript to JavaScript into `dist`.
- `npm run lint` — run ESLint with `--max-warnings=0`.
- `npm run format` — run Prettier on `src/**/*.{js,ts,json,md}`.

---

## 8. Error Handling & Validation

- **Validation**
  - Controlled centrally via a global `ValidationPipe`:
    - Strips unknown properties (whitelisting).
    - Rejects unknown properties with HTTP 400 (forbid non-whitelisted).
    - Automatically converts payloads to DTO instances and primitive types (transform).
- **Errors**
  - Business rule violations raise `HttpException` subclasses (`BadRequestException`, `NotFoundException`).
  - `HttpExceptionFilter` standardizes error responses (shape depends on filter implementation).

---

## 9. Logging

- Uses `nestjs-pino` with `pino`/`pino-http`.
- Application logger is bound globally and used by Nest.
- Logging configuration lives under `config/logger.config.ts` (see file for details).

In production, you should route logs to your central logging/observability stack (e.g. Loki, ELK, Datadog) and tune log level accordingly.

---

## 10. Conventions & Guidelines

- **Modular by feature**: each feature (e.g. `booking`, `location`) owns its controllers, DTOs, domain services, and repositories.
- **DTOs at the boundary**: all HTTP payloads must go through typed DTOs with `class-validator`.
- **Pure domain logic**: non-trivial business rules (time windows, capacity, overlap checks) live in services and are unit-testable.
- **Explicit errors**: always surface domain invariants via meaningful HTTP errors rather than silent failures.
- **Swagger-first**: keep controllers annotated with `@ApiTags`, `@ApiOperation`, and response decorators so the OpenAPI document remains accurate.

For new features, follow the existing module structure (`api/http`, `domain/service`, `database/repository`, `entities`) and re-use shared patterns (DTO validation, exception handling, logging, and Swagger annotations).

