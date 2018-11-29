'use strict';

import Chat from './Chat';
import { noSpaces } from '../../shared/util';
class Client {
  constructor () {
    let userNameInput = document.getElementById('userNameInput');
    document.getElementById('submit-user').addEventListener('click', () => {
      this.startChat(noSpaces(userNameInput.value) || 'tokumei');
    });
  }

  startChat (nick) {
    this.nick = nick;
    this.chat = new Chat(this.nick);
  }
}

window.onload = () => {
  new Client();
};
