import { QueryRunner, Repository } from "typeorm";
import { RedisEntity } from "../entity/RedisEntity";
import { AppDataSource } from "../db";

export class RedisRepository {
    constructor(
        private readonly repository: Repository<RedisEntity>,
    ) {}

    async createQueryRunner(): Promise<QueryRunner> {
        const queryRunner = AppDataSource.createQueryRunner()
        await queryRunner.connect()
        return queryRunner;
    }

    async selectToCleanUp(batchSize: number, queryRunner: QueryRunner): Promise<RedisEntity[]>{
        return await queryRunner.manager
            .createQueryBuilder(RedisEntity, "redis")
            .select("redis.key")
            .where("redis.expired_at IS NOT NULL")
            .andWhere("redis.expired_at <= CURRENT_TIMESTAMP")
            .setLock("pessimistic_write")
            .setOnLocked("skip_locked")
            .limit(batchSize)
            .getMany();
    }

    async cleanUp(keys: string[], queryRunner: QueryRunner) {
        await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(RedisEntity)
        .where("key IN (:...keys)", { keys })
        .execute();
    }

    async keys(pattern: string): Promise<string[]> {
        const rows = await this.repository
            .createQueryBuilder("cache")
            .where("cache.key like :pattern", { pattern: pattern.replace("*", '%') })
            .andWhere(
                "(cache.expired_at IS NULL OR cache.expired_at > CURRENT_TIMESTAMP)"
            )
            .getMany();
        return rows.map((d) => d.key)
    }

    async get(key: string): Promise<RedisEntity | null> {
        const row = await this.repository
            .createQueryBuilder("cache")
            .where("cache.key = :key", { key })
            .andWhere(
                "(cache.expired_at IS NULL OR cache.expired_at > CURRENT_TIMESTAMP)"
            )
            .getOne();
        return row ?? null;
    }

    async set( key: string, value: string): Promise<void> {
        await this.repository.upsert( { key, value, type: 'S' }, ["key"] );
    }

    async setWithExp( key: string, value: string, expIn: number): Promise<void> {
        await this.repository
        .createQueryBuilder()
        .insert()
        .into(this.repository.metadata.target)
        .values({
            key,
            value,
            expired_at: () => `CURRENT_TIMESTAMP + INTERVAL '${expIn} milliseconds'`,
        })
        .orUpdate(
            ["value", "expired_at"],
            ["key"],
        )
        .execute();
    }

    async hset(key: string, hkeys: string[], hvalues: any[]): Promise<void> {
        const json: Record<string, any> = {};

        for (let i = 0; i < hkeys.length; i++) {
            json[hkeys[i]] = hvalues[i];
        }
        console.log(key, hkeys, hvalues)
        await this.repository
        .createQueryBuilder()
        .insert()
        .into(RedisEntity)
        .values({
            key,
            type: "H",
            value: "",
            json,
        })
        .orUpdate(
            ["json", "type"],
            ["key"],
            {
                overwriteCondition: {
                    where: "TRUE",
                },
            },
        )
        .setParameter("json", JSON.stringify(json))
        .execute();

    }

    async hgetall(key: string): Promise<Record<string, any> | null> {
        const result = await this.repository
            .createQueryBuilder("r")
            .select("r.json", "json")
            .where("r.key = :key", { key })
            .andWhere(
                "(r.expired_at IS NULL OR r.expired_at > CURRENT_TIMESTAMP)"
            )
            .getRawOne();
        return result?.json ?? null;
    }
}
