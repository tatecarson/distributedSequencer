import io from 'socket.io-client';
import Nexus from 'nexusui';
import MakeSynth from './MakeSynth';
import Tone from 'Tone/core/Tone';
import kompas from 'kompas';
import StartAudioContext from 'startaudiocontext';
import mobileConsole from 'js-mobile-console';
import interpolate from 'color-interpolate';

// mobile console.log
// mobileConsole.show();
export default class Chat {
  constructor (nick) {
    this.socket = io({ query: 'nick=' + nick });
    this.position = document.getElementById('d');
    console.log(this.position);
    this.setupSocket();
    this.setupSynth();
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
    // const fmSynth = synth.FM().instrument;
    const perc1 = new Tone.Player('../samples/perc/perc_1.mp3').connect(verb);
    const perc2 = new Tone.Player('../samples/perc/perc_2.mp3').connect(verb);

    const mallet1 = new Tone.Player('../samples/perc/kalimba.mp3').connect(verb);
    // const hackFM = synth.hackFM().connect(verb);
    // fmSynth.chain(comp, verb);

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
    const transportToggle = new Nexus.Toggle('#startTransport');

    // Get compass data
    let heading;
    kompas()
      .watch()
      .on('heading', h => {
        heading = h;
        this.socket.emit('heading', h);
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

    const headingNotes = [
      Nexus.tune.ratio(10 - step), // C
      Nexus.tune.ratio(12 - step), // D
      Nexus.tune.ratio(2 - step), // E
      Nexus.tune.ratio(8 - step), // Bb
      Nexus.tune.ratio(4 - step), // Gb
      Nexus.tune.ratio(3 - step) // F
    ];

    StartAudioContext(Tone.context, '.remove-overlay').then(function () {
      // started
      console.log('started');
    });
    Tone.context.latencyHint = 'playback';

    // receive data from server
    //
    // start transport at the same time on all devices
    this.socket.on('start', () => {
      Tone.Transport.start();
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
      // part = 'drone';
      let droneLength = patterns[patternIndex % totalUsers].values.length;
      // console.log(`drone length: ${droneLength}`);
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
          console.log(`fade in: ${drone.fadeIn}, fade out: ${drone.fadeOut}, total duration: ${durations}`);
          drone.start('@2n', offsets, durations);
        }
        Tone.Transport.bpm.value = data.bpm;
      }
    });

    // Nexus UI elements - do stuff that affects your sound and sends data to other clients
    transportToggle.on('change', v => {
      if (v) {
        Tone.Transport.start();
        this.socket.emit('start', 'hi');
      } else {
        Tone.Transport.stop();
        this.socket.emit('stop', 'please stop');
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

    this.socket.on('heading', data => {
      for (let i = 0; i < data.length; i++) {
        if ((Math.abs(heading - data[i].heading) > 160 && Math.abs(heading - data[i].heading) < 200)) {
          // console.log(`heading: ${heading}`);
          // console.log(`i match with: ${data[i].id} at heading: ${data[i].heading}, my heading is: ${heading}`);
          if (Tone.now() > timeToResume) {
            console.log('reached heading flag, should only happen once');

            timeToResume = Tone.now() + 3;
            // TODO: which ever phone got on the network earliest sends the message
            // look at userList and see if socket.id or data[i].id comes first
            // which ever comes first sends the message
            // FIXME: userList is an object
            // let myIndex = userList.id.findIndex(x => x === data[i].id);
            // console.log(`myindex: ${myIndex}`);
            this.socket.emit('headingMatch', data[i].id);
          }
        }
      }
    });

    this.socket.on('headingMatch', index => {
      console.log(`playing pitch ${index}`);
      bowedGlass.playbackRate = headingNotes[Math.floor(Math.random() * headingNotes.length)];
      bowedGlass.start();
    });
  }

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
