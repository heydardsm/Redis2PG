import { decode, decodeError } from "./parser";
import { RedisRepository } from "./repository/redis.repository";

export async function commandManager(command: string[], redisRepository: RedisRepository): Promise<Buffer> {
    if (command[0] == 'PING') {
        return Buffer.from("+PONG\r\n")
    }
    if (command[0] == 'SET') {
        if (command.includes('px')) {
            const expIn = parseInt(command[command.indexOf("px")+1]);
            if (Number.isNaN(expIn)) {
                return Buffer.from(decodeError('INVALID_PX'));
            }
            await redisRepository.setWithExp(
                command[1],
                command[2],
                parseInt(command[command.indexOf("px")+1])
            );
        } else {
            await redisRepository.set(command[1], command[2]);
        }
        return Buffer.from("+OK\r\n")
    }

    if (command[0] == 'GET') {
        const value = await redisRepository.get(command[1]);
        if (value === null) {
            return Buffer.from("$-1\r\n")
        }
        return Buffer.from(decode(value))
    }
}

