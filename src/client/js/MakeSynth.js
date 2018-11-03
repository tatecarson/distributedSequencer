import Nexus from 'nexusui';
import euclideanRhythms from 'euclidean-rhythms';
import Tone from 'Tone/core/Tone';
import { FMSynth } from 'Tone/instrument/FMSynth';
import { DuoSynth } from 'Tone/instrument/DuoSynth';
import { Player } from 'Tone/source/Player';
import { Chebyshev } from 'Tone/effect/Chebyshev';
import { FeedbackDelay } from 'Tone/effect/FeedbackDelay';
import { Freeverb } from 'Tone/effect/Freeverb';
import { PitchShift } from 'Tone/effect/PitchShift';
import { BitCrusher } from 'Tone/effect/BitCrusher';
export default class MakeSynth {
  constructor () {
    // from the well-tuned piano - https://en.wikipedia.org/wiki/The_Well-Tuned_Piano
    Nexus.tune.createJIScale(1 / 1, 567 / 512, 9 / 8, 147 / 148, 21 / 16, 1323 / 1024, 189 / 128, 3 / 2, 49 / 32, 7 / 4, 441 / 256, 2 / 1);
    Nexus.tune.root = 311.127; // eb4
  }

  createPattern (m = 7, k = 13) {
    const pattern = euclideanRhythms.getPattern(m, k);
    const seq = new Nexus.Sequence(pattern);
    return seq;
  }

  sampler (sample) {
    const instrument = new Tone.Player(sample);
    instrument.toMaster();
    return instrument;
  }
  FM () {
    // create synthz
    var instrument = new Tone.FMSynth();
    var synthJSON = {
      harmonicity: 8,
      modulationIndex: 2,
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.001,
        decay: 2,
        sustain: 0.1,
        release: 2
      },
      modulation: {
        type: 'square'
      },
      modulationEnvelope: {
        attack: 0.002,
        decay: 0.2,
        sustain: 0,
        release: 0.2
      }
    };

    instrument.set(synthJSON);

    var effect1, effect2, effect3;

    // create effects
    effect1 = new Tone.Chebyshev();
    var effect1JSON = {
      order: 108,
      wet: 0.5
    };
    effect1.set(effect1JSON);

    effect2 = new Tone.FeedbackDelay();
    var effect2JSON = {
      delayTime: '8n',
      feedback: 0.2,
      wet: 0.4
    };
    effect2.set(effect2JSON);

    // make connections
    instrument.connect(effect1);
    effect1.connect(effect2);
    effect2.connect(Tone.Master);

    // define deep dispose function
    function deep_dispose () {
      if (effect1 != undefined && effect1 != null) {
        effect1.dispose();
        effect1 = null;
      }
      if (effect2 != undefined && effect2 != null) {
        effect2.dispose();
        effect2 = null;
      }
      if (effect3 != undefined && effect3 != null) {
        effect3.dispose();
        effect3 = null;
      }
      if (instrument != undefined && instrument != null) {
        instrument.dispose();
        instrument = null;
      }
    }

    return {
      instrument: instrument,
      effect2: effect2,
      deep_dispose: deep_dispose
    };
  }

  duo () {
    // create synth
    var instrument = new Tone.DuoSynth();
    var synthJSON = {
      vibratoAmount: 0.5,
      vibratoRate: 5,
      harmonicity: 1.5,
      voice0: {
        volume: -10,
        portamento: 0,
        oscillator: {
          type: 'sine'
        },
        filterEnvelope: {
          attack: 0.01,
          decay: 0,
          sustain: 1,
          release: 0.5
        },
        envelope: {
          attack: 0.01,
          decay: 0,
          sustain: 1,
          release: 0.5
        }
      },
      voice1: {
        volume: -20,
        portamento: 0,
        oscillator: {
          type: 'sine'
        },
        filterEnvelope: {
          attack: 0.01,
          decay: 0,
          sustain: 1,
          release: 0.5
        },
        envelope: {
          attack: 0.1,
          decay: 0,
          sustain: 1,
          release: 0.5
        }
      }
    };

    instrument.set(synthJSON);

    // create effects
    var effect1 = new Tone.PitchShift();
    const effect1JSON = {
      pitch: 2,
      windowSize: 0.04,
      delayTime: 0.03,
      feedback: 0.5,
      wet: 0.5
    };
    effect1.set(effect1JSON);

    var effect2 = new Tone.Freeverb();
    const effect2JSON = {
      roomSize: 0.95,
      dampening: 1200,
      wet: 0.5
    };
    effect2.set(effect2JSON);

    // make connections
    // instrument.toMaster();
    instrument.connect(effect1);
    effect1.connect(effect2);
    effect2.chain(Tone.Master);

    // define deep dispose function
    function deep_dispose () {
      if (effect1 != undefined && effect1 != null) {
        effect1.dispose();
        effect1 = null;
      }
      if (effect2 != undefined && effect2 != null) {
        effect2.dispose();
        effect2 = null;
      }
      if (effect3 != undefined && effect3 != null) {
        effect3.dispose();
        effect3 = null;
      }
      if (instrument != undefined && instrument != null) {
        instrument.dispose();
        instrument = null;
      }
    }

    return {
      instrument: instrument,
      deep_dispose: deep_dispose
    };
  }

  coolFM () {
    // create synth
    var instrument = new Tone.FMSynth();
    var synthJSON = {
      'harmonicity': 8,
      'modulationIndex': 2,
      'oscillator': {
        'type': 'sine'
      },
      'envelope': {
        'attack': 0.001,
        'decay': 2,
        'sustain': 0.1,
        'release': 2
      },
      'modulation': {
        'type': 'square'
      },
      'modulationEnvelope': {
        'attack': 0.002,
        'decay': 0.2,
        'sustain': 0,
        'release': 0.2
      }
    };

    instrument.set(synthJSON);

    var effect1, effect2, effect3;

    // create effects
    var effect1 = new Tone.BitCrusher();
    const effect1JSON = {
      'bits': 8,
      'wet': 0.5
    };
    effect1.set(effect1JSON);

    var effect2 = new Tone.Chebyshev();
    const effect2JSON = {
      'order': 50,
      'wet': 0.5
    };
    effect2.set(effect2JSON);

    var effect3 = new Tone.Freeverb();
    const effect3JSON = {
      'roomSize': 0.9,
      'dampening': 2000,
      'wet': 0.5
    };
    effect3.set(effect3JSON);

    // make connections
    instrument.connect(effect1);
    effect1.connect(effect2);
    effect2.connect(effect3);
    effect3.connect(Tone.Master);

    // define deep dispose function
    function deep_dispose () {
      if (effect1 != undefined && effect1 != null) {
        effect1.dispose();
        effect1 = null;
      }
      if (effect2 != undefined && effect2 != null) {
        effect2.dispose();
        effect2 = null;
      }
      if (effect3 != undefined && effect3 != null) {
        effect3.dispose();
        effect3 = null;
      }
      if (instrument != undefined && instrument != null) {
        instrument.dispose();
        instrument = null;
      }
    }

    return {
      instrument: instrument,
      deep_dispose: deep_dispose
    };
  }
}
