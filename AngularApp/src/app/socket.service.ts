import { Injectable } from '@angular/core';

@Injectable()
export class SocketService {
  gamestate;
  constructor() { }

  addGameListeners() {
    console.log("Adding game listeners to socket")
    window['socket'].removeListener("joinRoom", this.joinRoomHelper);
    window['socket'].removeListener('gamestate', this.gamestateHelper);
    window['socket'].on("joinRoom", this.joinRoomHelper);
    window['socket'].on('gamestate', this.gamestateHelper);
    window['socket'].emit("checkRoom");
  }
  joinRoomHelper(roomName) {
    console.log("Client received joinRoom socket ping and called helper function");
    window['socket'].emit("joinRoom", roomName);
  }
  gamestateHelper(gamestate) {
    this.gamestate = gamestate;
  }
  returnGamestate() {
    return this.gamestate;
  }
  roomMessageFunc(message) {
    console.log(message);
  }
  startRoomSearch() {
    console.log("Started search for room")
    window['socket'].emit("findGame")
  }
  pingRoom(roomData) {
    window['socket'].emit("roomPing", roomData);
  }
  managerResFunc(data) {
    console.log(data['message']);
  }
  emitLogin(_id) {
    window['socket'].emit("login", _id)
  }
}
