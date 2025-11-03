import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountCodeSetupRoutingModule } from './account-code-setup-routing.module';
import { AccountCodeSetupComponent } from './account-code-setup.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../shared/shared.module';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { TimesheetService } from '../wipro-timesheet/timesheet.service';
import { HourlyTimeSheetService } from '../wipro-timesheet/timesheet/hourly-timesheet/hourly-time-sheet.service';
import { LogsModule } from '../library/logs/logs.module';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { I18NextModule } from 'angular-i18next';



@NgModule({
  declarations: [AccountCodeSetupComponent],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    AccountCodeSetupRoutingModule,
    NgSelectModule,
    SharedModule,
    NewSharedModule,
    LogsModule,
    NgxSkeletonLoaderModule,
    I18NextModule,
  ],
  providers: [
    TimesheetService,
    HourlyTimeSheetService
  ]
})
export class AccountCodeSetupModule { }
