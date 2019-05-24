import Nexus from 'nexusui';
import Tone from 'Tone/core/Tone';

export function numberToNotes (notes) {
  return notes.map(x => Tone.Frequency(Nexus.note(x)).toNote());
}

export function merge (timeArr, noteArr) {
  const length = Math.min(timeArr.length, noteArr.length);
  const ret = [];
  let totalDuration = 0;
  for (let i = 0; i < length; i++) {
    ret.push({
      dur: timeArr[i],
      time: totalDuration,
      note: noteArr[i]
    });
    totalDuration += Tone.Time(timeArr[i]).toSeconds();
  }
  return ret;
}
