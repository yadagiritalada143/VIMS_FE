import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TimesheetConfigurationRoutingModule } from './timesheet-configuration-routing.module';
import { TimesheetConfigurationListComponent } from './timesheet-configuration-list/timesheet-configuration-list.component';
import { VmsTableModule } from '.././../library/table/vms-table.module';
import { TimesheetConfigurationCreateComponent } from './timesheet-configuration-create/timesheet-configuration-create.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { FormsModule } from '@angular/forms';
import { SvmsHierarchyModule } from 'src/app/library/hierarchy/hierarchy.module';
import { LogsModule } from 'src/app/library/logs/logs.module';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [TimesheetConfigurationListComponent, TimesheetConfigurationCreateComponent],
  imports: [
    CommonModule,
    FormsModule,
    TimesheetConfigurationRoutingModule,
    VmsTableModule,
    SvmsHierarchyModule,
    SharedModule,
    NgSelectModule,
    NewSharedModule,
    LogsModule,
    I18NextModule,
  ],
})
export class TimesheetConfigurationModule { }
