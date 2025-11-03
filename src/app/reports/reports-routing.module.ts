import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReportRoutes, ReportsPermission } from './enums/report.enums';
import { AuthguardService } from '../core/services/auth_guard.service';
import { ReportsDetailsComponent } from './pages/reports-details/reports-details.component';
import { ReportsComponent } from './reports.component';
import { ReportsListComponent } from './pages/reports-list/reports-list.component';
import { ReportsSavedComponent } from './pages/reports-saved/reports-saved.component';
import { ReportsScheduledComponent } from './pages/reports-scheduled/reports-scheduled.component';

const routes: Routes = [
  {
    path: '',
    component: ReportsComponent,
    children: [
      {
        path: '',
        redirectTo: ReportRoutes.List,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: [ReportsPermission],
        },
        pathMatch: 'full',
      },
      {
        path: ReportRoutes.List,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: [ReportsPermission],
        },
        component: ReportsListComponent,
      },
      {
        path: ReportRoutes.Details,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: [ReportsPermission],
        },
        children: [
          {
            path: ':report',
            canActivateChild: [AuthguardService],
            data: {
              userRoles: [ReportsPermission],
            },
            component: ReportsDetailsComponent,
          },
        ],
      },
      {
        path: ReportRoutes.Saved,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: [ReportsPermission],
        },
        component: ReportsSavedComponent,
      },
      {
        path: ReportRoutes.Schediled,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: [ReportsPermission],
        },
        component: ReportsScheduledComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsRoutingModule {}
