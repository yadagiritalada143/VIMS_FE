import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
const routes: Routes = [
  // {
  //   path: '',
  //   component: AccountSetupComponent,
  //   children: [
  //     { path: 'accout-setup', component: BasicDetailsComponent },
  //     { path: '', component: },
  //   ],
  // },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccountSetupComponentRoutingModule { }
