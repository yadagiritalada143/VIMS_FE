import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimesheetListComponent } from './timesheet-list/timesheet-list.component';
import { TimesheetComponent } from './timesheet.component';
import { MonthlyTimesheetEntryComponent } from './timesheet/monthly-timesheet/monthly-timesheet-entry/monthly-timesheet-entry.component';
import { TimesheetRoutingModule } from './timesheet-routing.module';
import { MonthlyTimesheetBreadcrumbComponent } from './timesheet/monthly-timesheet/monthly-timesheet-breadcrumb/monthly-timesheet-breadcrumb.component';
import { MonthlyTimesheetHeaderComponent } from './timesheet/monthly-timesheet/monthly-timesheet-header/monthly-timesheet-header.component';
import { SharedModule } from '../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { MonthlyTimesheetDatePanelComponent } from './timesheet/monthly-timesheet/monthly-timesheet-entry/timesheet-date-panel/timesheet-date-panel.component';
import { TimesheetService } from './timesheet.service';
import { DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VmsTableModule } from '../library/smartTable/vms-table.module';
import { EnterTimesheetComponent } from './enter-timesheet/enter-timesheet.component';
import { TimesheetRejectComponent } from './timesheet-reject/timesheet-reject.component';
import { TimePanelComponent } from './timesheet/time-panel/time-panel.component';
import { AssignmentDetailsFlyoutComponent } from './assignment-details/assignment-details-flyout.component';
import { CopyMonthlyTimesheetComponent } from './timesheet/monthly-timesheet/monthly-timesheet-entry/copy-timesheet/copy-timesheet.component';
import { TimesheetRevisionHistoryComponent } from './timesheet/components/timesheet-revision-history/timesheet-revision-history.component';
import { HourlyTimesheetManualEntryComponent } from './timesheet/hourly-timesheet/hourly-timesheet-manual-entry/hourly-timesheet-manual-entry.component';
import { HourlyTimesheetBreadcrumbComponent } from './timesheet/components/timesheet-breadcrumb/timesheet-breadcrumb.component';
import { HourlyTimesheetHeaderComponent } from './timesheet/components/timesheet-header/timesheet-header.component';
import { HourlyTimeSheetService } from './timesheet/hourly-timesheet/hourly-time-sheet.service';
import { HourlyTimesheetAutomaticEntryComponent } from './timesheet/hourly-timesheet/hourly-timesheet-automatic-entry/hourly-timesheet-automatic-entry.component';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { TitoTimesheetEntryComponent } from './timesheet/TITO-timesheet-entry/tito-timesheet-entry.component';
import { TimesheetActionFlyoutComponent } from './timesheet/components/timesheet-action-flyout/timesheet-action-flyout.component';
import { TimesheetBillingDetailsComponent } from './timesheet/hourly-timesheet/timesheet-billing-details/timesheet-billing-details.component';
import { TimesheetActionsAlertsComponent } from './timesheet/components/timesheet-actions-alerts/timesheet-actions-alerts.component';
import { CopyTimesheetWidgetComponent } from './timesheet/components/copy-timesheet-widget/copy-timesheet-widget.component';
import { MonthlyHourBasedTimesheetDatePanelComponent } from './timesheet/hourly-timesheet/monthly-view/date-panel/monthly-hour-based-timesheet-date-panel.component';
import { MonthlyHourBasedCopyTimesheetComponent } from './timesheet/hourly-timesheet/monthly-view/copy-timesheet/monthly-hour-based-copy-timesheet.component';
import { MonthlyHourBasedTimesheetEntryComponent } from './timesheet/hourly-timesheet/monthly-view/monthly-hour-based-timesheet-entry.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { HourlyPrintComponentComponent } from './timesheet/hourly-timesheet/hourly-print-component/hourly-print-component.component';
import { LogsModule } from '../library/logs/logs.module';
import { DayTimesheetAutomaticEntryComponent } from './timesheet/day-timesheet/day-timesheet-automatic-entry/day-timesheet-automatic-entry.component';
import { DayTimeSheetService } from './timesheet/day-timesheet/day-time-sheet.service';
import { TITOTimesheetEntryNewComponent } from './timesheet/tito-timesheet-entry-new/tito-timesheet-entry-new.component';
import { AddTimeComponent } from './timesheet/components/add-time/add-time.component';
import { CustomFieldsModule } from '../library/custom-fields/custom-fields.module';
import { MultiApprovalsModule } from '../multi-approvals/multi-approvals.module';
import { I18NextModule } from 'angular-i18next';
import { TimesheetBillingDetailsNewComponent } from './timesheet/hourly-timesheet/timesheet-billing-details-new/timesheet-billing-details-new.component';
import { TimesheetSupportingTextComponent } from './timesheet/timesheet-supporting-text/timesheet-supporting-text.component';
import { HybridTimesheetComponent } from './timesheet/hybrid-timesheet/hybrid-timesheet.component';
import { TimesheetTabComponent } from './timesheet/components/timesheet-tab/timesheet-tab.component';
const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollY: true
};
@NgModule({
  declarations: [TimesheetListComponent, TimesheetComponent, MonthlyTimesheetEntryComponent,
    MonthlyTimesheetBreadcrumbComponent, MonthlyTimesheetHeaderComponent, MonthlyTimesheetDatePanelComponent,
    EnterTimesheetComponent, TimesheetRejectComponent, TimePanelComponent, AssignmentDetailsFlyoutComponent, CopyMonthlyTimesheetComponent, 
    MonthlyHourBasedCopyTimesheetComponent,TimesheetRevisionHistoryComponent, HourlyTimesheetManualEntryComponent, HourlyTimesheetBreadcrumbComponent,TimesheetBillingDetailsNewComponent,
    HourlyTimesheetHeaderComponent, HourlyTimesheetAutomaticEntryComponent,DayTimesheetAutomaticEntryComponent, TitoTimesheetEntryComponent, TimesheetActionFlyoutComponent, TimesheetBillingDetailsComponent, 
    TimesheetActionsAlertsComponent, CopyTimesheetWidgetComponent, MonthlyHourBasedTimesheetEntryComponent, MonthlyHourBasedTimesheetDatePanelComponent, HourlyPrintComponentComponent, TITOTimesheetEntryNewComponent, AddTimeComponent, TimesheetSupportingTextComponent, TimesheetTabComponent, HybridTimesheetComponent],
  imports: [
    CommonModule,
    TimesheetRoutingModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    VmsTableModule,
    NewSharedModule,
    PerfectScrollbarModule,
    LogsModule,
    CustomFieldsModule,
    MultiApprovalsModule,
    I18NextModule,
  ],
  exports: [AssignmentDetailsFlyoutComponent],
  providers: [
    TimesheetService,
    HourlyTimeSheetService,
    DayTimeSheetService,
    DatePipe,
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    }
  ],
})
export class TimesheetModule { }
