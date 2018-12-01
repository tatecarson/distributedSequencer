import io from 'socket.io-client';
import Nexus from 'nexusui';
import MakeSynth from './MakeSynth';
import Tone from 'Tone/core/Tone';
import Part from 'Tone/event/Part';
import Pattern from 'Tone/event/Pattern';
import kompas from 'kompas';
import StartAudioContext from 'startaudiocontext';
import mobileConsole from 'js-mobile-console';
import interpolate from 'color-interpolate';
import animation from './animation';
import { numberToNotes, merge } from './soundUtil';

// mobile console.log
mobileConsole.show();
export default class Chat {
  constructor (nick) {
    this.nick = nick;

    this.socket = io({ query: 'nick=' + nick });

    this.setupSocket();
    this.setupSynth();

    // if given name send start immediately

    this.socket.emit('start', 'hi');

    // then remove loading screen
    document.getElementById('myNav').style.width = '0%';
    document.getElementById('welcome').innerHTML = `
        Welcome ${this.nick}
      `;

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
        this.socket.emit('heading', h);
      });

    // setup notes
    let percussionNote = Nexus.note(0);
    const droneNotes = new Nexus.Sequence([
      Nexus.tune.ratio(9), // B
      Nexus.tune.ratio(11), // Db
      Nexus.tune.ratio(1), // Eb
      Nexus.tune.ratio(6), // Ab
      Nexus.tune.ratio(7) // A
    ]);

    StartAudioContext(Tone.context, '.start-audio').then(function () {
      // started
      console.log('started');
    });

    Tone.context.latencyHint = 'playback';

    // receive data from server
    //
    // start transport at the same time on all devices
    // stop first if already running
    this.socket.on('start', () => {
      Tone.Transport.stop().start();
      bowedGlass.mute = false;
    });

    this.socket.on('stop', () => {
      Tone.Transport.stop();

      bowedGlass.mute = true;
    });

    this.socket.on('getParts', data => {
      part = data;
    });

    this.socket.on('getTotalUsers', (total, users) => {
      totalUsers = total;
      userList = users;
      for (let i = 0; i < totalUsers; i++) {
        patterns[i] = synth.createPattern(Nexus.ri(1, 8), Nexus.ri(9, 24));
      }
      console.log(`total users: ${totalUsers}, user list: ${userList}`);
    });

    // /* mute this for now
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
    // */

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
        percussionNote = Nexus.tune.ratio(7);
        patternIndex = 0;

        droneNotes.mode = 'up';
        drone = laDrone;
      } else if (v.z > 0.25 && v.z < 0.5) {
        // fm
        patternIndex = 1;
        percussionNote = Nexus.tune.ratio(0);

        droneNotes.mode = 'down';
        drone = laDrone;
      } else if (v.z > 0.5 && v.z < 0.75) {
        // fm
        patternIndex = 2;
        percussionNote = Nexus.tune.ratio(3);

        droneNotes.mode = 'drunk';
        drone = laDrone2;
      } else if (v.z > 0.75 && v.z < 1) {
        // fm
        patternIndex = 3;
        percussionNote = Nexus.tune.ratio(5);

        droneNotes.mode = 'random';
        drone = laDrone2;
      }
      this.bgAnimate(v.z);
    });

    // got a match
    // do things on client
    this.socket.on('headingMatch', (matchID, matchName, matchingNotes, myNotes, myId) => {
      document.getElementById('heading-match').style.width = '100%';

      document.getElementById('match-name').innerHTML = `
      <p class="f2">
        you match with: ${matchName}
      </p>`;

      const notesEl = document.getElementById('select-notes');

      // first clear list
      while (notesEl.hasChildNodes()) {
        notesEl.removeChild(notesEl.firstChild);
      }

      // add notes to dropdown
      // FIXME: this should not come up when you're getting a note stolen
      numberToNotes(matchingNotes).forEach(note => {
        const option = document.createElement('option');
        option.text = note;
        notesEl.add(option);
      });
      document.getElementById('match-note').innerHTML = `
            <p class="f2">
              their note list: ${numberToNotes(matchingNotes)}
              would you like to add one of their notes to your note bank?
            </p>
            <button type="button" id="take-note">Take Note</button>
            <p>
              you currently have these notes: ${numberToNotes(myNotes)}
            </p>
            `;

      const bowedRhythmPattern = new Tone.CtrlPattern(['8n', '8n', '16n', '8n.'], 'randomWalk');
      const bowedNotePattern = new Tone.CtrlPattern(myNotes, 'randomWalk');
      const part = merge(bowedRhythmPattern.values, bowedNotePattern.values);
      console.log(`the part: ${JSON.stringify(part)}`);
      // FIXME: still not really working correctly, not playing all notes in array
      var pattern = new Tone.Part((time, value) => {
        // play if pattern is a 1
        // console.log(`on or off: ${bowedRhythmPattern.next()}`);
        console.log(`note: ${value.note}, dur: ${value.dur}, time: ${value.time}`);
        bowedGlass.playbackRate = Nexus.tune.ratio(value.note);
        bowedGlass.start();
      }, part).stop().start();

      // pattern.iterations = 10;
      // pattern.interval = '16n';
      // they're giving you their note
      document.getElementById('take-note').addEventListener('click', () => {
        this.socket.emit('give', matchID, notesEl.selectedIndex);
        document.getElementById('take-note').disabled = true; // only allow one button press
      });
    });

    this.socket.on('steal', (stealer, notes) => {
      document.getElementById('heading-match').style.width = '100%';
      document.getElementById('match-note').innerHTML = `
  
      <p class="f2">
        You just shared your note with ${stealer}.
        You still have these notes: ${numberToNotes(notes)}.
      </p>`;

      // bowedGlass.playbackRate = Nexus.tune.ratio(notes[Math.floor(Math.random() * notes.length)]);
      // bowedGlass.start();
    });
  }

  bgAnimate (h) {
    let heading = h.toFixed(3);
    let colormap = interpolate(['#FE4365', '#FC9D9A', '#F9CDAD', '#FE4365', '#FC9D9A', '#F9CDAD', '#FE4365']);
    // let colormap = interpolate(['#FE4365', '#FC9D9A', '#F9CDAD', '#FE4365']);
    const position = document.querySelector('#d');
    const hitColor = '#C8C8A9';
    document.querySelector('body').style.background = colormap(heading);
    if (heading > 0.000 && heading < 0.009) {
      position.innerHTML = `<p>
      Position 1
      </p>`;
      document.querySelector('body').style.background = hitColor;
    } else if (heading > 0.250 && heading < 0.260) {
      position.innerHTML = `<p>
      Position 2
      </p>`;
      document.querySelector('body').style.background = hitColor;
    } else if (heading > 0.500 && heading < 0.510) {
      position.innerHTML = `<p>
      Position 3
      </p>`;
      document.querySelector('body').style.background = hitColor;
    } else if (heading > 0.750 && heading < 0.760) {
      position.innerHTML = `<p>
      Position 4
      </p>`;
      document.querySelector('body').style.background = hitColor;
    }
  }
}
