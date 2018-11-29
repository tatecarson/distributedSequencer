export function validNick (nickname) {
  var regex = /^\w*$/;
  return regex.exec(nickname) !== null;
}

export function findIndex (arr, id) {
  var len = arr.length;

  while (len--) {
    if (arr[len].id === id) {
      return len;
    }
  }

  return -1;
}

export function sanitizeString (message) {
  return message.replace(/(<([^>]+)>)/ig, '').substring(0, 35);
}

export function noSpaces (nickname) {
  if (nickname.indexOf(' ') > 0) {
    nickname = nickname.substring(0, nickname.indexOf(' '));
  }
  return nickname;
}

export function rando (arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getFunName () {
  const adjectives = [
    'adorable',
    'beautiful',
    'clean',
    'drab',
    'elegant',
    'fancy',
    'glamorous',
    'handsome',
    'long',
    'magnificent',
    'old-fashioned',
    'plain',
    'quaint',
    'sparkling',
    'ugliest',
    'unsightly',
    'angry',
    'bewildered',
    'clumsy',
    'defeated',
    'embarrassed',
    'fierce',
    'grumpy',
    'helpless',
    'itchy',
    'jealous',
    'lazy',
    'mysterious',
    'nervous',
    'obnoxious',
    'panicky',
    'repulsive',
    'scary',
    'thoughtless',
    'uptight',
    'worried'
  ];

  const nouns = [
    'women',
    'men',
    'children',
    'teeth',
    'feet',
    'people',
    'leaves',
    'mice',
    'geese',
    'halves',
    'knives',
    'wives',
    'lives',
    'elves',
    'loaves',
    'potatoes',
    'tomatoes',
    'cacti',
    'foci',
    'fungi',
    'nuclei',
    'syllabuses',
    'analyses',
    'diagnoses',
    'oases',
    'theses',
    'crises',
    'phenomena',
    'criteria',
    'data'
  ];

  return `${rando(adjectives)}${rando(adjectives)}${rando(nouns)}`;
}
