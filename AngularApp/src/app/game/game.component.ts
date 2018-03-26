import { Component, OnInit } from '@angular/core';
import { SocketService } from '../socket.service';
import { HttpService } from '../http.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  gamestate
  player
  opponent
  playerHand
  playerField
  opponentHand
  opponentField
  funBool = true;
  constructor(
    private _socket : SocketService,
    private _http : HttpService,
    private _router : Router
  ) { }

  ngOnInit() {
    if (!this._http.check_id()) {
      this._router.navigate(['']);
    } else {
      this._socket.addGameListeners();
      window['socket'].removeListener('gamestate', this.gamestateHelper);
      window['socket'].on('gamestate', this.gamestateHelper);
    }
  }
  gamestateHelper(gamestate) {
    console.log("gamestateHelper was called");
    console.log(!this.gamestate);
    console.dir(gamestate);
    this.gamestate = true;
    console.log(!this.gamestate);
    console.dir(this.gamestate);
  }
  findRoomClick() {
    this._socket.startRoomSearch();
  }
  switchFunBool() {
    this.funBool = !this.funBool;
  }
}
