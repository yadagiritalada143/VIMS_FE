import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InvoiceConfigurationCreateComponent } from './invoice-configuration-create/invoice-configuration-create.component';
import { InvoiceConfigurationListComponent } from './invoice-configuration-list/invoice-configuration-list.component';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'config/list',
    pathMatch: 'full'
  },
  { path: 'config/list', component: InvoiceConfigurationListComponent},
  { path: 'config', component: InvoiceConfigurationCreateComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoiceConfigurationRoutingModule { }
