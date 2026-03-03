import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "nestjs-pino";
import { getDatabaseConfig } from "./config/database.config";
import { pinoLoggerOptions } from "./config/logger.config";
import { BookingModule } from "./modules/controllers/booking/booking.module";
import { LocationModule } from "./modules/controllers/location/location.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
    }),
    LoggerModule.forRoot(pinoLoggerOptions),
    TypeOrmModule.forRootAsync({
      useFactory: () => getDatabaseConfig(),
    }),
    LocationModule,
    BookingModule,
  ],
})
export class AppModule {}
