import io from 'socket.io-client';
import Nexus from 'nexusui';
import MakeSynth from './MakeSynth';
import Tone from 'Tone/core/Tone';
import kompas from 'kompas';
import StartAudioContext from 'startaudiocontext';
import mobileConsole from 'js-mobile-console';
import interpolate from 'color-interpolate';
import animation from './animation';

// mobile console.log
mobileConsole.show();
export default class Chat {
  constructor (nick) {
    this.nick = nick;
    this.socket = io({ query: 'nick=' + nick });

    this.setupSocket();
    this.setupSynth();

    animation();
  }

  setupSocket () {
    this.socket.on('connect_failed', () => {
      this.socket.close();
    });

    this.socket.on('disconnect', () => {
      this.socket.close();
    });
  }

  setupSynth () {
    let totalUsers = 0;
    let userList = null;
    let part = 'drone'; // starting part

    // setup synths
    const verb = new Tone.Freeverb().toMaster();

    const synth = new MakeSynth();

    // short sounds
    const perc1 = new Tone.Player('../samples/perc/perc_1.mp3').connect(verb);
    const perc2 = new Tone.Player('../samples/perc/perc_2.mp3').connect(verb);

    const mallet1 = new Tone.Player('../samples/perc/kalimba.mp3').connect(verb);

    const rShortSynth = Nexus.pick(perc1, perc2, mallet1);

    // drone sounds
    const laDrone = new Tone.Player('../samples/lalala_311.mp3').connect(verb);
    const laDrone2 = new Tone.Player('../samples/lalala2_311.mp3').connect(verb);
    let drone = laDrone; // pick between drones

    // heading match sound
    const bowedGlass = new Tone.Player('../samples/bowedGlass622.mp3').connect(verb);
    bowedGlass.mute = true; // to keep phones from playing until the transport starts

    // store patterns
    const patterns = [];
    let patternIndex = 0;

    // handle deviceorientation
    const tilt = new Nexus.Tilt('#tilt');
    const muteToggle = new Nexus.Toggle('#startTransport');
    muteToggle.state = true;

    // Get compass data
    let heading;
    kompas()
      .watch()
      .on('heading', h => {
        heading = h;
        this.socket.emit('heading', h, myHeadingNotes);
      });

    // setup notes
    const step = 1;
    let percussionNote = Nexus.note(0);
    const droneNotes = new Nexus.Sequence([
      Nexus.tune.ratio(9 - step), // B
      Nexus.tune.ratio(11 - step), // Db
      Nexus.tune.ratio(1 - step), // Eb
      Nexus.tune.ratio(6 - step), // Ab
      Nexus.tune.ratio(7 - step) // A
    ]);

    // possible notes to gather
    const headingNotes = [
      Nexus.tune.ratio(10 - step), // C
      Nexus.tune.ratio(12 - step), // D
      Nexus.tune.ratio(2 - step), // E
      Nexus.tune.ratio(8 - step), // Bb
      Nexus.tune.ratio(4 - step), // Gb
      Nexus.tune.ratio(3 - step) // F
    ];

    // starting off note
    let myHeadingNotes = [headingNotes[Math.floor(Math.random() * headingNotes.length)]];

    StartAudioContext(Tone.context, '.remove-overlay').then(function () {
      // started
      console.log('started');
    });

    document.getElementById('restart').addEventListener('click', () => {
      this.socket.emit('start', 'hi');
      document.getElementById('myNav').style.width = '0%';
      document.getElementById('welcome').innerHTML = `
        Welcome ${this.nick}
      `;
    });
    Tone.context.latencyHint = 'playback';

    // receive data from server
    //
    // start transport at the same time on all devices
    // stop first if already running
    this.socket.on('start', () => {
      Tone.Transport.stop().start();
      console.log(`Transport state: ${Tone.Transport.state}, restarted?`);
      bowedGlass.mute = false;
    });

    this.socket.on('stop', () => {
      Tone.Transport.stop();

      bowedGlass.mute = true;
    });

    this.socket.on('getParts', data => {
      part = data;

      console.log(part);
    });

    this.socket.on('getTotalUsers', (total, users) => {
      totalUsers = total;
      userList = users;
      for (let i = 0; i < totalUsers; i++) {
        patterns[i] = synth.createPattern(Nexus.ri(1, 8), Nexus.ri(9, 24));
      }
      console.log(`total users: ${totalUsers}, user list: ${userList}`);
    });

    this.socket.on('beat', function (data) {
      // set to drone for testing
      // part = 'shortSynth';
      let droneLength = patterns[patternIndex % totalUsers].values.length;

      // if the transport is running play a note each trigger
      if (Tone.Transport.state === 'started') {
        if (part === 'shortSynth') {
          if (patterns[patternIndex % totalUsers].next()) {
            const durations = Nexus.pick('8n', '16n', '8n.');
            const velocity = Nexus.pick(0.2, 0.3, 0.5, 0.7, 1);

            rShortSynth.playbackRate = percussionNote * 2;
            rShortSynth.volume.value = Tone.gainToDb(velocity);
            rShortSynth.start('@2n', 0, durations);
          }
        } else if (part === 'drone' && data.beat % droneLength === 0) {
          const durations = Nexus.pick('1m', '1m', '2m', '3m');
          const velocity = Nexus.pick(0.2, 0.3, 0.5, 0.7, 0); // sometimes doesn't play
          const offsets = Nexus.pick(0, 5, 10);

          drone.playbackRate = droneNotes.next();
          drone.volume.rampTo(velocity, Nexus.rf(1, 3));
          drone.fadeIn = Tone.Time(durations).toSeconds() / 2;
          drone.fadeOut = Tone.Time(durations).toSeconds() / 3;
          // console.log(`fade in: ${drone.fadeIn}, fade out: ${drone.fadeOut}, total duration: ${durations}`);
          drone.start('@2n', offsets, durations);
        }
        Tone.Transport.bpm.value = data.bpm;
      }
    });

    // Nexus UI elements - do stuff that affects your sound and sends data to other clients
    muteToggle.on('change', v => {
      if (v) {
        Tone.Master.mute = false;

        // restart everyone's transports if you log back on
        this.socket.emit('start', 'hi');
      } else {
        Tone.Transport.stop();
        Tone.Master.mute = true;
        // this.socket.emit('stop', 'please stop');
      }
    });

    // update actions with deviceOrientation
    tilt.on('change', v => {
      if (v.z > 0.0 && v.z < 0.25) {
        // fm
        // console.log('position 1');
        percussionNote = Nexus.tune.ratio(7);
        patternIndex = 0;

        droneNotes.mode = 'up';
        drone = laDrone;
      } else if (v.z > 0.25 && v.z < 0.5) {
        // fm
        // console.log('position 2');
        patternIndex = 1;
        percussionNote = Nexus.tune.ratio(0);

        droneNotes.mode = 'down';
        drone = laDrone;
      } else if (v.z > 0.5 && v.z < 0.75) {
        // console.log('position 3');
        // fm
        patternIndex = 2;
        percussionNote = Nexus.tune.ratio(3);

        droneNotes.mode = 'drunk';
        drone = laDrone2;
      } else if (v.z > 0.75 && v.z < 1) {
        // console.log('position 4');
        // fm
        patternIndex = 3;
        percussionNote = Nexus.tune.ratio(5);

        droneNotes.mode = 'random';
        drone = laDrone2;
      }
      this.bgAnimate(v.z);
    });

    let timeToResume = 0;

    // checking for a match
    // send to server

    // TODO: move this to the serverside so you can check them all at once
    this.socket.on('heading', data => {
      for (let i = 0; i < data.length; i++) {
        if ((Math.abs(heading - data[i].heading) > 160 && Math.abs(heading - data[i].heading) < 200)) {
          if (Tone.now() > timeToResume) {
            // check every 3 seconds
            timeToResume = Tone.now() + 3;

            // TODO: instead of sending percussion note, send the note you play when the headings match
            // a player can collect those notes so a certain melody plays when they match someone
            // the player can choose to take the note or not if the coin flip is in their favor
            // figure out another system of game play later to decide who gets to take the note

            this.socket.emit('headingMatch', data[i].id, myHeadingNotes, Math.floor(Math.random() * 2));
          }

          // match modal
          document.getElementById('match-name').innerHTML = `
            <p class="f2">
              you match with: ${data[i].nick}
            </p>`;
        }
      }
    });

    // got a match
    // do things on client
    this.socket.on('headingMatch', (user, matchingNotes, coin) => {
      console.log(user, matchingNotes, coin);
      // if coin is true client has the option of taking notes
      // console.log(`matchingNotes: ${matchingNotes}`);

      // if you are out of notes, nothing happens
      if (myHeadingNotes.length === 0) {
        document.getElementById('match-note').innerHTML = ` 
        <p class="f2">
          i'm sorry, you are out of notes. Match with another player to get a note to play. 
        </p>`;
      } else {
        // FIXME: this element should sometimes not pop up, why is it always happening?
        // always play a note, but if coin is true give ability to steal note
        // matchingNotes = 'noTrade';
        if (coin === 0) {
          console.log('trade');
          document.getElementById('match-note').innerHTML = ` 
            <p>
              coin is ${coin}
            </p>
            <p class="f2">
              they're playing ${matchingNotes}. 
              would you like to add one of their notes to your note bank?
            </p>`;
        }
        // myHeadingNotes is currently available notes to play
        bowedGlass.playbackRate = myHeadingNotes[Math.floor(Math.random() * myHeadingNotes.length)];
        bowedGlass.start();
      }

      document.getElementById('heading-match').style.width = '100%';
    });
  }

  // TODO: i think this function can actually go in a separate file
  bgAnimate (heading) {
    let colormap = interpolate(['#FE4365', '#FC9D9A', '#F9CDAD', '#C8C8A9', '#83AF9B', '#FE4365', '#FC9D9A', '#F9CDAD']);
    document.querySelector('body').style.background = colormap(heading);
    const position = document.querySelector('#d');

    if (heading > 0.0 && heading < 0.25) {
      position.innerHTML = `<p>
        Position 1
      </p>`;
    } else if (heading > 0.25 && heading < 0.5) {
      position.innerHTML = `<p>
      Position 2
    </p>`;
    } else if (heading > 0.5 && heading < 0.75) {
      position.innerHTML = `<p>
      Position 3
    </p>`;
    } else if (heading > 0.75 && heading < 1) {
      position.innerHTML = `<p>
      Position 4
    </p>`;
    }
  }
}
