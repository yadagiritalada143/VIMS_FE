import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateRFxComponent } from './create-rfx/rfx.component';
import { ListRFxComponent } from './lists/rfx.component';
import { BidListComponent } from './bid-list/bid-list.component';

const routes: Routes = [

  {
    path: 'create',
    component: CreateRFxComponent
  },
  {
    path: 'bidlist',
    component: BidListComponent
  },
  {
    path: '**',
    component: ListRFxComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RFxRoutingModule { }
