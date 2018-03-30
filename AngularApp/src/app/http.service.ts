import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class HttpService {
  _id;
  deck;
  user;
  constructor(
    private _http : HttpClient
  ) { }
  register(newUser) {
    return this._http.post('/users/register', newUser);
  }
  login(user) {
    return this._http.post('/users/login', user);
  }
  queryLogStatus() {
    return this._http.get('/users/session');
  }
  setLogStatus(id) {
    this._id = id;
  }
  setDeck(deck) {
    this.deck = deck;
  }
  setUser(user) {
    this.user = user
  }
  checkUser() {
    return this.user;
  }
  checkDeck() {
    return this.deck;
  }
  check_id() {
    return this._id
  }
  addDeckToId(id, deck) {
    return this._http.post('/users/' + id + '/adddeck',{deck:deck})
  }
}
