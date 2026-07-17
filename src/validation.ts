import { compareCommand } from "./utils";

export function validateGet(command: string[]): string|null {
    if (command.length === 2) {return null};
    return 'wrong number of arguments for \'get\' command';
}

export function validateSet(command: string[]): string|null {
    if (command.length === 3) {return null}; 
    if (command.length < 3) {
        return 'wrong number of arguments for \'set\' command';
    }
    if (compareCommand(command[3], 'PX') && !Number.isInteger(parseFloat(command[4]))) {
        return 'value is not an integer or out of range';
    }
    if (compareCommand(command[3], 'PX') && Number.isInteger(parseFloat(command[4]))) {
        return null;
    }
    return 'syntax error';
}
