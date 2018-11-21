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
  var currentUser = {
    id: socket.id,
    heading: heading,
    nick: nick
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
    io.emit('userJoin', { nick: currentUser.nick, total: users.length });
    console.log('[INFO] Total users: ' + users.length);
  }

  var timeToResume = 0;

  socket.on('heading', function (data, headingNotes) {
    currentUser.heading = data;
    currentUser.headingNotes = headingNotes;

    for (var i = 0; i < users.length; i++) {
      if (Math.abs(currentUser.heading - users[i].heading) > 160 && Math.abs(currentUser.heading - users[i].heading) < 200) {
        if (process.hrtime()[0] > timeToResume) {
          // check every 3 seconds
          timeToResume = process.hrtime()[0] + 3;

          // TODO: instead of sending percussion note, send the note you play when the headings match
          // a player can collect those notes so a certain melody plays when they match someone
          // the player can choose to take the note or not if the coin flip is in their favor
          // figure out another system of game play later to decide who gets to take the note
          console.log('match: ', currentUser.id, users[i].id, headingNotes);

          // TODO: emit to these two users specifically giving the one who came first the choice of stealing
          // io.to(currentUser.id).emit('headingMatch', headingNotes)
          // io.to(users[i].id).emit('headingMatch', 'try again next time')
          io.emit('headingMatch', currentUser.id, users[i].id, headingNotes);
        }
      }
    }
    // io.emit('heading', users);
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

  // let matching client know what notes other client is playing
  socket.on('headingMatch', function (user, matchingNotes, coin) {
    // if Math.random() > 0.5 let 2nd client take first clients note
    console.log('coin ' + coin);
    // FIXME: this is triggering just once but sending the same message to both users
    // I want it to send a different message to both users

    io.to(user).emit('headingMatch', user, matchingNotes, coin);
  });

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