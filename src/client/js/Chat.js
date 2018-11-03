import io from 'socket.io-client';
import Nexus from 'nexusui';
import MakeSynth from './MakeSynth';
// import UnmuteButton from 'unmute';
import Tone from 'Tone/core/Tone';
import CtrlPattern from 'Tone/control/CtrlPattern';
import kompas from 'kompas';
import StartAudioContext from 'startaudiocontext';
export default class Chat {
  constructor (nick) {
    this.socket = io({ query: 'nick=' + nick });

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
    let part = 'shortSynth'; // starting part

    // setup synths
    const synth = new MakeSynth();
    const fmSynth = synth.FM().instrument;
    // const coolFM = synth.coolFM().instrument;
    // const rShortSynth = Nexus.pick(fmSynth, coolFM);
    // const duoSynth = synth.duo().instrument; // for drones

    const verb = new Tone.Freeverb({
      roomSize: 0.5,
      dampening: 1200,
      wet: 0.5
    }).toMaster();
    const laDrone = new Tone.Player('../samples/burps/lalala_311.mp3').connect(verb);
    let droneDur;
    Tone.Buffer.on('load', () => {
      droneDur = laDrone._buffer._buffer.duration;
      console.log(`drone duration: ${droneDur}`);
    });
    // store patterns
    const patterns = [];
    let patternIndex = 0;

    // handle deviceorientation
    const tilt = new Nexus.Tilt('#tilt');
    const transportToggle = new Nexus.Toggle('#startTransport');

    // setup notes
    let percussionNote = Nexus.note(0);
    const droneNotes = new Tone.CtrlPattern([
      Nexus.tune.ratio(9 - 1),
      Nexus.tune.ratio(11 - 1),
      Nexus.tune.ratio(1 - 1),
      Nexus.tune.ratio(6 - 1),
      Nexus.tune.ratio(7 - 1)
    ], 'up');

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
    });
    this.socket.on('stop', () => {
      Tone.Transport.stop();
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
      // set to drone for testing
      // part = 'drone';
      let droneLength = patterns[patternIndex % totalUsers].values.length;
      console.log(`drone length: ${droneLength}`);
      // if the transport is running play a note each trigger
      if (Tone.Transport.state === 'started') {
        if (part === 'shortSynth') {
          console.log('got to short synth ');

          if (patterns[patternIndex % totalUsers].next()) {
            const durations = Nexus.pick('8n', '16n', '8n.');
            const velocity = Nexus.pick(0.2, 0.3, 0.5, 0.7, 1);

            // TODO: add envelope from drone to percussionNote
            fmSynth.triggerAttackRelease(
              percussionNote,
              durations,
              '@2n',
              velocity
            );
          }
        } else if (part === 'drone' && data.beat % droneLength === 0) {
          console.log('got to drone ');
          console.log(`beat: ${data.beat} drone length: ${droneLength}`);
          const durations = Nexus.pick('1m', '1m', '2m', '3m');
          const velocity = Nexus.pick(0.2, 0.3, 0.5, 0.7, 0); // sometimes doesn't play
          const offsets = Nexus.pick(0, 5, 10, 15);
          // console.log(`drone length: ${data.beat % droneLength}, durations: ${durations}`);
          // TODO: fix part so that it sounds better on phones - still lots of crackling
          // duoSynth.triggerAttackRelease(
          //   droneNotes.next(),
          //   durations,
          //   '@2n',
          //   velocity
          // );
          laDrone.playbackRate = droneNotes.next();
          laDrone.volume.rampTo(velocity, Nexus.rf(1, 3));
          laDrone.fadeIn = Tone.Time(durations).toSeconds() / 2;
          laDrone.fadeOut = Tone.Time(durations).toSeconds() / 3;
          laDrone.start('@2n', offsets, durations);
          // laDrone.volume.setValueCurveAtTime([-60, -15, -30], '@2n', durations);
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
      // console.log(v);
      // TODO: change to 8 positions
      // add - upDown, downUp, alternateUp, randomOnce
      if (v.z > 0.0 && v.z < 0.25) {
        percussionNote = Nexus.note(7);
        patternIndex = 0;

        droneNotes.mode = 'up';
        // laDrone.seek(0);
      } else if (v.z > 0.25 && v.z < 0.5) {
        patternIndex = 1;
        percussionNote = Nexus.note(0);
        droneNotes.mode = 'down';
      } else if (v.z > 0.5 && v.z < 0.75) {
        patternIndex = 2;
        percussionNote = Nexus.note(3);

        droneNotes.mode = 'random';
      } else if (v.z > 0.75 && v.z < 1) {
        patternIndex = 3;
        percussionNote = Nexus.note(5);
        droneNotes.mode = 'randomWalk';
      }
    });
    // Get compass data
    kompas()
      .watch()
      .on('heading', h => {
        // console.log(`heading: ${h}`);
        document.getElementById(
          'rSynthText'
        ).innerHTML = `this is the heading: ${h}`;
        // heading = h;
        const data = {
          heading: h,
          id: this.socket.id
        };
        this.socket.emit('heading', data);
      });

    this.socket.on('heading', data => {
      const phones = Object.keys(data);
      // console.log(phones[1]);
      // console.log(JSON.stringify(data));
    });
  }
}
