System & Database Design
========================

> Project: **Building Booking API**  
> Tech stack: NestJS 11, TypeScript 5, TypeORM 0.3, PostgreSQL

---

## 1. System goals

- **Manage locations in a hierarchical structure**: building → floor/room (`Location`).
- **Room booking** by day, within allowed time windows of each room.
- **Enforce business rules**: capacity, department, open days/hours, no overlapping bookings.
- **Expose a RESTful API with OpenAPI/Swagger documentation**.

---

## 2. High-level architecture (System Design)

### 2.1 Logical architecture

- **Client** (future / outside this repo)
  - Communicates with the API over HTTP (`/api`).
  - Uses Swagger (`/api/docs`) to explore the API.

- **API Layer (NestJS Controllers)**
  - Defines endpoints for:
    - `BookingModule`: create bookings.
    - `LocationModule`: CRUD for buildings, locations, and per-room booking configuration.
  - Maps request/response via DTOs (validation using `class-validator`).

- **Domain Layer (Services)**
  - Contains all **core business logic**:
    - Validate booking data against location configuration.
    - Check for time conflicts.
    - Validate capacity, open time, open days, department.
  - Independent from HTTP, only depends on repository interfaces.

- **Persistence Layer (TypeORM)**
  - Maps entities ↔ tables in PostgreSQL.
  - Repositories are responsible for:
    - Querying buildings/locations/bookings.
    - Saving/updating data.
    - Running queries to detect time conflicts by `locationId`, `startAt`, `endAt`.

- **Infrastructure Layer**
  - **ConfigModule**: loads `.env`.
  - **TypeORMModule**: connects to PostgreSQL.
  - **LoggerModule (nestjs-pino)**: logging.
  - **Global Pipes/Filters**: `ValidationPipe`, `HttpExceptionFilter`.

### 2.2 Deployment architecture (high-level)

- **Application Server**
  - Runs NestJS (Node.js >= 18).
  - Can run inside a container (Docker) or on a VM.

- **Database Server**
  - PostgreSQL (version depends on environment).
  - Can be a dedicated DB server or managed service (RDS, Cloud SQL, etc.).

- **Environments**
  - Development: `TYPEORM_SYNCHRONIZE=true` (can be used for faster iteration).
  - Production: `TYPEORM_SYNCHRONIZE=false`, use migrations instead.

---

## 3. Main flows (Use Cases & Flows)

### 3.1 Create Location / Building

1. Admin sends an HTTP request to the `LocationModule` API (create building/location).
2. Controller validates the DTO.
3. Service applies basic rules (e.g. duplicate name checks if required).
4. Repository persists `Building` / `Location` entities to the database.

### 3.2 Create Booking

1. Client calls `POST /api/booking` with `CreateBookingDto` payload.
2. Controller:
   - Validates the DTO.
   - Converts DTO to domain input and calls `BookingService`.
3. `BookingService`:
   - Loads `Location` by `locationId`.
   - Verifies:
     - Location exists and is fully configured (`department`, `capacity`, `openTime`, `openDays`).
     - `startAt` > now, `endAt` > `startAt`, and both on the same day.
     - `startAt` / `endAt` fall within the location `openTime` for the corresponding weekday.
     - Booking `department` matches location `department` (normalized, trimmed, case-insensitive).
     - `attendees` > 0 and `<= capacity`.
     - No existing booking **overlaps** the `[startAt, endAt]` interval.
   - If all rules pass, the service creates a `Booking` entity and saves it via the repository.
4. Controller returns `BookingResponseDto` with the newly created booking data.

---

## 4. Database Design

### 4.1 Design principles

- Prioritize **data integrity**:
  - Foreign keys between `Building` → `Location` → `Booking`.
  - NOT NULL and CHECK constraints on important fields.
- Optimize queries for main flows:
  - Search bookings by `locationId` + time range.
  - List locations by building.
- Minimize redundancy, target **3NF** where appropriate.

### 4.2 Table `building`

- **Purpose**: Represents a building.
- **Suggested columns**:
  - `id` (PK, UUID or serial).
  - `name` (unique, text).
  - `code` (optional, text) — building code.
  - `created_at` (timestamp with time zone).
  - `updated_at` (timestamp with time zone).

### 4.3 Table `location`

- **Purpose**: Represents a room / location belonging to a building.
- **Suggested columns**:
  - `id` (PK).
  - `building_id` (FK → `building.id`, ON DELETE CASCADE).
  - `name` (text) — room name, e.g. "Meeting Room 101".
  - `department` (text, NOT NULL).
  - `capacity` (integer, NOT NULL, CHECK `capacity > 0`).
  - `open_time` (text) — e.g. `"08:30-18:00"` (can later be split into `open_time_start`, `open_time_end` with `time` type).
  - `open_days` (enum or text) — e.g. `MON_FRI`, `MON_SAT`, `MON_SUN`, `ALWAYS`.
  - `created_at` (timestamp with time zone).
  - `updated_at` (timestamp with time zone).

### 4.4 Table `booking`

- **Purpose**: Stores room bookings.
- **Suggested columns**:
  - `id` (PK).
  - `location_id` (FK → `location.id`, ON DELETE CASCADE).
  - `title` (text, NOT NULL).
  - `description` (text, NULL).
  - `department` (text, NOT NULL).
  - `attendees` (integer, NOT NULL, CHECK `attendees > 0`).
  - `start_at` (timestamp with time zone, NOT NULL).
  - `end_at` (timestamp with time zone, NOT NULL, CHECK `end_at > start_at`).
  - `created_at` (timestamp with time zone).
  - `updated_at` (timestamp with time zone).

- **Suggested indexes**:
  - Index to query bookings by location and time:
    - `idx_booking_location_time (location_id, start_at, end_at)`
  - Goal:
    - Speed up conflict-check queries:
      - `existing.startAt < newEndAt` **AND** `existing.endAt > newStartAt`.

### 4.5 Overlap constraints & logic

- Overlap is checked in **BookingService** while leveraging DB indexes:
  - Query conditions:
    - `WHERE location_id = :locationId`
    - `AND start_at < :newEndAt`
    - `AND end_at   > :newStartAt`
  - If any row is returned → conflict.

> Note: You can add a **CHECK constraint** or an **EXCLUDE constraint** (PostgreSQL) later if you want to guarantee **non-overlapping** bookings at the database layer itself.

---

## 5. Extensibility & scalability

### 5.1 Functional extensions

- Add **user / authentication**:
  - Associate bookings with the user who created them.
  - Apply authorization based on department / role.
- Add **migrations**:
  - Standardize schema management via TypeORM migrations.
- Add **audit logging**:
  - Track history of booking changes (who changed what and when).

### 5.2 Technical scaling

- **Read scaling**:
  - Use PostgreSQL read replicas.
  - Cache location configuration (capacity, open time, open days) in Redis.
- **Write scaling**:
  - Use a queue/message broker to handle complex rules or send notifications asynchronously.
  - Use transactions where atomicity across multiple DB operations is required.

---

## 6. Implementation notes

- This document is a **baseline template** for System Design & Database Design.
- Whenever schema or logic changes, you should:
  - Update the TypeORM entities.
  - Update migrations.
  - Update this document to keep everything in sync.

