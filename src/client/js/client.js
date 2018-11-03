'use strict';

import Chat from './Chat';
class Client {
  constructor () {
    this.chat = new Chat(this.nick);
  }
}

window.onload = () => {
  new Client();
};
