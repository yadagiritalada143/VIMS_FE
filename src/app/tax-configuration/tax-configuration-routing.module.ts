import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthguardService } from '../core/services/auth_guard.service';

import { TaxConfigurationComponent } from './tax-configuration.component';
import { TaxDetailsComponent } from './tax-details/tax-details.component';
import { TaxListingComponent } from './tax-listing/tax-listing.component';

const routes: Routes = [
  { 
    path: '', 
    component: TaxConfigurationComponent,
    children: [
      {
        path: 'list',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: { 'userRoles': ['view_tax_configuration'] },
        component: TaxListingComponent
      }, {
        path: 'create',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: { 'userRoles': ['create_tax_configuration'] },
        component: TaxDetailsComponent
      }, {
        path: 'edit/:id',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: { 'userRoles': ['edit_tax_configuration'] },
        component: TaxDetailsComponent
      }, {
        path: 'view/:id',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: { 'userRoles': ['view_tax_configuration'] },
        component: TaxDetailsComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaxConfigurationRoutingModule { }
