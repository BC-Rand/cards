import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { ManagerComponent } from './manager/manager.component';
import { GameComponent } from './game/game.component';

const routes: Routes = [
  { path:"", pathMatch:"full", component: HomeComponent },
  { path:"manager", component: ManagerComponent },
  { path:"game", component: GameComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
