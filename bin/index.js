#!/usr/bin/env node

/**
 * Module dependencies.
 */

let app = require('../app');
let debug = require('debug')('chat-server:server');
let http = require('http');
const cors = require('cors');
const {addUser, removeUser, getUser, getUsersInRoom} = require ('../controllers/usersController/usersController');


//io module
let socketio = require('socket.io');

/**
 * Get port from environment and store in Express.
 */

let port = normalizePort(process.env.PORT || '4000');
app.set('port', port);
app.use(cors());

/**
 * Create HTTP server.
 */

let server = http.createServer(app);

//io set-up

const io = socketio(server);


io.on('connection', (socket) => {

  socket.on('join', ({name, room }, callback) => {
    const {error , user } = addUser({id: socket.id , name, room});

    if( error ) return callback( error );

    socket.emit('message', { user : 'administrateur' , text: `${user.name} , bienvenu dans le groupe ${user.room}`});
    socket.broadcast.to(user.room).emit('message', { user : 'admin', text: `${user.name} ,a rejoint le groupe !`});

    socket.join(user.room);
    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', {user : user.name, text: message});
    callback();
  });
  socket.on('disconnect', () =>{
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room). emit('message', {user:'administrateur', text: `${user.name} a quitté le groupe !`});
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
    }
  })
});


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  let port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
