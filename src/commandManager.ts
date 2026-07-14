import { decode, decodeError } from "./parser";
import { RedisRepository } from "./repository/redis.repository";

function compareCommand(command0: string, command1: string): Boolean {
    return command0.toLowerCase() === command1.toLowerCase();
}

export async function commandManager(command: string[], redisRepository: RedisRepository): Promise<Buffer> {
    if (compareCommand(command[0], 'PING')) {
        return Buffer.from("+PONG\r\n")
    }
    if (compareCommand(command[0], 'SET')) {
        if (command.includes('px')) {
            const expIn = parseInt(command[command.indexOf("px")+1]);
            if (Number.isNaN(expIn)) {
                return Buffer.from(decodeError('ERR value is not an integer or out of range'));
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

    if (compareCommand(command[0], 'GET')) {
        const value = await redisRepository.get(command[1]);
        if (value === null) {
            return Buffer.from("$-1\r\n")
        }
        return Buffer.from(decode(value))
    }

    if (compareCommand(command[0], 'KEYS')) {
        const value = await redisRepository.keys(command[1]);
        return Buffer.from(decode(value))
    }
    
    return Buffer.from(decodeError(`ERR unknown command \`${command[0]}\``));
}

