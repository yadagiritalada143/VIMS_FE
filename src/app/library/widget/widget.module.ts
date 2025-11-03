import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { WidgetComponent } from './widget.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { VmsTableModule } from '../smartTable/vms-table.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormRendererModule } from '../form-renderer/form-renderer.module';
import { ChartWidgetComponent } from './chart-widget/chart-widget.component';
import { CalendarWidgetComponent } from './calendar-widget/calendar-widget.component';
import { ListWidgetComponent } from './list-widget/list-widget.component';
import { PendingActionsWidgetComponent as QuickPendingActionsWidgetComponent } from './quick-link-widget/pending-actions-widget/pending-actions-widget.component';
import { PendingActionsWidgetComponent } from './list-widget/pending-actions/pending-actions-widget.component';
import { SowPendingActionsWidgetComponent } from './list-widget/sow-pending-actions/sow-pending-actions-widget.component';
import { QuickLinkWidgetComponent } from './quick-link-widget/quick-link-widget.component';
import { CustomWidgetComponent } from './custom-widget/custom-widget.component';
import { AddJobWidgetComponent } from './quick-link-widget/add-job-widget/add-job-widget.component';
import { ContactSupportWidgetComponent } from './quick-link-widget/contact-support-widget/contact-support-widget.component';
import { ActiveHeadcountWidgetComponent } from './quick-link-widget/active-headcount-widget/active-headcount-widget.component';
import { CurrentOpeningsWidgetComponent } from './quick-link-widget/current-openings/current-openings-widget.component';
import { SvmsLineChartModule } from '../charts/svms-line-chart/svms-line-chart.module';
import { SvmsPieChartModule } from '../charts/svms-pie-chart/svms-pie-chart.module';
import { SvmsAreaChartModule } from '../charts/svms-area-chart/svms-area-chart.module';
import { SvmsColumnChartModule } from '../charts/svms-column-chart/svms-column-chart.module';
import { SvmsHorisontalColumnChartModule } from '../charts/svms-horisontal-column-chart/svms-horisontal-column-chart.module';
import { SvmsStateChartModule } from '../charts/svms-state-chart/svms-state-chart.module';
import { ActiveJobWidgetComponent } from './quick-link-widget/active-job-widget/active-job-widget.component';
import { SpendAnalyticsWidgetComponent } from './quick-link-widget/spend-analytics-widget/spend-analytics-widget.component';
import { ResumeToReviewWidgetComponent } from './quick-link-widget/resume-to-review-widget/resume-to-review-widget.component';
import { PendingExpensesWidgetComponent } from './quick-link-widget/pending-expenses-widget/pending-expenses-widget.component';
import { ContractEndingWidgetComponent } from './quick-link-widget/contract-ending-widget/contract-ending-widget.component';
import { PendingTimesheetsWidgetComponent } from './quick-link-widget/pending-timesheets-widget/pending-timesheets-widget.component';
import { SummaryWidgetComponent } from './list-widget/summary/summary-widget.component';
import { StatsReportWidgetComponent } from './list-widget/stats-report/stats-report-widget.component';
import { RouterModule } from '@angular/router';
import { SvmsConnectedScatterplotChartModule } from '../charts/svms-connected-scatterplot-chart/svms-connected-scatterplot-chart.module';
import { SvmsBubbleChartModule } from '../charts/svms-bubble-chart/svms-bubble-chart.module';
import { SvmsLiquidFillChartModule } from '../charts/svms-liquid-fill-chart/svms-liquid-fill-chart.module';
import { SvmsSpiralChartModule } from '../charts/svms-spiral-chart/svms-spiral-chart.module';
import { WidgetIconComponent } from './widget-icon/widget-icon.component';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { CreateTimesheetComponent } from './quick-link-widget/create-timesheet/create-timesheet.component';
import { ViewAllTimesheetsComponent } from './quick-link-widget/view-all-timesheets/view-all-timesheets.component';
import { ListTimesheetsComponent } from './list-widget/list-timesheets/list-timesheets.component';
import { FullCalendarModule } from '../full-calendar/full-calendar.module';
import { TableWidgetComponent } from './table-widget/table-widget.component';
import { TimesheetsToSubmitComponent } from './table-widget/timesheets-to-submit/timesheets-to-submit.component';
import { TimesheetsRejectedComponent } from './table-widget/timesheets-rejected/timesheets-rejected.component';
import { PaginatorComponent } from './table-widget/utils/paginator/paginator.component';
import { PendingInterviewsWidgetComponent } from './quick-link-widget/pending-interviews-widget/pending-interviews-widget.component';
import { PendingOffersWidgetComponent } from './quick-link-widget/pending-offers-widget/pending-offers-widget.component';
import { PendingWorkordersWidgetComponent } from './quick-link-widget/pending-workorders-widget/pending-workorders-widget.component';
import { OpenJobsWidgetComponent } from './quick-link-widget/open-jobs-widget/open-jobs-widget.component';
import { ActiveContractsWidgetComponent } from './quick-link-widget/active-contracts-widget/active-contracts-widget.component';
import { CompleteComplainceCheckComponent } from './quick-link-widget/complete-complaince-check/complete-complaince-check.component';
import { AddSOWWidgetComponent } from './quick-link-widget/add-sow-widget/add-sow-widget.component';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [
    WidgetComponent,
    ChartWidgetComponent,
    CalendarWidgetComponent,
    ListWidgetComponent,
    PendingActionsWidgetComponent,
    SowPendingActionsWidgetComponent,
    QuickLinkWidgetComponent,
    CustomWidgetComponent,
    AddJobWidgetComponent,
    ContactSupportWidgetComponent,
    ActiveHeadcountWidgetComponent,
    CurrentOpeningsWidgetComponent,
    ActiveJobWidgetComponent,
    SpendAnalyticsWidgetComponent,
    ResumeToReviewWidgetComponent,
    PendingExpensesWidgetComponent,
    ContractEndingWidgetComponent,
    PendingTimesheetsWidgetComponent,
    SummaryWidgetComponent,
    StatsReportWidgetComponent,
    WidgetIconComponent,
    CreateTimesheetComponent,
    ViewAllTimesheetsComponent,
    ListTimesheetsComponent,
    TableWidgetComponent,
    TimesheetsToSubmitComponent,
    TimesheetsRejectedComponent,
    PaginatorComponent,
    PendingInterviewsWidgetComponent,
    PendingOffersWidgetComponent,
    PendingWorkordersWidgetComponent,
    OpenJobsWidgetComponent,
    ActiveContractsWidgetComponent,
    CompleteComplainceCheckComponent,
    AddSOWWidgetComponent,
    QuickPendingActionsWidgetComponent,
  ],
  exports: [WidgetIconComponent],
  imports: [
    CommonModule,
    RouterModule,
    NgxSkeletonLoaderModule,
    SharedModule,
    VmsTableModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    FormRendererModule,
    SvmsLineChartModule,
    SvmsPieChartModule,
    SvmsColumnChartModule,
    SvmsStateChartModule,
    SvmsAreaChartModule,
    SvmsHorisontalColumnChartModule,
    SvmsBubbleChartModule,
    SvmsLiquidFillChartModule,
    SvmsConnectedScatterplotChartModule,
    SvmsSpiralChartModule,
    NewSharedModule,
    FullCalendarModule,
    I18NextModule,
  ],
  providers: [
    DatePipe
  ]
})

export class WidgetModule { }
