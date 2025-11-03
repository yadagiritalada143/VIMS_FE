import { CalendarWidgetComponent } from '../library/widget/calendar-widget/calendar-widget.component';
import { ChartWidgetComponent } from '../library/widget/chart-widget/chart-widget.component';
import { CustomWidgetComponent } from '../library/widget/custom-widget/custom-widget.component';
import { PendingActionsWidgetComponent } from '../library/widget/list-widget/pending-actions/pending-actions-widget.component';
import { SowPendingActionsWidgetComponent } from '../library/widget/list-widget/sow-pending-actions/sow-pending-actions-widget.component';
import { ActiveHeadcountWidgetComponent } from '../library/widget/quick-link-widget/active-headcount-widget/active-headcount-widget.component';
import { AddJobWidgetComponent } from '../library/widget/quick-link-widget/add-job-widget/add-job-widget.component';
import { ContactSupportWidgetComponent } from '../library/widget/quick-link-widget/contact-support-widget/contact-support-widget.component';
import { CurrentOpeningsWidgetComponent } from '../library/widget/quick-link-widget/current-openings/current-openings-widget.component';
import { WidgetCategories, Widgets } from '../library/widget/widget.types';
import { IDefaultGridItemSizes, IWidgetGridItem } from './dashboard.interfaces';
import { ActiveJobWidgetComponent } from '../library/widget/quick-link-widget/active-job-widget/active-job-widget.component';
import { PendingActionsWidgetComponent as CountPendingActionsWidgetComponent } from '../library/widget/quick-link-widget/pending-actions-widget/pending-actions-widget.component';
import { SpendAnalyticsWidgetComponent } from '../library/widget/quick-link-widget/spend-analytics-widget/spend-analytics-widget.component';
import { ResumeToReviewWidgetComponent } from '../library/widget/quick-link-widget/resume-to-review-widget/resume-to-review-widget.component';
import { PendingExpensesWidgetComponent } from '../library/widget/quick-link-widget/pending-expenses-widget/pending-expenses-widget.component';
import { ContractEndingWidgetComponent } from '../library/widget/quick-link-widget/contract-ending-widget/contract-ending-widget.component';
import { PendingTimesheetsWidgetComponent } from '../library/widget/quick-link-widget/pending-timesheets-widget/pending-timesheets-widget.component';
import { ActiveContractsWidgetComponent } from '../library/widget/quick-link-widget/active-contracts-widget/active-contracts-widget.component';
import { OpenJobsWidgetComponent } from '../library/widget/quick-link-widget/open-jobs-widget/open-jobs-widget.component';
import { PendingInterviewsWidgetComponent } from '../library/widget/quick-link-widget/pending-interviews-widget/pending-interviews-widget.component';
import { PendingOffersWidgetComponent } from '../library/widget/quick-link-widget/pending-offers-widget/pending-offers-widget.component';
import { PendingWorkordersWidgetComponent } from '../library/widget/quick-link-widget/pending-workorders-widget/pending-workorders-widget.component';
import { SummaryWidgetComponent } from '../library/widget/list-widget/summary/summary-widget.component';
import { StatsReportWidgetComponent } from '../library/widget/list-widget/stats-report/stats-report-widget.component';
import { CreateTimesheetComponent } from '../library/widget/quick-link-widget/create-timesheet/create-timesheet.component';
import { ViewAllTimesheetsComponent } from '../library/widget/quick-link-widget/view-all-timesheets/view-all-timesheets.component';
import { ListTimesheetsComponent } from '../library/widget/list-widget/list-timesheets/list-timesheets.component';
import { TimesheetsRejectedComponent } from '../library/widget/table-widget/timesheets-rejected/timesheets-rejected.component';
import { TimesheetsToSubmitComponent } from '../library/widget/table-widget/timesheets-to-submit/timesheets-to-submit.component';
import { CompleteComplainceCheckComponent } from '../library/widget/quick-link-widget/complete-complaince-check/complete-complaince-check.component';
import { AddSOWWidgetComponent } from '../library/widget/quick-link-widget/add-sow-widget/add-sow-widget.component';

export const widgetTypes = {
    // --- MOCKUP WIDGETS: QUICK LINK --- //
    [Widgets.QuickAddAssignment]: AddJobWidgetComponent,
    [Widgets.quickCompleteComplainceCheck]: CompleteComplainceCheckComponent,
    [Widgets.QuickAddJob]: AddJobWidgetComponent,
    [Widgets.QuickActiveJobs]: ActiveJobWidgetComponent,
    [Widgets.QuickPendingAction]: CountPendingActionsWidgetComponent,
    [Widgets.QuickSpendAnalytics]: SpendAnalyticsWidgetComponent,
    [Widgets.QuickContactSupport]: ContactSupportWidgetComponent,
    [Widgets.QuickCurrentOpenings]: CurrentOpeningsWidgetComponent,
    [Widgets.QuickResumeToReview]: ResumeToReviewWidgetComponent,
    [Widgets.QuickHeadCount]: ActiveHeadcountWidgetComponent,
    [Widgets.QuickPendingExpenses]: PendingExpensesWidgetComponent,
    [Widgets.QuickContractEnding]: ContractEndingWidgetComponent,
    [Widgets.QuickPendingTimesheets]: PendingTimesheetsWidgetComponent,
    [Widgets.QuickCreateTimesheet]: CreateTimesheetComponent,
    [Widgets.QuickViewAllTimesheets]: ViewAllTimesheetsComponent,
    [Widgets.QuickActiveContracts]: ActiveContractsWidgetComponent,
    [Widgets.QuickOpenJobs]: OpenJobsWidgetComponent,
    [Widgets.QuickPendingInterviews]: PendingInterviewsWidgetComponent,
    [Widgets.QuickPendingOffers]: PendingOffersWidgetComponent,
    [Widgets.QuickPendingWorkorders]: PendingWorkordersWidgetComponent,
    [Widgets.QuickAddSOW]: AddSOWWidgetComponent,
    // --- LISTS --- //
    [Widgets.ListSummary]: SummaryWidgetComponent,
    [Widgets.ListStatsReport]: StatsReportWidgetComponent,
    [Widgets.ListPendingActions]: PendingActionsWidgetComponent,
    [Widgets.ListYourActivity]: PendingActionsWidgetComponent,
    [Widgets.ListSOWPendingActions]: SowPendingActionsWidgetComponent,
    [Widgets.ListTimesheets]: ListTimesheetsComponent,

    // --- CHARTS --- //
    [Widgets.ChartBudgetSpend]: ChartWidgetComponent,
    [Widgets.ChartCandidateByOT]: ChartWidgetComponent,
    [Widgets.ChartDailySpend]: ChartWidgetComponent,
    [Widgets.ChartHeadcount]: ChartWidgetComponent,
    [Widgets.ChartJobReport]: ChartWidgetComponent,
    [Widgets.ChartSpendByCandidate]: ChartWidgetComponent,
    [Widgets.ChartSpendByCategory]: ChartWidgetComponent,
    [Widgets.ChartSpendBySupplier]: ChartWidgetComponent,
    [Widgets.ChartSpendByYear]: ChartWidgetComponent,
    [Widgets.ChartSpendOverTime]: ChartWidgetComponent,
    [Widgets.ChartSpendReport]: ChartWidgetComponent,
    [Widgets.ChartTenureReport]: ChartWidgetComponent,
    [Widgets.Chart_RT_OT_Expense]: ChartWidgetComponent,

    // --- CALENDARS --- //
    [Widgets.CalendarInterviewsAndOffers]: CalendarWidgetComponent,
    [Widgets.CalendarItems]: CalendarWidgetComponent,
    [Widgets.CalendarLeaves]: CalendarWidgetComponent,

    // --- TABLES --- //
    [Widgets.TableTimesheetsRejected]: TimesheetsRejectedComponent,
    [Widgets.TableTimesheetsToSubmit]: TimesheetsToSubmitComponent,

    // --- CUSTOM --- //
    [Widgets.CustomCardMyProfile]: CustomWidgetComponent
};

export const defaultVendorDashboardPosition: IWidgetGridItem[] = [
    { x: 0, y: 0, cols: 3, rows: 2, name: Widgets.QuickContactSupport },
    { x: 9, y: 0, cols: 4, rows: 3, name: Widgets.QuickPendingAction },
    { x: 12, y: 0, cols: 6, rows: 6, name: Widgets.ListPendingActions },
    { x: 0, y: 2, cols: 12, rows: 12, name: Widgets.CalendarInterviewsAndOffers },
];

export const defaultClientDashboardPosition: IWidgetGridItem[] = [
    { x: 0, y: 0, cols: 3, rows: 2, name: Widgets.QuickAddJob },
    { x: 3, y: 0, cols: 3, rows: 2, name: Widgets.QuickHeadCount },
    { x: 6, y: 0, cols: 3, rows: 2, name: Widgets.QuickCurrentOpenings },
    { x: 9, y: 0, cols: 3, rows: 2, name: Widgets.QuickContactSupport },
    { x: 9, y: 0, cols: 4, rows: 3, name: Widgets.QuickPendingAction },
    { x: 12, y: 0, cols: 6, rows: 6, name: Widgets.ListPendingActions },
    { x: 0, y: 2, cols: 12, rows: 12, name: Widgets.CalendarInterviewsAndOffers },
    { x: 12, y: 6, cols: 6, rows: 10, name: Widgets.ListSOWPendingActions }
];

export const defaultWorkerDashboardPosition: IWidgetGridItem[] = [
    { x: 0, y: 0, cols: 12, rows: 5, name: Widgets.CustomCardMyProfile },
    { x: 12, y: 0, cols: 3, rows: 2, name: Widgets.QuickCreateTimesheet },
    { x: 15, y: 0, cols: 3, rows: 2, name: Widgets.QuickViewAllTimesheets },
    { x: 12, y: 2, cols: 6, rows: 6, name: Widgets.ListTimesheets },
    { x: 0, y: 5, cols: 12, rows: 12, name: Widgets.CalendarLeaves },
];

export const defaultGridItemSizes: IDefaultGridItemSizes = {
    [WidgetCategories.QuickLink]: { x: 0, y: 0, cols: 3, rows: 2 },
    [WidgetCategories.Charts]: { x: 0, y: 0, cols: 6, rows: 6 },
    [WidgetCategories.Lists]: { x: 0, y: 0, cols: 6, rows: 6 },
    [WidgetCategories.Calendars]: { x: 0, y: 0, cols: 12, rows: 12 }
};

export const widgetCategoryByName = {
    [Widgets.QuickAddJob]: WidgetCategories.QuickLink,
    [Widgets.QuickActiveJobs]: WidgetCategories.QuickLink,
    [Widgets.QuickSpendAnalytics]: WidgetCategories.QuickLink,
    [Widgets.QuickContactSupport]: WidgetCategories.QuickLink,
    [Widgets.QuickCurrentOpenings]: WidgetCategories.QuickLink,
    [Widgets.QuickResumeToReview]: WidgetCategories.QuickLink,
    [Widgets.QuickHeadCount]: WidgetCategories.QuickLink,
    [Widgets.QuickPendingExpenses]: WidgetCategories.QuickLink,
    [Widgets.QuickPendingAction]: WidgetCategories.QuickLink,
    [Widgets.QuickContractEnding]: WidgetCategories.QuickLink,
    [Widgets.QuickPendingTimesheets]: WidgetCategories.QuickLink,
    [Widgets.QuickCreateTimesheet]: WidgetCategories.QuickLink,
    [Widgets.QuickViewAllTimesheets]: WidgetCategories.QuickLink,

    // --- LISTS --- //
    [Widgets.ListSummary]: WidgetCategories.Lists,
    [Widgets.ListStatsReport]: WidgetCategories.Lists,
    [Widgets.ListPendingActions]: WidgetCategories.Lists,
    [Widgets.ListSOWPendingActions]: WidgetCategories.Lists,
    [Widgets.ListTimesheets]: WidgetCategories.Lists,

    // --- CHARTS --- //
    [Widgets.ChartBudgetSpend]: WidgetCategories.Charts,
    [Widgets.ChartCandidateByOT]: WidgetCategories.Charts,
    [Widgets.ChartDailySpend]: WidgetCategories.Charts,
    [Widgets.ChartHeadcount]: WidgetCategories.Charts,
    [Widgets.ChartJobReport]: WidgetCategories.Charts,
    [Widgets.ChartSpendByCandidate]: WidgetCategories.Charts,
    [Widgets.ChartSpendByCategory]: WidgetCategories.Charts,
    [Widgets.ChartSpendBySupplier]: WidgetCategories.Charts,
    [Widgets.ChartSpendByYear]: WidgetCategories.Charts,
    [Widgets.ChartSpendOverTime]: WidgetCategories.Charts,
    [Widgets.ChartSpendReport]: WidgetCategories.Charts,
    [Widgets.ChartTenureReport]: WidgetCategories.Charts,
    [Widgets.Chart_RT_OT_Expense]: WidgetCategories.Charts,

    // --- CALENDARS --- //
    [Widgets.CalendarInterviewsAndOffers]: WidgetCategories.Calendars,
    [Widgets.CalendarLeaves]: WidgetCategories.Calendars,

    // --- CUSTOM --- //
    [Widgets.CustomCardMyProfile]: WidgetCategories.Custom
};
