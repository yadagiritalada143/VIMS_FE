import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AccountCodeSetupComponent } from './account-code-setup.component';

const routes: Routes = [
  {
    path: '',
    component: AccountCodeSetupComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountCodeSetupRoutingModule { }
