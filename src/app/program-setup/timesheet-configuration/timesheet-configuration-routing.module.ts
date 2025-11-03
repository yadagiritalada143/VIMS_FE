import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';
import { TimesheetConfigurationListComponent } from './timesheet-configuration-list/timesheet-configuration-list.component';
import { TimesheetConfigurationCreateComponent } from './timesheet-configuration-create/timesheet-configuration-create.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'config/list',
    pathMatch: 'full'
  },
    {
      path: 'config/list',
      canActivate: [AuthguardService],
      data: { userRoles: ['menu_timesheet_configurations','timesheet_configuration_view'] },
      component: TimesheetConfigurationListComponent
    },
    {
      path: 'config',
      canActivate: [AuthguardService],
      data: { userRoles: ['timesheet_configuration_manage'] },
      component: TimesheetConfigurationCreateComponent
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TimesheetConfigurationRoutingModule { }
