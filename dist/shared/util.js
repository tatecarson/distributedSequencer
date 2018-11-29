'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validNick = validNick;
exports.findIndex = findIndex;
exports.sanitizeString = sanitizeString;
exports.noSpaces = noSpaces;
exports.rando = rando;
exports.getFunName = getFunName;
function validNick(nickname) {
  var regex = /^\w*$/;
  return regex.exec(nickname) !== null;
}

function findIndex(arr, id) {
  var len = arr.length;

  while (len--) {
    if (arr[len].id === id) {
      return len;
    }
  }

  return -1;
}

function sanitizeString(message) {
  return message.replace(/(<([^>]+)>)/ig, '').substring(0, 35);
}

function noSpaces(nickname) {
  if (nickname.indexOf(' ') > 0) {
    nickname = nickname.substring(0, nickname.indexOf(' '));
  }
  return nickname;
}

function rando(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getFunName() {
  var adjectives = ['adorable', 'beautiful', 'clean', 'drab', 'elegant', 'fancy', 'glamorous', 'handsome', 'long', 'magnificent', 'old-fashioned', 'plain', 'quaint', 'sparkling', 'ugliest', 'unsightly', 'angry', 'bewildered', 'clumsy', 'defeated', 'embarrassed', 'fierce', 'grumpy', 'helpless', 'itchy', 'jealous', 'lazy', 'mysterious', 'nervous', 'obnoxious', 'panicky', 'repulsive', 'scary', 'thoughtless', 'uptight', 'worried'];

  var nouns = ['women', 'men', 'children', 'teeth', 'feet', 'people', 'leaves', 'mice', 'geese', 'halves', 'knives', 'wives', 'lives', 'elves', 'loaves', 'potatoes', 'tomatoes', 'cacti', 'foci', 'fungi', 'nuclei', 'syllabuses', 'analyses', 'diagnoses', 'oases', 'theses', 'crises', 'phenomena', 'criteria', 'data'];

  return '' + rando(adjectives) + rando(adjectives) + rando(nouns);
}