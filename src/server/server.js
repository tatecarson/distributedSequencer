'use strict';

import express from 'express';
import http from 'http';
import SocketIO from 'socket.io';
import compression from 'compression';
import {validNick, findIndex, sanitizeString} from '../shared/util';
import abletonlink from 'abletonlink';
// const debounce = require('lodash.debounce');
// const throttle = require('lodash.throttle');
const _ = require('lodash');

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
  let currentUser = {
    id: socket.id,
    heading: heading,
    nick: nick
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
    io.emit('userJoin', {nick: currentUser.nick, total: users.length});
    console.log('[INFO] Total users: ' + users.length);
  }

  socket.on('heading', (data, headingNotes) => {
    currentUser.heading = data;
    currentUser.headingNotes = headingNotes;

    for (let i = 0; i < users.length; i++) {
      if ((Math.abs(currentUser.heading - users[i].heading) === 180)) {
        // TODO: instead of sending percussion note, send the note you play when the headings match
        // a player can collect those notes so a certain melody plays when they match someone
        // the player can choose to take the note or not if the coin flip is in their favor
        // figure out another system of game play later to decide who gets to take the note

        console.log('match: ', currentUser.id, users[i].id, headingNotes);
        io.to(users[i].id).emit('headingMatch', currentUser.id, currentUser.nick, headingNotes);
      }
    }
    // io.emit('heading', users);
  });

  socket.on('steal', (victim, stealer) => {
    io.to(victim).emit('steal', currentUser.nick);
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

  // // let matching client know what notes other client is playing
  // socket.on('headingMatch', (user, matchingNotes, coin) => {
  //   // if Math.random() > 0.5 let 2nd client take first clients note
  //   console.log(`coin ${coin}`);
  //   // FIXME: this is triggering just once but sending the same message to both users
  //   // I want it to send a different message to both users

  //   io.to(user).emit('headingMatch', user, matchingNotes, coin);
  // });

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

  socket.on('userChat', (data) => {
    let _nick = sanitizeString(data.nick);
    let _message = sanitizeString(data.message);
    let date = new Date();
    let time = ('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2);

    console.log('[CHAT] [' + time + '] ' + _nick + ': ' + _message);
    socket.broadcast.emit('serverSendUserChat', {nick: _nick, message: _message});
  });
});

server.listen(port, () => {
  console.log('[INFO] Listening on *:' + port);
});
