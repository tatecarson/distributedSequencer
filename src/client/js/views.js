import {numberToNotes} from '../js/soundUtil';

export function headingMatch (matchName, matchingNotes, myNotes) {
  document.getElementById('heading-match').style.width = '100%';

  document.getElementById('match-name').innerHTML = `
  <p class="f3">
    you match with: ${matchName}
    your current melody: ${numberToNotes(myNotes)}
  </p>
  `;

  // only show if there are notes to choose from
  if (matchingNotes.length) {
    document.getElementById('match-note').innerHTML = `
    <p class="f3">
    would you like to add one of their notes to your note bank? Choose one from the list.
    </p>
    <select id="select-notes"></select>
    <button type="button" id="take-note">Take Note</button>
  `;

    const selectedNote = document.getElementById('select-notes');

    numberToNotes(matchingNotes).forEach(note => {
      const option = document.createElement('option');
      option.text = note;
      selectedNote.add(option);
    });
  } else {
    // if no notes try someone else
    document.getElementById('match-note').innerHTML = `
     <p class="f3">
      ${matchName} is out of notes, try someone else. 
     </p>
    `;
  }
}

export function selectNotes (matchingNotes) {
  const selectedNote = document.getElementById('select-notes');

  return selectedNote;
}
