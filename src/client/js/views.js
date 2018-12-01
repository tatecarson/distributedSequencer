import {numberToNotes} from '../js/soundUtil';

export function headingMatch (matchName, matchingNotes, myNotes) {
  document.getElementById('heading-match').style.width = '100%';

  document.getElementById('match-name').innerHTML = `
  <p class="f2">
    you match with: ${matchName}
  </p>
  `;
  document.getElementById('match-note').innerHTML = `
    <p class="f2">
    their note list: ${numberToNotes(matchingNotes)}
    would you like to add one of their notes to your note bank?
    </p>
    <select id="select-notes"></select>
    <button type="button" id="take-note">Take Note</button>
    <p>
    you currently have these notes: ${numberToNotes(myNotes)}
    </p>
  `;

  const selectedNote = document.getElementById('select-notes');
  numberToNotes(matchingNotes).forEach(note => {
    const option = document.createElement('option');
    option.text = note;
    selectedNote.add(option);
  });
}

export function selectNotes (matchingNotes) {
  const selectedNote = document.getElementById('select-notes');

  return selectedNote;
}
