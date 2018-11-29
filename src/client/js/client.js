'use strict';

import Chat from './Chat';
import { noSpaces, getFunName } from '../../shared/util';
class Client {
  constructor () {
    let userNameInput = document.getElementById('userNameInput');
    document.getElementById('submit-user').addEventListener('click', () => {
      // noSpaces removes everything after a space because it breaks socket query
      this.startChat(noSpaces(userNameInput.value) || getFunName());
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
