const SEPARATOR = Buffer.from("\r\n");

enum RespType {
    BULK_STRING = 36, // $
    ARRAY = 42,       // *
}

export function parse(message: Buffer): string | string[] {
    const messageType = message[0];

    if (messageType === RespType.BULK_STRING) {
        const separatorIndex = message.indexOf(SEPARATOR);

        const stringSize = parseInt(
            message.subarray(1, separatorIndex).toString()
        );
        const stringStart = separatorIndex + 2;
        const stringEnd = stringStart + stringSize;
        return message.subarray(stringStart, stringEnd).toString();
    }

    if (messageType === RespType.ARRAY) {
        const separatorIndex = message.indexOf(SEPARATOR);

        const arraySize = parseInt(
            message.subarray(1, separatorIndex).toString()
        );
        const result: string[] = [];
        let nextElementStart = separatorIndex + 2;
        for (let i = 0; i < arraySize; i++) {
            const elementType = message[nextElementStart];
            if (elementType === RespType.BULK_STRING) {
                const sizeSeparatorIndex = message.indexOf(
                    SEPARATOR,
                    nextElementStart
                );
                const stringSize = parseInt(
                    message
                        .subarray(nextElementStart + 1, sizeSeparatorIndex)
                        .toString()
                );
                const elementEnd =
                    sizeSeparatorIndex + 2 + stringSize + 2;
                const element = message.subarray(
                    nextElementStart,
                    elementEnd
                );
                nextElementStart = elementEnd;
                result.push(parse(element) as string);
            }
        }
        return result;
    }
    throw new Error(`Unsupported RESP type: ${messageType}`);
}

export function decodeError(message: string): Buffer {
    return Buffer.concat([
        Buffer.from("-ERR "),
        Buffer.from(message),
        SEPARATOR,
    ]);
}

export function decodeErrorWrongType(): Buffer {
    return Buffer.concat([
        Buffer.from("-WRONGTYPE "),
        Buffer.from(`Operation against a key holding the wrong kind of value`),
        SEPARATOR,
    ]);
}

export function decode(
    message: string | number | Array<string | number | null> | null,
    end = true
): Buffer {
    if (message === null) {
        return Buffer.concat([
            Buffer.from("$-1"),
            end ? SEPARATOR : Buffer.alloc(0),
        ]);
    }

    if (typeof message === "string") {
        return Buffer.concat([
            Buffer.from(`$${Buffer.byteLength(message)}\r\n`),
            Buffer.from(message),
            end ? SEPARATOR : Buffer.alloc(0),
        ]);
    }
    if (typeof message === "number") {
        return Buffer.from(`:${message}${end ? "\r\n" : ""}`);
    }

    if (Array.isArray(message)) {
        if (message.length === 0) {
            return Buffer.from("*0\r\n");
        }
        const decodedElements = message.map((m) => decode(m, false));
        return Buffer.concat([
            Buffer.from(`*${message.length}\r\n`),
            Buffer.concat(
                decodedElements.flatMap((element, index) =>
                    index === decodedElements.length - 1
                        ? [element]
                        : [element, SEPARATOR]
                )
            ),
            SEPARATOR,
        ]);
    }
    throw new Error("Unsupported type");
}
