# Nats-Socket Project

[![NATS](https://img.shields.io/badge/nats-2.26.0-blue)](https://www.npmjs.com/package/nats)
[![Socket.IO](https://img.shields.io/badge/socket.io-4.7.5-blue)](https://www.npmjs.com/package/socket.io)
[![Cluster](https://img.shields.io/badge/cluster-0.7.7-blue)](https://www.npmjs.com/package/cluster)

## Description
This project sets up a chat server using Socket.IO for real-time communication and NATS for message brokering. It utilizes clustering to leverage multiple CPU cores for improved performance and reliability.

## Installation

To install the necessary dependencies, run:

```bash
npm install
```

## Usage
To start the server, simply run:

```bash
npm start # product
npm run dev
```

## How it Works
- The primary process forks worker processes based on the number of CPU cores available.
- Each worker connects to a NATS server and listens for messages on a specific topic pattern (chat.>).
- The server sets up an HTTP server and a Socket.IO server to handle real-time communication.
- Clients can join specific chat rooms and send messages, which are then published to NATS and broadcasted to all clients in the respective rooms.

## Environment Variables
Make sure to set up the necessary environment variables:

- `NATS_SERVERS`: Comma-separated list of NATS server URLs (default is `nats://localhost:4222`).

## API Endpoints

### HTTP Endpoints
- `GET /`: Returns a simple text response to confirm the server is running.

### Socket.IO Events
- `joinRoom`: Allows a client to join a specified room.
  - <b>Payload</b>: `{ room: string }`
- `sendMessage`: Sends a message to a specified room.
  - <b>Payload</b>: `{ room: string, message: string }`
  
## ETC
[Nats](https://docs.nats.io/)