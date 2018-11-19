'use strict';

import Chat from './Chat';
class Client {
  constructor () {
    // this.chat = new Chat(this.nick);
    let userNameInput = document.getElementById('userNameInput');

    document.getElementById('submit-user').onclick = () => {
      this.startChat(userNameInput.value);
    };

    console.log(userNameInput.value);
  }

  startChat (nick) {
    this.nick = nick;
    this.chat = new Chat(this.nick);
  }
}

window.onload = () => {
  new Client();
};
