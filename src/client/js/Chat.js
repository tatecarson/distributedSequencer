import io from 'socket.io-client';
import Nexus from 'nexusui';
import {sanitizeString} from '../../shared/util';
import MakeSynth from './MakeSynth';
import Tone from 'Tone/core/Tone';
export default class Chat {
  constructor (nick) {
    this.chatInput = document.getElementById('chatInput');
    this.chatList = document.getElementById('chatList');
    this.btn = document.getElementById('startTransport');

    this.nick = nick;
    this.socket = io({query: 'nick=' + nick});
    this.commands = {};
    this.users = {};

    this.setupSocket();
    this.setupChat();
    this.setupEvents();
    this.setupSynth();
  }

  setupSocket () {
    // start transport at the same time on all devices
    this.socket.on('start', () => Tone.Transport.start());

    this.socket.on('dong', () => {
      this.latency = Date.now() - this.startPingTime;
      this.addSystemLine('Ping: ' + this.latency + 'ms');
    });

    this.socket.on('connect_failed', () => {
      this.socket.close();
    });

    this.socket.on('disconnect', () => {
      this.socket.close();
    });

    this.socket.on('userDisconnect', (data) => {
      this.addSystemLine('<b>' + (data.nick.length < 1 ? 'Anon' : data.nick) + '</b> disconnected.');
    });

    this.socket.on('userJoin', (data) => {
      this.users.total = data.length;
      this.addSystemLine('<b>' + (data.nick.length < 1 ? 'Anon' : data.nick) + '</b> joined.');
    });

    this.socket.on('serverSendUserChat', (data) => {
      this.addChatLine(data.nick, data.message, false);
    });
  }

  setupChat () {
    this.registerCommand('ping', 'Check your latency.', () => {
      this.checkLatency();
    });

    this.registerCommand('help', 'Information about the chat commands.', () => {
      this.printHelp();
    });

    this.addSystemLine('Connected to the chat!');
    this.addSystemLine('Type <b>/help</b> for a list of commands.');
  }

  setupSynth () {
    // create new synth
    const synth = new MakeSynth();
    const fmSynth = synth.FM().instrument;
    const duoSynth = synth.duo().instrument; // for drones
    const coolFM = synth.coolFM().instrument;
    const rShortSynth = Nexus.pick(fmSynth, coolFM);
    const patterns = [];
    let part = 'shortSynth';
    // const partPicker = new Nexus.RadioButton('#part', {'numberOfButtons': 2});
    let choosePattern = 0;
    let percNote = Nexus.note(0);
    const droneNotes = new Nexus.Sequence([Nexus.note(9), Nexus.note(11), Nexus.note(1), Nexus.note(6), Nexus.note(7)]);
    const tilt = new Nexus.Tilt('#tilt');
    const transportToggle = new Nexus.Toggle('#startTransport');
    let totalUsers = 0;

    transportToggle.on('change', (v) => {
      if (v) {
        // Tone.Transport.start();
        this.socket.emit('start', 'hi');
      } else {
        Tone.Transport.stop();
      }
    });

    this.socket.on('getParts', data => {
      part = data;
      console.log(part);
    });

    this.socket.on('getTotalUsers', data => {
      totalUsers = data;
      for (let i = 0; i < totalUsers; i++) {
        patterns[i] = synth.createPattern(Nexus.ri(1, 8), Nexus.ri(9, 24));
      }
      console.log(`total users: ${totalUsers}`);
    });

    this.socket.on('beat', function (data) {
      // if the transport is running play a note each trigger
      if (Tone.Transport.state === 'started') {
        if (part === 'shortSynth') {
          console.log('got to short synth ');
          // TODO: is this choosePattern going over the number of clients?
          if (patterns[choosePattern % totalUsers].next()) {
            const durations = Nexus.pick('8n', '16n', '8n.');
            const velocity = Nexus.pick(0.2, 0.3, 0.5, 0.7, 1);

            rShortSynth.triggerAttackRelease(percNote, durations, '@2n', velocity);
          }
        } else if (part === 'drone' && data.beat % 20 === 0) {
          console.log('got to drone ');
          const durations = Nexus.pick('1m', '1n', '2m');
          const velocity = Nexus.pick(0.2, 0.3, 0.5, 0.7, 1);

          duoSynth.triggerAttackRelease(droneNotes.next(), durations, '@2n', velocity);
        }
        Tone.Transport.bpm.value = data.bpm;
      }
    });

    // update actions with deviceOrientation
    tilt.on('change', (v) => {
      // console.log(v);

      if (v.z > 0.25 && v.z < 0.5) {
        choosePattern = 1;
        percNote = Nexus.note(0);
        droneNotes.mode = 'up';
      } else if (v.z > 0.5 && v.z < 0.75) {
        choosePattern = 2;
        percNote = Nexus.note(3);
        droneNotes.mode = 'down';
      } else if (v.z > 0.75 && v.z < 1) {
        choosePattern = 3;
        percNote = Nexus.note(5);
        droneNotes.mode = 'drunk';
      } else if (v.z > 0.0 && v.z < 0.25) {
        percNote = Nexus.note(7);
        droneNotes.mode = 'random';
        choosePattern = 0;
      }
    });
  }

  setupEvents () {
    this.chatInput.addEventListener('keypress', (key) => {
      key = key.which || key.keyCode;

      if (key === 13) {
        this.sendChat(sanitizeString(this.chatInput.value));
        this.chatInput.value = '';
      }
    });

    this.chatInput.addEventListener('keyup', (key) => {
      const synth = new Tone.Synth().toMaster();
      key = key.which || key.keyCode;
      if (key === 27) {
        synth.triggerAttackRelease('a4');
        this.chatInput.value = '';
      }
    });

    this.btn.onclick = () => {
      this.socket.emit('start', 'hi');
      console.log('clicked');
    };
  }

  sendChat (text) {
    if (text) {
      if (text.indexOf('/') === 0) {
        let args = text.substring(1).split(' ');

        if (this.commands[args[0]]) {
          this.commands[args[0]].callback(args.slice(1));
        } else {
          this.addSystemLine('Unrecognized Command: ' + text + ', type /help for more info.');
        }
      } else {
        this.socket.emit('userChat', {nick: this.nick, message: text});
        this.addChatLine(this.nick, text, true);
      }
    }
  }

  addChatLine (name, message, me) {
    let newline = document.createElement('li');

    newline.className = (me) ? 'me' : 'friend';
    newline.innerHTML = '<b>' + ((name.length < 1) ? 'Anon' : name) + '</b>: ' + message;

    this.appendMessage(newline);
  }

  addSystemLine (message) {
    let newline = document.createElement('li');

    newline.className = 'system';
    newline.innerHTML = message;

    this.appendMessage(newline);
  }

  appendMessage (node) {
    if (this.chatList.childNodes.length > 10) {
      this.chatList.removeChild(this.chatList.childNodes[0]);
    }
    this.chatList.appendChild(node);
  }

  registerCommand (name, description, callback) {
    this.commands[name] = {
      description: description,
      callback: callback
    };
  }

  printHelp () {
    for (let cmd in this.commands) {
      if (this.commands.hasOwnProperty(cmd)) {
        this.addSystemLine('/' + cmd + ': ' + this.commands[cmd].description);
      }
    }
  }

  checkLatency () {
    this.startPingTime = Date.now();
    this.socket.emit('ding');
  }
}
