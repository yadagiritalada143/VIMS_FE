import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RateCardComponent } from './rate-card.component';
import { RateCardListComponent } from './rate-card-list/rate-card-list.component';
import { RateCardDetailsComponent } from './rate-card-details/rate-card-details.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthguardService],
    data: { userRoles: ['rate_card_view'] },
    component: RateCardComponent,
    children: [
      {
        path: 'list/:add',
        canActivate: [AuthguardService],
        data: { userRoles: ['rate_card_manage'] },
        component: RateCardListComponent
      },
      {
        path: 'list',
        canActivate: [AuthguardService],
        data: { userRoles: ['rate_card_view'] },
        component: RateCardListComponent},
      {
        path: 'details/:id',
        canActivate: [AuthguardService],
        data: { userRoles: ['rate_card_view'] },
        component: RateCardDetailsComponent
      }
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RateCardRoutingModule { }
