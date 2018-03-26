import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class HttpService {
  _id;
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
  check_id() {
    return this._id
  }
}
