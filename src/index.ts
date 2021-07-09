import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import morgan from 'morgan';
import fs from 'fs';
import fileupload from 'express-fileupload';
import socketio from 'socket.io';
import http from 'http';
import logger from './utilis/logger'; // logger
import router from './routes'; //routes
import './utilis/db';
import SocketController from './Controller/Chat/SocketController';

// dotenv configuration
fs.existsSync('.env')
    ? dotenv.config({ path: '.env' })
    : logger.error(
          'can not find .env file. Please make sure .env file is present'
      );

// Create Express server
const app = express();

/** Get port from environment and store in Express. */
const port = process.env.PORT || '5000';
const host = process.env.HOST || 'localhost';
app.set('port', port);
app.disable('x-powered-by');

// apply middlewares
app.use(
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
    cors(),
    helmet(),
    morgan('dev'),
    fileupload()
);

// routing
app.use(router);
// error handling for non exsistent routes
app.get('*', (req: Request, res: Response) => {
    res.status(404).json({
        status: 404,
        message: 'This route does not exsist',
    });
});

/** Create HTTP server. */
const server = http.createServer(app);
/** Create socket connection */
const io = socketio.listen(server);
/** Listen on provided port, on all network interfaces. */
server.listen(port);
/** Event listener for HTTP server "listening" event. */
server.on('listening', () => {
    console.log(`Listening on port:: ${host}:${port}/`);
});

// // io.on('connection', WebSockets.connection);
const users = {};
io.on('connection', socket => {
    socket.on('login', async data => {
        const result = await SocketController.login(data, socket);
        users[socket.id] = result.conversationID;
        io.to(socket.id).emit('message', result);
    });

    socket.on('message', async msg => {
        const result = await SocketController.send(msg, socket);
        io.to(result.conversationID).emit('message', result);
    });
    socket.on('disconnect', data => {
        console.log('user disconnected', socket.rooms);
        console.log('user ' + users[socket.id] + ' disconnected');
        // console.log('user ' + rooms[socket.id] + ' disconnected');
        // remove saved socket from users object
        //  delete rooms[socket.id];
    });
});

export { io };
