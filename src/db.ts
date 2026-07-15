import "reflect-metadata";
import { DataSource } from "typeorm";
import { RedisEntity } from "./entity/RedisEntity";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT ?? 5432),
    username: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_NAME,
    synchronize: true,
    logging: false,
    entities: [RedisEntity],
});
