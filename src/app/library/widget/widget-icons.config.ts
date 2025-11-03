import { IWidgetIcon } from "./widget.interfaces";
import { IconNames, Widgets } from "./widget.types";

export const widgetIcons: { [widget: string]: IWidgetIcon } = {
    [Widgets.QuickAddJob]: {icon: IconNames.AddJob, iconColor: '#776cff'},
    [Widgets.QuickSpendAnalytics]: {icon: IconNames.SpendAnalytics, iconColor: '#e59f00'},
    [Widgets.QuickContactSupport]: {icon: IconNames.ContactSupport, iconColor: '#23d99b'},
    [Widgets.QuickCurrentOpenings]: {icon: IconNames.CurrentOpenings, iconColor: '#d52d9b'},
    [Widgets.QuickActiveJobs]: {icon: IconNames.ActiveJob, iconColor: '#a0a4ff'},
    [Widgets.QuickResumeToReview]: {icon: IconNames.ResumeToReview, iconColor: '#ce4e4e'},
    [Widgets.QuickHeadCount]: {icon: IconNames.HeadCount, iconColor: '#27799d'},
    [Widgets.QuickPendingExpenses]: {icon: IconNames.PendingExpenses, iconColor: '#5bb247'},
    [Widgets.QuickContractEnding]: {icon: IconNames.ContractEnding, iconColor: '#3bc740'},
    [Widgets.QuickPendingTimesheets]: {icon: IconNames.PendingTimesheets, iconColor: '#6e6efd'},
    [Widgets.QuickOpenJobs]: {icon: IconNames.OpenJobs, iconColor: '#6e6efd'},
    [Widgets.QuickPendingInterviews]: {icon: IconNames.PendingInterviews, iconColor: '#6e6efd'},
    [Widgets.QuickPendingOffers]: {icon: IconNames.PendingOffers, iconColor: '#6e6efd'},
    [Widgets.QuickPendingWorkorders]: {icon: IconNames.PendingWorkorders, iconColor: '#6e6efd'},
    [Widgets.QuickCreateTimesheet]: {icon: IconNames.CreateTimesheet, iconColor: '#6e6efd'},
    [Widgets.QuickViewAllTimesheets]: {icon: IconNames.ViewAllTimesheets, iconColor: '#6e6efd'},
    [Widgets.QuickActiveContracts]: {icon: IconNames.ActiveContracts, iconColor: '#6e6efd'},
    [Widgets.QuickAddSOW]: {icon: IconNames.AddJob, iconColor: '#776cff'},
    [Widgets.ListSummary]: {icon: IconNames.Summary, iconColor: '#83c5be'},
    [Widgets.ListStatsReport]: {icon: IconNames.StatsReport, iconColor: '#d4a373'},
    [Widgets.ListPendingActions]: {icon: IconNames.PendingActions, iconColor: '#f48c06'},
    [Widgets.ListTimesheets]: {icon: IconNames.Timesheets, iconColor: '#6e6efd'},
    [Widgets.ListYourActivity]: {icon: IconNames.YourActivity, iconColor: '#6e6efd'},
    [Widgets.ListSOWPendingActions]: {icon: IconNames.SOWPendingActions, iconColor: '#6e6efd'},

    [Widgets.ChartHeadcount]: {icon: IconNames.HeadCount, iconColor: '#7b2cbf'},
    [Widgets.ChartSpendBySupplier]: {icon: IconNames.SpendBySupplier, iconColor: '#ff5c8a'},
    [Widgets.ChartSpendByCategory]: {icon: IconNames.SpendByCategory, iconColor: '#17b978'},
    [Widgets.ChartSpendByCandidate]: {icon: IconNames.SpendByCandidate, iconColor: '#d0b024'},
    [Widgets.ChartJobReport]: {icon: IconNames.JobReport, iconColor: '#b8b8ff'},
    [Widgets.ChartBudgetSpend]: {icon: IconNames.BudgetSpend, iconColor: '#c18cf9'},
    [Widgets.ChartDailySpend]: {icon: IconNames.DailySpend, iconColor: '#3dccc7'},
    [Widgets.Chart_RT_OT_Expense]: {icon: IconNames.RTOTExpense, iconColor: '#5c8001'},
    [Widgets.ChartSpendByYear]: {icon: IconNames.SpendByYear, iconColor: '#e0c469'},
    [Widgets.ChartTenureReport]: {icon: IconNames.TenureReport, iconColor: '#1b98e0'},
    [Widgets.ChartSpendOverTime]: {icon: IconNames.SpendOverTime, iconColor: '#1a659e'},
    [Widgets.ChartSpendReport]: {icon: IconNames.SpendReport, iconColor: '#00a6a6'},
    [Widgets.ChartCandidateByOT]: {icon: IconNames.CandidateByOT, iconColor: '#ef8354'},

    [Widgets.CalendarInterviewsAndOffers]: {icon: IconNames.InterviewsOffers, iconColor: '#d4a373'},
    [Widgets.CalendarLeaves]: {icon: IconNames.CalendarLeaves, iconColor: '#d4a373'},

    [Widgets.CustomCardMyProfile]: {icon: IconNames.MyProfile, iconColor: '#d4a373'}
};