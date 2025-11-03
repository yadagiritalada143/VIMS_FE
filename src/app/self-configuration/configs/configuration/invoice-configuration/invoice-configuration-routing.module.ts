import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListComponent } from '../invoice-configuration/list/list.component';
import { InvoiceConfigurationCreateComponent } from './invoice-configuration-create/invoice-configuration-create.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  {
    path:'list',
    canActivate: [AuthguardService],
    data: {
      userRoles: ['invoice_configuration_view']
    },
    component: ListComponent
  },
  {
    path:'create',
    canActivate: [AuthguardService],
    data: {
      userRoles: ['invoice_configuration_manage']
    },
    component: InvoiceConfigurationCreateComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoiceConfigurationRoutingModule { }
