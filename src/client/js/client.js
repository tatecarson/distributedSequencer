'use strict';

import Player from './Player';
import { noSpaces, getFunName } from '../../shared/util';
class Client {
  constructor () {
    let userNameInput = document.getElementById('userNameInput');
    document.getElementById('submit-user').addEventListener('click', () => {
      // noSpaces removes everything after a space because it breaks socket query
      this.startPlayer(noSpaces(userNameInput.value) || getFunName());
    });
  }

  startPlayer (nick) {
    this.nick = nick;
    this.player = new Player(this.nick);
  }
}

window.onload = () => {
  new Client();
};
