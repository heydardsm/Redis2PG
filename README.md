# Redis2PG

<p align="center">
  <img src="./logo.png" alt="Redis2PG Logo" width="620">
</p>

**Redis2PG** is a TypeScript service that translates the Redis protocol into PostgreSQL queries. It allows applications that speak the Redis protocol to use PostgreSQL as the underlying data store without requiring changes to the client.

## Features

* 🚀 Redis protocol compatible interface
* 🐘 PostgreSQL as the storage backend
* 🟦 Written in TypeScript
* 🐳 Docker-based deployment
* ⚡ Lightweight and easy to run

## Supported Commands

The following Redis commands are currently supported:

| Command   | Description                                |
| --------- | ------------------------------------------ |
| `PING`    | Check server availability                  |
| `GET`     | Retrieve a string value                    |
| `SET`     | Store a string value                       |
| `DEL`     | Delete one or more keys                    |
| `HSET`    | Set a hash field                           |
| `HGET`    | Get a hash field                           |
| `HDEL`    | Delete a hash field                        |
| `HGETALL` | Retrieve all fields and values from a hash |
| `FLUSHDB` | Remove all stored data                     |

## Configuration

The service requires the following environment variables:

| Variable      | Description              |
| ------------- | ------------------------ |
| `PG_HOST`     | PostgreSQL host          |
| `PG_NAME`     | PostgreSQL database name |
| `PG_PORT`     | PostgreSQL port          |
| `PG_PASSWORD` | PostgreSQL password      |

## Getting Started

### Prerequisites

* Docker
* Docker Compose

### Build the Image

```bash
docker build -t redis2pg .
```

### Start the Service

```bash
docker compose up
```

Or run it in the background:

```bash
docker compose up -d
```


## Status

Redis2PG currently supports a subset of Redis commands focused on strings and hashes. Additional command support may be added in future releases.
