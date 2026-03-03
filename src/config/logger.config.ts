import { Params } from "nestjs-pino";

export const pinoLoggerOptions: Params = {
  pinoHttp: {
    level: process.env.NODE_ENV !== "production" ? "debug" : "info",
    transport:
      process.env.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              singleLine: false,
            },
          }
        : undefined,
  },
};

