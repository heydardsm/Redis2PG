import "reflect-metadata";
import { RedisRepository } from "./repository/redis.repository"
import { logger } from "./logger";

const BATCH_SIZE = 100;

export async function cleanupExpired(repository: RedisRepository): Promise<void> {
    logger.info("Started cleanupExpired")
    const queryRunner = await repository.createQueryRunner();
    await queryRunner.startTransaction();
    try {
        const rows = await repository.selectToCleanUp(BATCH_SIZE, queryRunner);
        if (rows.length === 0) {
            await queryRunner.commitTransaction();
            return;
        }
        const keys = rows.map(row => row.key);
        await repository.cleanUp(keys, queryRunner);
        await queryRunner.commitTransaction();
        logger.info("Cleaned", {keys})
    } catch (err) {
        await queryRunner.rollbackTransaction();
    } finally {
        await queryRunner.release();
    }
}
