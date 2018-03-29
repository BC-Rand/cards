import { Component, OnInit } from '@angular/core';
import { HttpService } from '../http.service';
import { Router } from '@angular/router';
import * as io from "socket.io-client";
import * as PIXI from 'pixi.js';

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
  //Brandons Vars
  app;
  x
  y
  cardarr
  boardarr
  oppArr
  oppx
  oppy
  
  constructor(
    private _http : HttpService,
    private _router : Router
    
  ) { }

  ngOnInit() {
    this.oppx = 0;
    this.oppy = 140;
    this.x = 0;
    this.y = 820;
    this.cardarr = [null,null,null,null,null,null,null,null,null,null];
    this.oppArr = [null,null,null,null,null,null,null,null,null,null];
    this.boardarr = [null,null,null,null,null,null,null];
    this.app = new PIXI.Application(1200, 900, {backgroundColor : 0x000000});
    console.log(this.app)
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
    document.body.appendChild(this.app.view); //Adds background
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
    for(var idx = 0; idx < this.playerHand.length; idx++){
      this.finishCard(this.playerHand[idx].name,this.playerHand[idx].cost,this.playerHand[idx].atk,this.playerHand[idx].hp)
    }
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
    console.log('getDeckHelper responseObj: ', responseObj);
    this.socket.emit('sendDeck', responseObj);
  }
  startTurnHelper() {
    if (!this.activeBool) {
      this.activeBool = true;
      var cardDraw = this.playerDeck.cards.pop()
      this.finishCard(cardDraw.name,cardDraw.cost,cardDraw.atk,cardDraw.hp) //Create card
      this.playerHand.push(cardDraw); //old 
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
      var OppMadeCard = this.opponentHand.splice(index, 1)[0]
      this.finishOppCard(OppMadeCard.name,OppMadeCard.cost,OppMadeCard.atk,OppMadeCard.hp)
      console.log(OppMadeCard);
      this.opponentField.push(OppMadeCard);
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

    findIndex(Val){
    console.log("findIndex")
    // console.log(Val)
    var bob;
    var tim;
    for(var idx = 0; idx < this.cardarr.length; idx++){
        // console.log(cardarr[idx][0].y)
        if(this.cardarr[idx][0].y == Val){
            tim = this.cardarr[idx]
            this.cardarr.splice(idx,1,null)
            bob = idx;
            // console.log(cardarr)
            break;
        }
    }
    return [bob,tim];
}
findIndex2(Val){
  console.log("findIndex2")
  // console.log(Val)
  var bob;
  for(var idx = 0; idx < this.boardarr.length; idx++){
      // console.log(cardarr[idx][0].y)
      if(this.boardarr[idx][1].text == Val){
          bob = idx;
          // console.log(cardarr)
          break;
      }
  }
  console.log(bob)
  return bob
}

setCard(){
    console.log("setCard")
    for(var idx = 0; idx < this.cardarr.length ;idx++){
        if(this.cardarr[idx] == null){
            this.x = idx * 115 + 85;
            this.cardarr[idx] = "Card"
            break;
        }
    }
}
setOppCard(){
  console.log("setOppCard")
  for(var idx = 0; idx < this.oppArr.length ;idx++){
      if(this.oppArr[idx] == null){
          this.oppx = idx * 120 + 200;
          this.oppArr[idx] = "Card"
          break;
      }
  }
}

reDoHand(val:number){
    console.log("reDoHand")
    var cardarr2 = [];
    for(var idx = 0; idx < val; idx++){
        cardarr2.push(this.cardarr[idx])
    }
    for(var idx = val; idx < this.cardarr.length ;idx++){
        if(this.cardarr[idx]){
          this.cardarr[idx][0].x -= 115;
          this.cardarr[idx][1].x -= 115;
          this.cardarr[idx][2].x -= 115;
          this.cardarr[idx][3].x -= 115;
          this.cardarr[idx][4].x -= 115;
            cardarr2.push(this.cardarr[idx])
        }
    }
    if(cardarr2.length < 11){
        var add = 10 - cardarr2.length
        for(var adding = 0; adding < add; adding++){
            cardarr2.push(null);
        }
    }
    // console.log(cardarr2);
    this.cardarr = cardarr2;
    return;
}
reDoHand2(val:number){
  console.log("reDoHand")
  var boardarr2 = [];
  for(var idx = 0; idx < val; idx++){
      boardarr2.push(this.boardarr[idx])
  }
  for(var idx = val; idx < this.boardarr.length ;idx++){
      if(this.boardarr[idx]){
        this.boardarr[idx][0].x -= 115;
        this.boardarr[idx][1].x -= 115;
        this.boardarr[idx][2].x -= 115;
        this.boardarr[idx][3].x -= 115;
        this.boardarr[idx][4].x -= 115;
        boardarr2.push(this.boardarr[idx])
      }
  }
  if(boardarr2.length < 11){
      var add = 10 - boardarr2.length
      for(var adding = 0; adding < add; adding++){
        boardarr2.push(null);
      }
  }
  // console.log(cardarr2);
  this.boardarr = boardarr2;
  return;
}
reDoOppField(val:number){
  console.log("reDoHand")
  var cardarr2 = [];
  for(var idx = 0; idx < val; idx++){
      cardarr2.push(this.oppArr[idx])
  }
  for(var idx = val; idx < this.oppArr.length ;idx++){
      if(this.oppArr[idx]){
        this.oppArr[idx][0].x -= 115;
        this.oppArr[idx][1].x -= 115;
        this.oppArr[idx][2].x -= 115;
        this.oppArr[idx][3].x -= 115;
        this.oppArr[idx][4].x -= 115;
          cardarr2.push(this.oppArr[idx])
      }
  }
  if(cardarr2.length < 11){
      var add = 10 - cardarr2.length
      for(var adding = 0; adding < add; adding++){
          cardarr2.push(null);
      }
  }
  // console.log(cardarr2);
  this.oppArr = cardarr2;
  return;
}
finishOppCard(Name,Cost,Atk,HP){
  console.log("FinishOppCard")
  var newCard = this.OppCard(Name,Cost,Atk,HP);
  for(var idx = 0; idx < this.oppArr.length ;idx++){
      if(this.oppArr[idx] == 'Card'){
        this.oppArr[idx] = newCard;
          break;
      }
  }
  return
}
OppCard(Name,Cost,Atk,HP){
  console.log("OppCard")
  this.setOppCard();
  const card = new PIXI.Graphics();
  card.beginFill(0x00aa00);
  card.drawRect(-50,-60,100,120);

  card.x = this.oppx;
  card.y = this.oppy;

  var cardtextTopLeft = this.TL(Name);
  var cardtextBottomLeft = this.BL(Atk);
  var cardtextTopRight = this.TR(Cost);
  var cardtextBottomRight = this.BR(HP);

  cardtextTopLeft.x = this.oppx-50;
  cardtextTopLeft.y = this.oppy-60;
  cardtextBottomLeft.x = this.oppx-50;
  cardtextBottomLeft.y = this.oppy+35;
  cardtextBottomRight.x = this.oppx+47 - cardtextBottomRight.width;
  cardtextBottomRight.y = this.oppy+35;
  cardtextTopRight.x = this.oppx+47 - cardtextTopRight.width;
  cardtextTopRight.y = this.oppy-60;
  this.oppx = 0;
  this.app.stage.addChild(card);
  this.app.stage.addChild(cardtextTopLeft);
  this.app.stage.addChild(cardtextBottomLeft);
  this.app.stage.addChild(cardtextBottomRight);
  this.app.stage.addChild(cardtextTopRight);

  return [card,cardtextTopLeft,cardtextBottomLeft,cardtextBottomRight,cardtextTopRight];
}
finishCard(Name,Cost,Atk,HP){
    var newCard = this.Card(Name,Cost,Atk,HP);
    for(var idx = 0; idx < this.cardarr.length ;idx++){
        if(this.cardarr[idx] == 'Card'){
          this.cardarr[idx] = newCard;
            break;
        }
    }
    return
}
TL(val){

    var z;
    if(val == null){
        z = new PIXI.Text("", { fontFamily: 'Snippet', fontSize: 20, fill: 'white'})
    }
    else{
        z = new PIXI.Text(val, { fontFamily: 'Snippet', fontSize: 20, fill: 'white'})
    }
    return z;
}
BR(val){

    var z;
    if(val == null){
        z = new PIXI.Text("", { fontFamily: 'Snippet', fontSize: 20, fill: 'white'})
    }
    else{
        z = new PIXI.Text(val, { fontFamily: 'Snippet', fontSize: 20, fill: 'white'})
    }
    return z;
}
BL(val){

    var z;
    if(val == null){
        z = new PIXI.Text("", { fontFamily: 'Snippet', fontSize: 20, fill: 'white'})
    }
    else{
        z = new PIXI.Text(val, { fontFamily: 'Snippet', fontSize: 20, fill: 'white'})
    }
    return z;
}
TR(val){

    var z;
    if(val == null){
        z = new PIXI.Text("", { fontFamily: 'Snippet', fontSize: 20, fill: 'white'})
    }
    else{
        z = new PIXI.Text(val, { fontFamily: 'Snippet', fontSize: 20, fill: 'white'})
    }
    return z;
}
Card(Name,Cost,Atk,HP)
{
  this.setCard(); 
  // places the card in the hand
    //Creating the text
    var cardtextTopLeft = this.TL(Name);
    var cardtextBottomLeft = this.BL(Atk);
    var cardtextTopRight = this.TR(Cost);
    var cardtextBottomRight = this.BR(HP);

    var name = Name;
    var cost = Cost;
    var attack = Atk;
    var health = HP;
    
    const card = new PIXI.Graphics();
    card.beginFill(0x00aa00);
    card.drawRect(-50,-60,100,120);

    card.interactive = true;
    card.buttonMode = true;

    cardtextTopLeft.x = this.x-50;
    cardtextTopLeft.y = this.y-60;
    cardtextBottomLeft.x = this.x-50;
    cardtextBottomLeft.y = this.y+35;
    cardtextBottomRight.x = this.x+47 - cardtextBottomRight.width;
    cardtextBottomRight.y = this.y+35;
    cardtextTopRight.x = this.x+47 - cardtextTopRight.width;
    cardtextTopRight.y = this.y-60;

    card.x = this.x;
    card.y = this.y;
    var spotx = this.x;
    var spoty = this.y;
    const onDragStart = event => {
        spotx = card.x;
        spoty = card.y;
        card.data = event.data;
        card.dragging = true;
        
    };
    const onDragEnd = event => {
        if(card.y < 700 && this.boardarr[6] == null && spoty > 700 && parseInt(cardtextTopRight.text) <= this.playerManaCurrent){
            console.log(card.x) 
            console.log(card.y)

            var FI = this.findIndex(card.y)
            // parsedInt = parseInt(cardtextBottomLeft.text);
            // if(parsedInt < 1){
            //     console.log("Shit")
            //     console.log("Shit")
            //     console.log("Shit")
            // }
            // console.log(FI[1])
            var index = FI[0]
            var IDX = FI[1];
            for(var idx = 0; idx < this.boardarr.length;idx++){
                if(this.boardarr[idx] == null){
                    card.x = idx * 120 + 200;
                    card.y = 500;
                    console.log(card.x);
                    console.log(card.y);
                    cardtextTopLeft.x = card.x-50;
                    cardtextTopLeft.y = card.y-60;
                    cardtextBottomLeft.x = card.x-50;
                    cardtextBottomLeft.y = card.y+35;
                    cardtextBottomRight.x = card.x+47 - cardtextBottomRight.width;
                    cardtextBottomRight.y = card.y+35;
                    cardtextTopRight.x = card.x+47 - cardtextTopRight.width;
                    cardtextTopRight.y = card.y-60;
                    spotx = this.x;
                    spoty = this.y;
                    this.x = 0;
                    this.boardarr[idx] = IDX
                    this.playCard(index)
                    this.reDoHand(index);
                    break;
                }
            }
            
        }
        else{
          if(spoty < 700){
            console.log(card.x)
            console.log(card.y)
            console.log(spoty);
            console.log(this);
            if(card.x > 150 && card.x < 250 && card.y > 140 && card.y < 260){
              console.log("Opp Board 0")
              let idx = this.findIndex2(cardtextTopLeft.text);
              console.log(idx)
              this.attack(idx,0)
              cardtextBottomRight.text = parseInt(cardtextBottomRight.text) - parseInt(this.oppArr[0][2].text)
              this.oppArr[0][3].text = parseInt(this.oppArr[0][3].text) - parseInt(cardtextBottomLeft.text)
              if(parseInt(cardtextBottomRight.text) <= 0){
                this.app.stage.removeChild(card);
                this.app.stage.removeChild(cardtextTopLeft);
                this.app.stage.removeChild(cardtextBottomLeft);
                this.app.stage.removeChild(cardtextBottomRight);
                this.app.stage.removeChild(cardtextTopRight);
                this.boardarr.splice(idx,1)
                this.reDoHand2(idx) // fix
              }
              if(parseInt(this.oppArr[0][3].text) <= 0){
                this.app.stage.removeChild(this.oppArr[0][0]);
                this.app.stage.removeChild(this.oppArr[0][1]);
                this.app.stage.removeChild(this.oppArr[0][2]);
                this.app.stage.removeChild(this.oppArr[0][3]);
                this.app.stage.removeChild(this.oppArr[0][4]);
                this.oppArr.splice(0,1)
                for(var idx2 = 0; idx2 < this.oppArr.length; idx2++){
                  if(this.oppArr[idx2]){
                    this.oppArr[idx2][0].x -= 120;
                    this.oppArr[idx2][1].x -= 120;
                    this.oppArr[idx2][2].x -= 120;
                    this.oppArr[idx2][3].x -= 120;
                    this.oppArr[idx2][4].x -= 120;
                  }
                }
              }
              // cardtextBottomLeft.text = parseInt(cardtextBottomLeft.text) - 1;
            }
            else if(card.x > 270 && card.x < 370 && card.y > 140 && card.y < 260){
              console.log("Opp Board 1")
            }
            else if(card.x > 390 && card.x < 490 && card.y > 140 && card.y < 260){
              console.log("Opp Board 2")
            }
            else if(card.x > 510 && card.x < 610 && card.y > 140 && card.y < 260){
              console.log("Opp Board 3")
            }
            else if(card.x > 630 && card.x < 730 && card.y > 140 && card.y < 260){
              console.log("Opp Board 4")
            }
            else if(card.x > 750 && card.x < 850 && card.y > 140 && card.y < 260){
              console.log("Opp Board 5")
            }
            else if(card.x > 870 && card.x < 970 && card.y > 140 && card.y < 260){
              console.log("Opp Board 6")
            }
          }
            card.x = spotx;
            card.y = spoty;
            cardtextTopLeft.x = card.x-50;
            cardtextTopLeft.y = card.y-60;
            cardtextBottomLeft.x = card.x-50;
            cardtextBottomLeft.y = card.y+35;
            cardtextBottomRight.x = card.x+47 - cardtextBottomRight.width;
            cardtextBottomRight.y = card.y+35;
            cardtextTopRight.x = card.x+47 - cardtextTopRight.width;
            cardtextTopRight.y = card.y-60;
        }
        delete card.data;
        card.dragging = false
    }
    const onDragMove = event =>{
        if(card.dragging === true){
            const newPosition = card.data.getLocalPosition(card.parent);
            card.x = newPosition.x;
            card.y = newPosition.y;
            cardtextTopLeft.x = newPosition.x-50;
            cardtextTopLeft.y = newPosition.y-60;
            cardtextBottomLeft.x = newPosition.x-50;
            cardtextBottomLeft.y = newPosition.y+35;
            cardtextBottomRight.x = newPosition.x+47 - cardtextBottomRight.width;
            cardtextBottomRight.y = newPosition.y+35;
            cardtextTopRight.x = newPosition.x+47 - cardtextTopRight.width;
            cardtextTopRight.y = newPosition.y-60;
        }
    }

    // card.on('pointerover', filterOn )
    //     .on('pointerout', filterOff );
    card.on("pointerdown", onDragStart)
    .on('pointerup',onDragEnd)
    .on('pointerupoutside',onDragEnd)
    .on('pointermove',onDragMove)

    this.x = 0;
    this.app.stage.addChild(card);
    this.app.stage.addChild(cardtextTopLeft);
    this.app.stage.addChild(cardtextBottomLeft);
    this.app.stage.addChild(cardtextBottomRight);
    this.app.stage.addChild(cardtextTopRight);
    return [card,cardtextTopLeft,cardtextBottomLeft,cardtextBottomRight,cardtextTopRight];
  }
}
  // REMOVE SOMETHING
// this.app.stage.removeChild(card);
//       this.app.stage.removeChild(cardtextTopLeft);
//       this.app.stage.removeChild(cardtextBottomLeft);
//       this.app.stage.removeChild(cardtextBottomRight);
//       this.app.stage.removeChild(cardtextTopRight);
