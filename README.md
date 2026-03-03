## Building Booking API

- **Mô tả**: RESTful API cho quản lý cấu trúc building/location và booking phòng, được xây dựng bằng NestJS + TypeORM + Postgres.

## Logging

- **Thư viện**: Ứng dụng sử dụng `nestjs-pino` để tích hợp logger Pino với NestJS.
- **Đầu ra**:
  - Mặc định log ra **stdout** theo định dạng JSON, phù hợp cho Docker/kubernetes và các log collector.
  - Ở môi trường development (`NODE_ENV !== "production"`), log được format bằng `pino-pretty` (có màu, dễ đọc).
- **Cấu hình chính**:
  - `LoggerModule.forRoot` được khai báo trong `AppModule` với cấu hình `pinoHttp`.
  - Trong `main.ts`, ứng dụng sử dụng logger Pino thông qua `app.useLogger(app.get(Logger))` (Logger từ `nestjs-pino`).
- **Tuỳ chỉnh**:
  - Điều chỉnh mức log thông qua `NODE_ENV` hoặc mở rộng thêm biến môi trường như `LOG_LEVEL` nếu cần.
  - Để thêm log theo ngữ cảnh business trong service/controller, có thể tiếp tục dùng `Logger` của NestJS, logger này sẽ route về Pino nhờ cấu hình global logger.

