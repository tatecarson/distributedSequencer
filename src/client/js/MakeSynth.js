import Nexus from 'nexusui';
import euclideanRhythms from 'euclidean-rhythms';

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
}
