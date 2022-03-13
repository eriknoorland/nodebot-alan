const http = require('http');
const express = require('express');
const cors = require('cors');
const socketio = require('socket.io');

module.exports = (publicFolder) => {
  return new Promise(resolve => {
    const app = express();
    const httpServer = http.createServer(app);
    const io = socketio(httpServer, {
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
