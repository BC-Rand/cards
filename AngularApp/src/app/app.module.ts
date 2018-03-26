import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HttpService } from './http.service';
import { SocketService } from './socket.service';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { ManagerComponent } from './manager/manager.component';
import { GameComponent } from './game/game.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ManagerComponent,
    GameComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    HttpService,
    SocketService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
