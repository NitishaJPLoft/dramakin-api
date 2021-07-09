import { io } from '../index';

const rooms = {};

// // io.on('connection', WebSockets.connection);
io.on('connection', socket => {
    console.log('a user connected');
    socket.on('login', function (data) {
        console.log('socketID', socket.id);
        console.log('data', data);
        // const room = data.room;
        // const id = data.id;

        // console.log('a user ' + id + ' connected to room ' + room);
        // // saving userId to array with socket ID
        // rooms[socket.id] = room;
        // socket.join(room);
        // console.log('users1', rooms);
    });

    socket.on('message', msg => {
        console.log('message: ' + msg);
        io.to(rooms[socket.id]).emit('message', msg);
    });
    socket.on('disconnect', function () {
        console.log('user ' + rooms[socket.id] + ' disconnected');
        // remove saved socket from users object
        //  delete rooms[socket.id];
    });
});

export { io };
