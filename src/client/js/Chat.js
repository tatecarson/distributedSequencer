import io from 'socket.io-client';
import Nexus from 'nexusui';
import {sanitizeString} from '../../shared/util';
import MakeSynth from './MakeSynth';
import Tone from 'Tone/core/Tone';
import Synth from 'Tone/instrument/Synth';
import AMSynth from 'Tone/instrument/AMSynth';
import FMSynth from 'Tone/instrument/FMSynth';
import Transport from 'Tone/core/Transport';

export default class Chat {
  constructor (nick) {
    this.chatInput = document.getElementById('chatInput');
    this.chatList = document.getElementById('chatList');
    this.btn = document.getElementById('startTransport');

    this.nick = nick;
    this.socket = io({query: 'nick=' + nick});
    this.commands = {};

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
    
    const bsynth = new Tone.Synth().toMaster();
    const amSynth = new Tone.AMSynth().toMaster();
    const fmSynth = new Tone.FMSynth().toMaster();

    const synth = new MakeSynth();
    const players = 4;
    const patterns = [];
    // for (let i = 0; i < players; i++) {
    //   patterns[i] = synth.createPattern(Nexus.ri(1, 8), Nexus.ri(9, 24));
    // }
    patterns[0] = synth.createPattern(Nexus.ri(1, 8), Nexus.ri(9, 24));
    // patterns[1] = synth.createPattern(5, 16);
    // patterns[2] = synth.createPattern(3, 7);
    this.socket.on('beat', function (data) {
      
      // if the transport is running play a note each trigger
      if (Tone.Transport.state === 'started') {
        // play if pattern is a 1
        if (patterns[0].next()) {
          bsynth.triggerAttackRelease(Nexus.note(0), '8n', '@2n');
        }
        // if (patterns[1].next()) {
        //   amSynth.triggerAttackRelease(Nexus.note(1, 1), '16n', '@2n');
        // }
        // if (patterns[2].next()) {
        //   fmSynth.triggerAttackRelease(Nexus.note(7, -1), '8n', '@2n');
        // }
        Tone.Transport.bpm.value = data.bpm;
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
