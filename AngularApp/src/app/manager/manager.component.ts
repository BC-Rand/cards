import { Component, OnInit } from '@angular/core';
import { HttpService } from '../http.service';
import { SocketService } from '../socket.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-manager',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.css']
})
export class ManagerComponent implements OnInit {
  _id
  constructor(
    private _socket : SocketService,
    private _http : HttpService,
    private _router : Router
  ) { }

  ngOnInit() {
    this._id = this._http.check_id();
    if (this._id) {
      this._socket.emitLogin(this._id);
    } else {
      this._router.navigate(['']);
    }
  }
  findGame() {
    this._router.navigate(['game']);
  }
  callJoinRoom() {
    this._socket.joinRoomHelper("myRoom");
  }
  callPingRoom() {
    this._socket.pingRoom({roomName:"myRoom", data:"Pinging the room"});
  }

}
