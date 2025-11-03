import { CreateRateFactorListComponent } from './create-rate-factor-list/create-rate-factor-list.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RateFactorListComponent } from './rate-factor-list/rate-factor-list.component';
import {RateFactorComponent} from './rate-factor.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  {
    path: '',
    component: RateFactorComponent,
    children: [
      {
        path: 'list/:add',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_rate_factors','rate_factor_manage'] },
        component: CreateRateFactorListComponent },
      {
        path: 'list',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_rate_factors','rate_factor_view'] },
        component: RateFactorListComponent
      },
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RateFactorRoutingModule { }
