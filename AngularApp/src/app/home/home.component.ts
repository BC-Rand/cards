import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from '../http.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  regForm = {
    username: "",
    password: "",
    r_password: ""
  }
  regErr
  logForm = {
    username: "",
    password: ""
  }
  logErr
  constructor(
    private _http : HttpService,
    private _router : Router,
  ) { }

  ngOnInit() {
    console.log("home ngOnInit");
    if (!this._http.check_id()) {
      console.log("inside if (!this._http.check_id())");
      let obs = this._http.queryLogStatus()
      obs.subscribe(data => {
        console.log("inside obs callback");
        if (data['message'] == "Success") {
          console.log(data['data']);
          this._http.setLogStatus(data['data']['_id']);
          this._http.setDeck(data['data']['decks'][0]);
          this._http.setUser(data['data']);
          console.log(this._http.checkDeck());
          this._router.navigate(['manager']);
        }
      });
    } else {
      this._router.navigate(['manager']);
    }
  }
  login() {
    console.log(this.logForm);
    let obs = this._http.login(this.logForm);
    obs.subscribe(data => {
      if (data['message'] == "Success") {
        this._http.setLogStatus(data['data']['_id']);
        this._http.setDeck(data['data']['decks'][0]);
        this._http.setUser(data['data']);
        console.log(this._http.checkDeck());
        this._router.navigate(['manager']);
      } else {
        this.logErr = true;
      }
    });
  }
  register() {
    console.log(this.regForm);
    if (this.regForm.password == this.regForm.r_password) {
      let obs = this._http.register(this.regForm);
      obs.subscribe(data => {
        if (data['message'] == "Success") {
          this._http.setLogStatus(data['data']['_id']);
          this._http.setDeck(data['data']['decks'][0]);
          this._http.setUser(data['data']);
          console.log(this._http.checkDeck());
          this._router.navigate(['manager']);
        } else {
          this.regErr = data['data'];
        }
      });
    }
  }

}
