import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export function getDatabaseConfig(): TypeOrmModuleOptions {
  const isProd = process.env.NODE_ENV === "production";

  return {
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "building_booking",
    synchronize: process.env.TYPEORM_SYNCHRONIZE
      ? process.env.TYPEORM_SYNCHRONIZE === "true"
      : !isProd,
    logging: process.env.TYPEORM_LOGGING
      ? process.env.TYPEORM_LOGGING === "true"
      : !isProd,
    autoLoadEntities: true,
  };
}
