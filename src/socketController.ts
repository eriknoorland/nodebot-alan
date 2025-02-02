import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

export default (publicFolder: string): Promise<Server> => {
  return new Promise(resolve => {
    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      allowEIO3: true,
      cors: { origin: '*' },
    });

    io.on('connection', socket => {
      console.log('Client connected');

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });

    app.use(express.static(publicFolder));
    app.use(cors())
    app.use('/api/v1', require('./api/v1'));

    httpServer.listen(3000, () => {
      resolve(io)
    });
  });
}
