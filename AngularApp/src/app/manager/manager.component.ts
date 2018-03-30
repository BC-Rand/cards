import { Component, OnInit } from '@angular/core';
import { HttpService } from '../http.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-manager',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.css']
})
export class ManagerComponent implements OnInit {
  _id
  user
  deckInput = 0;
  newDeck = {
    title: "New Deck",
    cards: []
  }
  cardTable = [
    [1,1,0,"Wisp"],
    [1,1,0,"Tree"],
    [1,3,1,"DireMole"],
    [2,1,1,"Murloc"],
    [3,2,2,"Raptor"],
    [3,2,2,"AcidOoze"],
    [1,4,2,"Guard"],
    [4,1,2,"Duskboar"],
    [2,3,2,"Croclisk"],
    [3,3,3,"Grizzly"],
    [3,4,3,"Spider"],
    [5,1,3,"MagMan"],
    [2,4,3,"Tentacle"],
    [3,6,4,"FireFly"],
    [4,5,4,"ChillYeti"],
    [5,4,4,"Ancient"],
    [4,6,5,"Smith"]
  ]
  cardTableAdds = []
  newDeckTotal = 0;
  constructor(
    private _http : HttpService,
    private _router : Router
  ) { }

  ngOnInit() {
    this._id = this._http.check_id();
    console.log("this._id: " + this._id);
    if (this._id) {
      for (let i=0; i<this.cardTable.length; i++) {
        this.cardTableAdds.push(0);
      }
      console.log("above this.user = this._http.checkUser()")
      this.user = this._http.checkUser();
      console.log(this.user.decks[this.deckInput]);
    } else {
      this._router.navigate(['']);
    }
  }
  goToGame() {
    this._router.navigate(['game']);
  }
  setDeck() {
    if (this.deckInput < this.user.decks.length) {
      this._http.setDeck(this.user.decks[this.deckInput]);
    }
  }
  submitNewDeck() {
    console.log(this.newDeck);
    if (this.newDeckTotal == 30) {
      console.log("Good to submit");
      // submit the deck
      let obs = this._http.addDeckToId(this._id, this.newDeck);
      obs.subscribe(data => {
        if (data['message'] == "Success") {
          console.log("Successfully added deck");
          this.user.decks = data['data'];
          this.deckInput = data['data'].length - 1;
        } else {
          console.log("Deck add failed");
          this.resetNewDeck();
          this.deckInput = this.user.decks.length - 1;
        }
      })
    }
  }
  resetNewDeck() {
    this.newDeck = {
      title: this.newDeck.title,
      cards: []
    }
    for (let i=0; i<this.cardTable.length; i++) {
      this.cardTableAdds[i] = 0;
    }
    this.newDeckTotal = 0;
  }
  addToNewDeck(idx) {
    console.log(this.cardTable[idx]);
    if (this.cardTableAdds[idx] < 2 && this.newDeckTotal < 30) { // Deck has fewer than 2 copies
      let cardObj = {
        'name': this.cardTable[idx][3],
        'cost': this.cardTable[idx][2],
        'atk': this.cardTable[idx][0],
        'hp': this.cardTable[idx][1]
      }
      this.newDeck.cards.push(cardObj);
      this.cardTableAdds[idx]++;
      this.newDeckTotal++;
    }
  }
}
