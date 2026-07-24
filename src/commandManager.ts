import { decode, decodeError, decodeErrorWrongType } from "./parser";
import { RedisRepository } from "./repository/redis.repository";
import { compareCommand } from "./utils";
import * as validation from "./validation";

export async function commandManager(command: string[], redisRepository: RedisRepository): Promise<Buffer> {
    if (compareCommand(command[0], 'PING')) {
        return Buffer.from("+PONG\r\n")
    }
    if (compareCommand(command[0], 'SET')) {
        const error = validation.validateSet(command);
        if (error) { return Buffer.from(decodeError(error)) };

        if (command.includes('px')) {
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
        const error = validation.validateGet(command);
        if (error) { return Buffer.from(decodeError(error)) };

        const value = await redisRepository.get(command[1]);
        if (value === null) {
            return Buffer.from("$-1\r\n")
        }
        if (value.type !== 'S') {
            return Buffer.from(decodeErrorWrongType());
        }
        return Buffer.from(decode(value.value))
    }

    if (compareCommand(command[0], 'DEL')) {
        const error = validation.validateGet(command);
        if (error) { return Buffer.from(decodeError(error)) };

        const value = await redisRepository.del(command.slice(1));
        if (value === null) {
            return Buffer.from("$-1\r\n")
        }
        return Buffer.from(decode(value))
    }

    if (compareCommand(command[0], 'KEYS')) {
        const error = validation.validateKeys(command);
        if (error) { return Buffer.from(decodeError(error)) };

        const value = await redisRepository.keys(command[1]);
        return Buffer.from(decode(value))
    }

    if (compareCommand(command[0], 'HGET')) {
        const error = validation.validateHget(command);
        if (error) { return Buffer.from(decodeError(error)) };

        const value = await redisRepository.get(command[1]);
        if (value && value.type !== 'H') {
            return Buffer.from(decodeErrorWrongType());
        }
        return Buffer.from(decode(value &&  value.json[command[2]] ? value.json[command[2]] : null))
    }

    if (compareCommand(command[0], 'HSET')) {
        const error = validation.validateHset(command);
        if (error) { return Buffer.from(decodeError(error)) };

        const value = await redisRepository.get(command[1]);
        if (value && value.type !== 'H') {
            return Buffer.from(decodeErrorWrongType());
        }

        const hkeys: string[] = [];
        const hvalues: string[] = [];

        for (let i = 2; i < command.length; i += 2) {
            hkeys.push(command[i]);
            hvalues.push(command[i + 1]);
        }
        await redisRepository.hset(command[1], hkeys, hvalues);
        return Buffer.from("+OK\r\n")
    }

    if (compareCommand(command[0], 'HGETALL')) {
        const error = validation.validateHset(command);
        if (error) { return Buffer.from(decodeError(error)) };

        const value = await redisRepository.get(command[1]);
        if (value && value.type !== 'H') {
            return Buffer.from(decodeErrorWrongType());
        }

        const result = await redisRepository.hgetall(command[1]);
        if (result === null) {
            return Buffer.from("$-1\r\n")
        }
        return Buffer.from(decode(Object.entries(result).flat()))
    }
    
    return Buffer.from(decodeError(`unknown command \`${command[0]}\``));
}

