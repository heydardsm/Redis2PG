import net from "net";
import { AppDataSource } from "./db";
import { parse } from "./parser"; 
import { commandManager } from "./commandManager";
import { RedisEntity } from "./entity/RedisEntity";
import { RedisRepository } from "./repository/redis.repository";
import { logger } from "./logger";
import { cleanupExpired } from "./cleanup";

const PORT = 3000;

let redisRepository: RedisRepository|null = null;

const server = net.createServer((socket) => {
    logger.info(
        "Client connected",
        {remoteAddress: socket.remoteAddress, remotePort: socket.remotePort}
    );

    socket.on("data", async (data) => {
        const request = parse(data as Buffer);
        const response = await commandManager(request as string[], redisRepository);
        socket.write(response);
    });
    socket.on("close", () => {
        logger.info(
            "Client disconnected",
            {remoteAddress: socket.remoteAddress, remotePort: socket.remotePort}
        );
    });
    socket.on("error", (err) => {
        logger.error(
            "error",
            {
                remoteAddress: socket.remoteAddress,
                remotePort: socket.remotePort,
                error: err
            }
        );
    });
});


async function bootstrap() {
    try {
        await AppDataSource.initialize();
        redisRepository = new RedisRepository(
            AppDataSource.getRepository(RedisEntity),
        );
        server.listen(PORT, () => {
            logger.info(`Echo server listening`, {port: PORT});
        });

        let cleanupExpiredLock = false;
        setInterval(async () => {
            if (cleanupExpiredLock) { return ;};
            cleanupExpiredLock = true;
            await cleanupExpired(redisRepository);
            cleanupExpiredLock = false;
        }, 10_000)

    } catch (err) {
        logger.error("Failed to start application:", {error: err});
        process.exit(1);
    }
}

bootstrap();
