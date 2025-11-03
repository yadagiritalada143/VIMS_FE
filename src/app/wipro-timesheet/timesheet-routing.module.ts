import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TimesheetComponent } from './timesheet.component'
import { TimesheetListComponent } from './timesheet-list/timesheet-list.component';
import { MonthlyTimesheetEntryComponent } from './timesheet/monthly-timesheet/monthly-timesheet-entry/monthly-timesheet-entry.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';
import { HourlyTimesheetManualEntryComponent } from './timesheet/hourly-timesheet/hourly-timesheet-manual-entry/hourly-timesheet-manual-entry.component';
import { HourlyTimesheetAutomaticEntryComponent } from './timesheet/hourly-timesheet/hourly-timesheet-automatic-entry/hourly-timesheet-automatic-entry.component';
import { TitoTimesheetEntryComponent } from './timesheet/TITO-timesheet-entry/tito-timesheet-entry.component';
import { TimesheetWeeklyType } from './timesheet.enums';
import { TITOTimesheetEntryNewComponent } from './timesheet/tito-timesheet-entry-new/tito-timesheet-entry-new.component';
// import {​​​​​​​​ MonthlyHourBasedTimesheetEntryComponent }​​​​​​​​ from'./timesheet/hourly-timesheet/monthly-view/monthly-hour-based-timesheet-entry/monthly-hour-based-timesheet-entry.component';

import {MonthlyHourBasedTimesheetEntryComponent} from './timesheet/hourly-timesheet/monthly-view/monthly-hour-based-timesheet-entry.component';
import { HourlyPrintComponentComponent } from './timesheet/hourly-timesheet/hourly-print-component/hourly-print-component.component';
import { DayTimesheetAutomaticEntryComponent } from './timesheet/day-timesheet/day-timesheet-automatic-entry/day-timesheet-automatic-entry.component';
import { HybridTimesheetComponent } from './timesheet/hybrid-timesheet/hybrid-timesheet.component';

const routes: Routes = [
  { path: '', redirectTo: '', pathMatch: 'full' },

  {
    path: '',
    component: TimesheetComponent,
    children: [
      {
        path: 'list', component: TimesheetListComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['view_timesheet']
        }
      },
      {
        path: 'entry', component: MonthlyTimesheetEntryComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['create_timesheet', 'view_timesheet']
        }
      },
      {
        path: `hourly-timesheet/${TimesheetWeeklyType.MANUAL}`, component: HourlyTimesheetManualEntryComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['create_timesheet', 'view_timesheet']
        }
      },
      {
        path: `hourly-timesheet/${TimesheetWeeklyType.AUTOMATIC}`, component: HourlyTimesheetAutomaticEntryComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['create_timesheet', 'view_timesheet']
        }
      },
      {
        path: `day-timesheet/${TimesheetWeeklyType.AUTOMATIC}`, component: DayTimesheetAutomaticEntryComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['create_timesheet', 'view_timesheet']
        }
      },
      {
        path: `hybrid`, component: HybridTimesheetComponent , canActivateChild: [AuthguardService], data: {
          userRoles: ['create_timesheet', "view_timesheet"]
        }
      },
      {
        path: 'tito/entry', component: TitoTimesheetEntryComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['create_timesheet', 'view_timesheet']
        }
      },
      {
        path: 'tito/entry-new', component: TITOTimesheetEntryNewComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['create_timesheet', 'view_timesheet']
        }
      },
      {
        path: `hourly-timesheet/month`, component: MonthlyHourBasedTimesheetEntryComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['create_timesheet', 'view_timesheet']
        }
      },
      {
        path: 'list/:status', component: TimesheetListComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['view_timesheet']
        }
      },

      {
        path: 'print', component: HourlyPrintComponentComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['create_timesheet', 'view_timesheet']
        }
      },

    ],
  },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TimesheetRoutingModule { }
