import { Repository } from "typeorm";
import { RedisEntity } from "../entity/RedisEntity";

export class RedisRepository {
    constructor(
        private readonly repository: Repository<RedisEntity>,
    ) {}

    async get(key: string): Promise<string | null> {
        const row = await this.repository
            .createQueryBuilder("cache")
            .where("cache.key = :key", { key })
            .andWhere(
                "(cache.expired_at IS NULL OR cache.expired_at > CURRENT_TIMESTAMP)"
            )
            .getOne();
        return row?.value ?? null;
    }

    async set( key: string, value: string): Promise<void> {
        await this.repository.upsert( { key, value }, ["key"] );
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
}
