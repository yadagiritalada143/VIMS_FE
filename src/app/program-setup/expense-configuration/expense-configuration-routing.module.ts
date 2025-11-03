import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExpenseConfigurationListComponent } from './pages/expense-configuration-list/expense-configuration-list.component';
import { ExpenseConfigurationItemDetailsComponent } from './pages/expense-configuration-item-details/expense-configuration-item-details.component';
import { ExpenseConfigurationRoutes } from './enums/expense-configuration.enums';
import { ExpenseConfigurationComponent } from './pages/expense-configuration.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';


const routes: Routes = [{
  path: '',
  component: ExpenseConfigurationComponent,
  children: [
    {
      path: '',
      redirectTo: ExpenseConfigurationRoutes.List,
      pathMatch: 'full'
    },
    {
      path: ExpenseConfigurationRoutes.List,
      canActivate: [AuthguardService],
      data: {
        userRoles: ['expense_configuration_view'],
      },
      component: ExpenseConfigurationListComponent
    },
    {
      path: ExpenseConfigurationRoutes.Details,
      canActivate: [AuthguardService],
      data: {
        userRoles: ['expense_configuration_manage'],
      },
      component: ExpenseConfigurationItemDetailsComponent
    },
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExpenseConfigurationRoutingModule { }
