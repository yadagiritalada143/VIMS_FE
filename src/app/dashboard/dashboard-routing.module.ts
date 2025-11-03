import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardComponent } from './dashboard.component';
import { ContactSupportComponent} from '../dashboard/Component/contact-support/contact-support.component'

const routes: Routes = [
  { path: '', component: DashboardComponent,
},
  { path: 'contact-support', component: ContactSupportComponent,
 },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
