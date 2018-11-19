'use strict';

import Chat from './Chat';
class Client {
  constructor () {
    // this.chat = new Chat(this.nick);
    let userNameInput = document.getElementById('userNameInput');

    document.getElementById('restart').onclick = () => {
      this.startChat(userNameInput.value);
      document.getElementById('myNav').style.width = '0%';
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
