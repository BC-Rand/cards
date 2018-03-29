import { Component, OnInit } from '@angular/core';
import { HttpService } from '../http.service';
import { Router } from '@angular/router';
import * as io from "socket.io-client";

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  playInput = "";
  attackInput = "";
  defendInput = "";

  gamestate;
  activeBool = false;
  playerId;
  opponentId;
  playerDeck;
  opponentDeck;
  playerHand = [];
  opponentHand = [];
  playerField = [];
  opponentField = [];
  playerHealth;
  opponentHealth;
  playerManaTotal;
  opponentManaTotal;
  playerManaCurrent;
  opponentManaCurrent;
  socket = io('http://localhost:8000');
  
  constructor(
    private _http : HttpService,
    private _router : Router
  ) { }

  ngOnInit() {
    if (!this._http.check_id()) {
      this._router.navigate(['']);
    } else {
      //
      this.playerId = this._http.check_id();
      this.playerDeck = this._http.checkDeck();
      this.socket.on("joinRoom", this.joinRoomHelper.bind(this));
      this.socket.on('gamestate', this.gamestateHelper.bind(this));
      this.socket.on('getDeck', this.getDeckHelper.bind(this));
      this.socket.on('startTurn', this.startTurnHelper.bind(this));
      this.socket.on('playCard', this.playCardHelper.bind(this));
      this.socket.on('attack', this.attackHelper.bind(this));
      this.socket.on('Victory', this.victoryHelper.bind(this));
      this.socket.emit("login", this.playerId);
      this.socket.emit('checkRoom');
    }
  }
  joinRoomHelper(roomName) {
    console.log("Server is placing you in a room")
    this.socket.emit("joinRoom", roomName);
  }
  gamestateHelper(gamestate) {
    this.gamestate = gamestate;
    console.dir(this.gamestate);
    let pnum, onum;
    if (this.gamestate['player1'] == this.playerId) {
      pnum = 'player1';
      onum = 'player2';
    } else if (gamestate['player2'] == this.playerId) {
      pnum = 'player2';
      onum = 'player1';
    }
    this.opponentId = this.gamestate[onum];
    this.playerDeck = this.gamestate[pnum + 'Deck'];
    this.opponentDeck = this.gamestate[onum + 'Deck'];
    this.playerHand = this.gamestate[pnum + 'Hand'];
    this.opponentHand = this.gamestate[onum + 'Hand'];
    this.playerField = this.gamestate[pnum + 'Field'];
    this.opponentField = this.gamestate[onum + 'Field'];
    this.playerHealth = this.gamestate[pnum + 'Health'];
    this.opponentHealth = this.gamestate[onum + 'Health']; 
    this.playerManaTotal = this.gamestate[pnum + 'ManaTotal'];
    this.opponentManaTotal = this.gamestate[onum + 'ManaTotal'];
    this.playerManaCurrent = this.gamestate[pnum + 'ManaCurrent'];
    this.opponentManaCurrent = this.gamestate[onum + 'ManaCurrent'];
    this.activeBool = (this.gamestate['activePlayer'] != this.playerId);
  }
  getDeckHelper(roomName) {
    let responseObj = {
      roomId: roomName,
      deck: this.playerDeck
    }
    this.socket.emit('sendDeck', responseObj);
  }
  startTurnHelper() {
    if (!this.activeBool) {
      this.activeBool = true;
      this.playerHand.push(this.playerDeck.cards.pop());
      if (this.playerManaTotal < 10) {
        this.playerManaTotal += 1;
      }
      this.playerManaCurrent = this.playerManaTotal;
      for (let i=0; i<this.playerField.length; i++) {
        this.playerField[i]['canAtk'] = true;
      }
    } else {
      this.activeBool = false;
      this.opponentHand.push(this.opponentDeck.cards.pop());
      if (this.opponentManaTotal < 10) {
        this.opponentManaTotal += 1;
      }
      this.opponentManaCurrent = this.opponentManaTotal;
      for (let i=0; i<this.opponentField.length; i++) {
        this.opponentField[i]['canAtk'] = true;
      }
    }
  }
  playCardHelper(index) {
    if (!this.activeBool) {
      this.opponentManaCurrent -= this.opponentHand[index]['cost'];
      this.opponentHand[index]['canAtk'] = false;
      this.opponentField.push(this.opponentHand.splice(index, 1)[0]);
    }
  }
  attackHelper(obj) {
    console.log("attackHelper called", obj)
    if (!this.activeBool) {
      console.log("not active player");
      let atkIdx = obj['atkIdx'], defIdx = obj['defIdx'];
      this.opponentField[atkIdx]['canAtk'] = false;
      // Attack animation
      if (defIdx == -1) {
        console.log("defIdx == -1");
        console.log("this.playerHealth: " + this.playerHealth);
        console.log("attacker value: " + this.opponentField[atkIdx]['atk']);
        this.playerHealth -= this.opponentField[atkIdx]['atk'];
        console.log("this.playerHealth: " + this.playerHealth);
      } else {
        this.playerField[defIdx]['hp'] -= this.opponentField[atkIdx]['atk']
        this.opponentField[atkIdx]['hp'] -= this.playerField[defIdx]['atk']
        if (this.opponentField[atkIdx]['hp'] <= 0) {
          // Death animation
          this.opponentField.splice(atkIdx, 1);
        }
        if (this.playerField[defIdx]['hp']) {
          // Death animation
          this.playerField.splice(defIdx, 1);
        }
      }
    }
  }
  victoryHelper(winnerId) {
    if (winnerId == this.playerId) {
      // Player wins
      console.log("You win");
    } else {
      // Opponent wins
      console.log("You lose");
    }
  }
  findRoomClick() {
    this.socket.emit("findGame");
  }
  playCard(index) {
    if (index < this.playerHand.length && (this.playerHand[index]['cost'] <= this.playerManaCurrent)) {
      this.socket.emit("playCard", index);
      this.playerManaCurrent -= this.playerHand[index]['cost'];
      this.playerHand[index]['canAtk'] = false;
      this.playerField.push(this.playerHand.splice(index, 1)[0]);
    }
  }
  attack(atkIdx, defIdx) {
    if (atkIdx < this.playerField.length && this.playerField[atkIdx]['canAtk'] && defIdx < this.opponentField.length && (defIdx = -1 || this.opponentField[defIdx])) {
      this.socket.emit('attack', {atkIdx:atkIdx, defIdx:defIdx});
      this.playerField[atkIdx]['canAtk'] = false;
      // Attack animation
      if (defIdx == -1) {
        this.opponentHealth -= this.playerField[atkIdx]['atk'];
        if (this.opponentHealth <= 0) {
          // You win
          this.socket.emit('Victory');
        }
      } else {
        this.opponentField[defIdx]['hp'] -= this.playerField[atkIdx]['atk'];
        this.playerField[atkIdx]['hp'] -= this.opponentField[defIdx]['atk'];
        if (this.opponentField[defIdx]['hp'] <= 0) {
          // Death animation
          this.opponentField.splice(defIdx, 1);
        }
        if (this.playerField[atkIdx]['hp'] <= 0) {
          // Death animation
          this.playerField.splice(atkIdx, 1);
        }
      }
    }
  }
  endTurn() {
    this.socket.emit('endTurn');
  }
}
