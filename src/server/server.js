'use strict';

import express from 'express';
import http from 'http';
import SocketIO from 'socket.io';
import compression from 'compression';
import {validNick, findIndex} from '../shared/util';
import abletonlink from 'abletonlink';

const app = express();
const server = http.Server(app);
const io = new SocketIO(server);
const port = process.env.PORT || 3000;
const users = [];
const sockets = {};
const link = new abletonlink(280, 4);

app.use(compression({}));
app.use(express['static'](__dirname + '/../client'));

(() => {
  let lastBeat = 0.0;
  link.startUpdate(16, (beat, phase, bpm) => {
    beat = 0 ^ beat;
    if (beat - lastBeat > 0) {
      io.emit('beat', { beat, phase, bpm });
      // this is sending
      // console.log('beat');
      lastBeat = beat;
    }
  });
})();

io.on('connection', (socket) => {
  let nick = socket.handshake.query.nick;
  let heading;
  const availableNotes = [10, 12, 2, 8, 4, 3];
  let currentUser = {
    id: socket.id,
    heading: heading,
    nick: nick,
    notes: [availableNotes[Math.floor(Math.random() * availableNotes.length)]]
  };
  let userList = [];
  if (findIndex(users, currentUser.id) > -1) {
    console.log('[INFO] User ID is already connected, kicking.');
    socket.disconnect();
  } else if (!validNick(currentUser.nick)) {
    socket.disconnect();
  } else {
    console.log('[INFO] User ' + currentUser.nick + ' connected!');
    sockets[currentUser.id] = socket;
    users.push(currentUser);
    userList.push(currentUser.id);
    io.emit('userJoin', {nick: currentUser.nick, total: users.length, note: currentUser.notes});
    console.log('[INFO] Total users: ' + users.length);
  }

  socket.on('heading', (data) => {
    currentUser.heading = data;

    for (let i = 0; i < users.length; i++) {
      if ((Math.abs(currentUser.heading - users[i].heading) === 180)) {
        console.log('match: ', currentUser.id, currentUser.nick, users[i].notes, currentUser.notes);
        io.to(users[i].id).emit('headingMatch', currentUser.id, currentUser.nick, currentUser.notes, users[i].notes, users[i].id);

        // trying this
        io.to(currentUser.id).emit('steal', users[i].nick, currentUser.notes);
      }
    }
  });

  // give note to user
  socket.on('give', (giverId, pickedNote) => {
    // look at ever user
    console.log(pickedNote);
    users.forEach(giver => {
      // find the user that matches the giver id
      if (giver.id === giverId) {
        // give the other users notes to current user
        currentUser.notes.push(giver.notes[pickedNote]);
      }
    });
  });

  io.emit('getTotalUsers', users.length, userList);

  // orchestrate phones evenly
  for (let i = 0; i < users.length; i++) {
    console.log(users[i].id);
    if (i % 2 === 0) {
      console.log('even');
      io.to(users[i].id).emit('getParts', 'shortSynth');
    } else {
      console.log('odd');
      io.to(users[i].id).emit('getParts', 'drone');
    }
  }

  // emit when user restarts with toggle
  // or clicks 'tap to start composing'
  socket.on('start', () => {
    console.log('server got start message');
    io.emit('start', 'hi');
  });

  socket.on('stop', () => {
    socket.broadcast.emit('stop', 'stop ittt');
  });

  socket.on('disconnect', () => {
    if (findIndex(users, currentUser.id) > -1) users.splice(findIndex(users, currentUser.id), 1);
    console.log('[INFO] User ' + currentUser.nick + ' disconnected!');
    socket.broadcast.emit('userDisconnect', {nick: currentUser.nick});
    io.emit('getTotalUsers', users.length);
  });
});

server.listen(port, () => {
  console.log('[INFO] Listening on *:' + port);
});
