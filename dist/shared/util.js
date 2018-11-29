'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validNick = validNick;
exports.findIndex = findIndex;
exports.sanitizeString = sanitizeString;
exports.noSpaces = noSpaces;
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
  return nickname.substring(0, nickname.indexOf(' '));
}