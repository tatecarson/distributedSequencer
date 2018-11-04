import io from 'socket.io-client';
import Nexus from 'nexusui';
import MakeSynth from './MakeSynth';
import Tone from 'Tone/core/Tone';
import CtrlPattern from 'Tone/control/CtrlPattern';
import kompas from 'kompas';
import StartAudioContext from 'startaudiocontext';
import mobileConsole from 'js-mobile-console';

mobileConsole.show();
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
    let part = 'drone'; // starting part

    // setup synths
    const synth = new MakeSynth();
    const fmSynth = synth.FM().instrument;
    const fmFeedbackDelay = synth.FM().effect2;
    console.log(fmFeedbackDelay);
    // const coolFM = synth.coolFM().instrument;
    // const rShortSynth = Nexus.pick(fmSynth, coolFM);
    // const duoSynth = synth.duo().instrument; // for drones

    const verb = new Tone.Freeverb({
      roomSize: 0.5,
      dampening: 1200,
      wet: 0.5
    }).toMaster();
    // TODO: add more drone samples
    const laDrone = new Tone.Player('../samples/burps/lalala_311.mp3').connect(verb);
    const laDrone2 = new Tone.Player('../samples/burps/lalala2_311.mp3').connect(verb);
    let drone = laDrone;

    const breath = new Tone.Player('../samples/burps/breath_1_var.mp3').connect(verb);
    // store patterns
    const patterns = [];
    let patternIndex = 0;

    // handle deviceorientation
    const tilt = new Nexus.Tilt('#tilt');
    const transportToggle = new Nexus.Toggle('#startTransport');

    // setup notes
    let percussionNote = Nexus.note(0);
    const droneNotes = new Nexus.Sequence([
      Nexus.tune.ratio(9 - 1),
      Nexus.tune.ratio(11 - 1),
      Nexus.tune.ratio(1 - 1),
      Nexus.tune.ratio(6 - 1),
      Nexus.tune.ratio(7 - 1)
    ]);

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
      // console.log(`drone length: ${droneLength}`);
      // if the transport is running play a note each trigger
      if (Tone.Transport.state === 'started') {
        if (part === 'shortSynth') {
          console.log('got to short synth ');

          if (patterns[patternIndex % totalUsers].next()) {
            const durations = Nexus.pick('8n', '16n', '8n.');
            const velocity = Nexus.pick(0.2, 0.3, 0.5, 0.7, 1);

            fmSynth.triggerAttackRelease(
              percussionNote,
              durations,
              '@2n',
              velocity
            );
          }
        } else if (part === 'drone' && data.beat % droneLength === 0) {
          console.log('got to drone ');

          const durations = Nexus.pick('1m', '1m', '2m', '3m');
          const velocity = Nexus.pick(0.2, 0.3, 0.5, 0.7, 0); // sometimes doesn't play
          const offsets = Nexus.pick(0, 5, 10, 15);

          drone.playbackRate = droneNotes.next();
          drone.volume.rampTo(velocity, Nexus.rf(1, 3));
          drone.fadeIn = Tone.Time(durations).toSeconds() / 2;
          drone.fadeOut = Tone.Time(durations).toSeconds() / 3;
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
      // console.log(v);
      // TODO: check that these types are woring
      // console.log(`type: ${droneNotes.type}, notes: ${droneNotes.values}`);
      if (v.z > 0.0 && v.z < 0.25) {
        // fm
        // console.log('position 1');
        percussionNote = Nexus.note(7);
        patternIndex = 0;
        fmFeedbackDelay.wet.rampTo(0.4, 1);
        fmFeedbackDelay.feedback.rampTo(0.2, 1);
        fmFeedbackDelay.delayTime.rampTo('8n', 2);

        droneNotes.mode = 'up';
        drone = laDrone;
      } else if (v.z > 0.25 && v.z < 0.5) {
        // fm
        // console.log('position 2');
        patternIndex = 1;
        percussionNote = Nexus.note(0);
        fmFeedbackDelay.wet.rampTo(0.5, 1);
        fmFeedbackDelay.feedback.rampTo(0.3, 1);
        fmFeedbackDelay.delayTime.rampTo('32n', 2);

        droneNotes.mode = 'down';
        drone = laDrone;
      } else if (v.z > 0.5 && v.z < 0.75) {
        // console.log('position 3');
        // fm
        patternIndex = 2;
        percussionNote = Nexus.note(3);
        fmFeedbackDelay.wet.rampTo(0.6, 1);
        fmFeedbackDelay.feedback.rampTo(0, 1);
        fmFeedbackDelay.delayTime.rampTo('4n', 2);

        droneNotes.mode = 'drunk';
        drone = laDrone2;
      } else if (v.z > 0.75 && v.z < 1) {
        // console.log('position 4');
        // fm
        patternIndex = 3;
        percussionNote = Nexus.note(5);
        fmFeedbackDelay.wet.rampTo(0, 1);
        fmFeedbackDelay.feedback.rampTo(0.1, 1);
        fmFeedbackDelay.delayTime.rampTo('8n.', 2);
        fmFeedbackDelay.delayTime.rampTo('2n.', 2);

        droneNotes.mode = 'random';
        drone = laDrone2;
      }
    });
    // Get compass data
    let heading;
    kompas()
      .watch()
      .on('heading', h => {
        // console.log(`heading: ${h}`);
        document.getElementById(
          'rSynthText'
        ).innerHTML = `
        <p>my id is: ${this.socket.id}</p>
        <p>
          this is the heading: ${h}
        </p>`;
        heading = h;
        const data = {
          heading: h,
          id: this.socket.id
        };
        this.socket.emit('heading', h);
      });

    this.socket.on('heading', data => {
      // console.table(data);
      let flag = true;
      for (let i = 0; i < data.length; i++) {
        // TODO: only matching with one other client at a time
        if ((Math.abs(heading - data[i].heading) > 150) && (Math.abs(heading - data[i].heading)) < 210) {
          console.log(`i match with: ${data[i].id}`);
          // print to the DOM here to see headings away from magnets
          // TODO: switch all of these documents to console.logs
          const h = document.querySelector('#heading');
          h.innerHTML = `<p>
          i match with: ${data[i].id} at heading: ${data[i].heading}
          </p>`;

          // 2. emit to the matching id to play a sound
          // TODO: play sound on first device
          // TODO: setup boolean flag so that the sound only happens the first time we see matching headings

          let index = 0;
          if (flag) {
            flag = false;
            index++;
            const flagLog = document.querySelector('#headingMatch');
            flagLog.innerHTML = `<p>
              reading heading flag ${index}x
            </p>`;
            // fmSynth.triggerAttackRelease('c4', '8n');
            breath.start();
            console.log('reached heading flag, should only happen once');
          } else {
            index = 0;
          }
          // TODO: emit to matching id and play sound on that device
        } else {
          const h = document.querySelector('#heading');
          h.innerHTML = `<p>
           looking for a match
          </p>`;
          flag = true;
        }
      }
      console.log(flag);
    });
  }
}
