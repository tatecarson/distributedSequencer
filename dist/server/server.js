'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _compression = require('compression');

var _compression2 = _interopRequireDefault(_compression);

var _util = require('../shared/util');

var _abletonlink = require('abletonlink');

var _abletonlink2 = _interopRequireDefault(_abletonlink);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// const debounce = require('lodash.debounce');
// const throttle = require('lodash.throttle');
// const _ = require('lodash');

var app = (0, _express2.default)();
var server = _http2.default.Server(app);
var io = new _socket2.default(server);
var port = process.env.PORT || 3000;
var users = [];
var sockets = {};
var link = new _abletonlink2.default(280, 4);

app.use((0, _compression2.default)({}));
app.use(_express2.default['static'](__dirname + '/../client'));

(function () {
  var lastBeat = 0.0;
  link.startUpdate(16, function (beat, phase, bpm) {
    beat = 0 ^ beat;
    if (beat - lastBeat > 0) {
      io.emit('beat', { beat: beat, phase: phase, bpm: bpm });
      // this is sending
      // console.log('beat');
      lastBeat = beat;
    }
  });
})();

io.on('connection', function (socket) {
  var nick = socket.handshake.query.nick;
  var heading = void 0;
  var availableNotes = [10, 12, 2, 8, 4, 3];
  var currentUser = {
    id: socket.id,
    heading: heading,
    nick: nick,
    notes: [availableNotes[Math.floor(Math.random() * availableNotes.length)]]
  };
  var userList = [];
  if ((0, _util.findIndex)(users, currentUser.id) > -1) {
    console.log('[INFO] User ID is already connected, kicking.');
    socket.disconnect();
  } else if (!(0, _util.validNick)(currentUser.nick)) {
    socket.disconnect();
  } else {
    console.log('[INFO] User ' + currentUser.nick + ' connected!');
    sockets[currentUser.id] = socket;
    users.push(currentUser);
    userList.push(currentUser.id);
    io.emit('userJoin', { nick: currentUser.nick, total: users.length, note: currentUser.notes });
    console.log('[INFO] Total users: ' + users.length);
  }

  socket.on('heading', function (data) {
    currentUser.heading = data;
    // currentUser.matchingNotes = matchingNotes;

    for (var i = 0; i < users.length; i++) {
      if (Math.abs(currentUser.heading - users[i].heading) === 180) {
        console.log('match: ', currentUser.id, currentUser.nick, users[i].notes, currentUser.notes);
        io.to(users[i].id).emit('headingMatch', currentUser.id, currentUser.nick, currentUser.notes, users[i].notes, users[i].id);

        // trying this
        io.to(currentUser.id).emit('steal', users[i].nick, currentUser.notes);
      }
    }
  });

  // take note from user
  // TODO: add which note to take? and slice it from the array on the server
  // socket.on('steal', (victim, stealer) => {
  //   console.log(users, stealer);

  //   io.to(victim).emit('steal', currentUser.nick, currentUser.notes);
  // });

  // give note to user
  // TODO: add which note to give and add it to the array on the server
  socket.on('give', function (takerId, giverId) {
    users.forEach(function (x) {
      if (x.id === takerId) {
        x.notes.push(currentUser.notes[0]);
        console.log(currentUser.id, giverId, x.id, x.notes);
      }
    });
  });

  io.emit('getTotalUsers', users.length, userList);

  // orchestrate phones evenly
  for (var i = 0; i < users.length; i++) {
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
  socket.on('start', function () {
    console.log('server got start message');
    io.emit('start', 'hi');
  });

  socket.on('stop', function () {
    socket.broadcast.emit('stop', 'stop ittt');
  });

  socket.on('disconnect', function () {
    if ((0, _util.findIndex)(users, currentUser.id) > -1) users.splice((0, _util.findIndex)(users, currentUser.id), 1);
    console.log('[INFO] User ' + currentUser.nick + ' disconnected!');
    socket.broadcast.emit('userDisconnect', { nick: currentUser.nick });
    io.emit('getTotalUsers', users.length);
  });

  socket.on('userChat', function (data) {
    var _nick = (0, _util.sanitizeString)(data.nick);
    var _message = (0, _util.sanitizeString)(data.message);
    var date = new Date();
    var time = ('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2);

    console.log('[CHAT] [' + time + '] ' + _nick + ': ' + _message);
    socket.broadcast.emit('serverSendUserChat', { nick: _nick, message: _message });
  });
});

server.listen(port, function () {
  console.log('[INFO] Listening on *:' + port);
});