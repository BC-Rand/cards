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
  deck = {
    cards: [],
    title: "MyDeck"
  }
  constructor(
    private _http : HttpService,
    private _router : Router
  ) { }

  ngOnInit() {
    this._id = this._http.check_id();
    if (this._id) {
    } else {
      this._router.navigate(['']);
    }
  }
  goToGame() {
    this._router.navigate(['game']);
  }
}
