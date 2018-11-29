import Nexus from 'nexusui';
import Tone from 'Tone/core/Tone';

export function numberToNotes (notes) {
  return notes.map(x => Tone.Frequency(Nexus.note(x)).toNote());
}
