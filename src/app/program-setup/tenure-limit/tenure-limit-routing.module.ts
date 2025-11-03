import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TenureLimitCreateComponent } from './tenure-limit-create/tenure-limit-create.component';
import { TenureLimitListComponent } from './tenure-limit-list/tenure-limit-list.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'config/list',
    pathMatch: 'full'
  },
    { path: 'config/list', component: TenureLimitListComponent},
    { path: 'config', component: TenureLimitCreateComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TenureLimitRoutingModule { }
