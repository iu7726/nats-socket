import cluster from "cluster";
import http, { createServer, IncomingMessage, ServerResponse } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import os from "os";
import { createAdapter } from "@socket.io/cluster-adapter";
import { connect, StringCodec, NatsConnection } from 'nats';

const numCPUs = os.cpus().length;
const PORT = 4000;

if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork(); // Fork a new worker when one dies
    });
} else {
    console.log(`Worker ${process.pid} started`);

    // NATS setup
    const sc = StringCodec();
    let natsConnection: NatsConnection;

    const connectToNats = async () => {
        try {
            natsConnection = await connect({
                servers: ['nats://localhost:4222']
            });
            console.log(`Worker ${process.pid} connected to NATS`);

            const sub = natsConnection.subscribe('chat.>');
            (async () => {
                for await (const msg of sub) {
                    const [_, room] = msg.subject.split('.');
                    const message = sc.decode(msg.data);
                    io.to(room).emit('message', { room, message });
                }
            })();
        } catch (err) {
            console.error(`Failed to connect to NATS: ${err}`);
        }
    };

    connectToNats();

    // HTTP and Socket.IO setup
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
        // Handle CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // Serve a simple response for testing purposes
        if (req.method === 'GET' && req.url === '/') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('NATS Chat Server');
        }
    });

    const io = new SocketIOServer(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        }
    });

    io.adapter(createAdapter());

    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);

        socket.on('joinRoom', (room: string) => {
            socket.join(room);
            console.log(`Client ${socket.id} joined room: ${room}`);
        });

        socket.on('sendMessage', ({ room, message }: { room: string, message: string }) => {
            natsConnection.publish(`chat.${room}`, sc.encode(message));
        });

        socket.on('disconnect', (reason) => {
            console.log(`Client ${socket.id} disconnected: ${reason}`);
        });
    });

    server.listen(PORT, () => console.log(`Worker ${process.pid} is running on port ${PORT}`));
}