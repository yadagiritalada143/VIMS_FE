import { IClientDefaultDashboard, IVendorDefaultDashboard, IWorkerDefaultDashboard } from 'src/app/dashboard/dashboard.interfaces';
import { calendarWidgetsConfig } from './calendar-widget/calendar-widget.model';
import { listWidgetsConfig } from './list-widget/list-widget.model';
import { quickLinkWidgetsConfig } from './quick-link-widget/quick-link-widget.model';
import { ChartTypes, WidgetCategories, Widgets } from './widget.types';
import { chartWidgetsConfig } from './chart-widget/chart-widget.model';
import { customWidgetsConfig } from './custom-widget/custom-widget.model';

export let WidgetsDataByRole = {
    [WidgetCategories.Calendars]: {},
    [WidgetCategories.Lists]: {},
    [WidgetCategories.Charts]: {},
    [WidgetCategories.QuickLink]: {},
    [WidgetCategories.Table]: {},
    [WidgetCategories.Custom]: {}
  };

export const defaultVendorWidgetConfigs: IVendorDefaultDashboard = {
    [Widgets.QuickContactSupport]: quickLinkWidgetsConfig.quick_contact_support,
    [Widgets.ListPendingActions]: listWidgetsConfig.list_pending_actions,
    [Widgets.CalendarInterviewsAndOffers]: calendarWidgetsConfig.calendar_interview_and_offers
};

export const defaultClientWidgetConfigs: IClientDefaultDashboard = {
    [Widgets.QuickHeadCount]: quickLinkWidgetsConfig.quick_head_count,
    [Widgets.QuickContactSupport]: quickLinkWidgetsConfig.quick_contact_support,
    [Widgets.QuickAddJob]: quickLinkWidgetsConfig.quick_add_job,
    [Widgets.QuickAddSOW]: quickLinkWidgetsConfig.quick_add_sow,
    [Widgets.QuickCurrentOpenings]: quickLinkWidgetsConfig.quick_current_openings,
    [Widgets.ListPendingActions]: listWidgetsConfig.list_pending_actions,
    [Widgets.CalendarInterviewsAndOffers]: calendarWidgetsConfig.calendar_interview_and_offers,
    [Widgets.ListSOWPendingActions]: listWidgetsConfig.list_sow_pending_actions
};

export const defaultWorkerWidgetConfigs: IWorkerDefaultDashboard = {
    [Widgets.CustomCardMyProfile]: customWidgetsConfig.custom_card_my_profile,
    [Widgets.QuickCreateTimesheet]: quickLinkWidgetsConfig.quick_create_timesheet,
    [Widgets.QuickViewAllTimesheets]: quickLinkWidgetsConfig.quick_view_all_timesheets,
    [Widgets.ListTimesheets]: listWidgetsConfig.list_timesheets,
    [Widgets.CalendarLeaves]: calendarWidgetsConfig.calendar_leaves
};

export const defaultChartTypes = [
    {name: ChartTypes.Vertical, icon: 'bar_chart'},
    {name: ChartTypes.VerticalDouble, icon: 'bar_chart'},
    {name: ChartTypes.Horizontal, icon: 'subject'},
    {name: ChartTypes.Pie, icon: 'pie_chart'},
    {name: ChartTypes.Line, icon: 'show_chart'},
    {name: ChartTypes.Donut, icon: 'data_usage'},
    {name: ChartTypes.ConnectedLines, icon: 'show_chart'},
    {name: ChartTypes.Bubble, icon: 'show_chart'},
    {name: ChartTypes.Map, icon: 'language'},
    {name: ChartTypes.LineDetailed, icon: 'show_chart'},
    {name: ChartTypes.Spiral, icon: 'data_usage'},
    {name: ChartTypes.Liquid, icon: 'opacity'},
];


export const ClientWidgetConfigs = {
    widget_data: {
        [WidgetCategories.QuickLink]: {
            [Widgets.QuickAddJob]: quickLinkWidgetsConfig.quick_add_job,
            [Widgets.QuickSpendAnalytics]: quickLinkWidgetsConfig.quick_spend_analytics,
            [Widgets.QuickContactSupport]: quickLinkWidgetsConfig.quick_contact_support,
            [Widgets.QuickActiveJobs]: quickLinkWidgetsConfig.quick_active_jobs,
            [Widgets.QuickResumeToReview]: quickLinkWidgetsConfig.quick_resume_to_review,
            [Widgets.QuickHeadCount]: quickLinkWidgetsConfig.quick_head_count,
            [Widgets.QuickPendingTimesheets]: quickLinkWidgetsConfig.quick_pending_timesheets,
            [Widgets.QuickPendingExpenses]: quickLinkWidgetsConfig.quick_pending_expenses,
            [Widgets.QuickContractEnding]: quickLinkWidgetsConfig.quick_contract_ending,
            [Widgets.QuickCurrentOpenings]: quickLinkWidgetsConfig.quick_current_openings
        },
        [WidgetCategories.Lists]: {
            [Widgets.ListYourActivity]: listWidgetsConfig.list_your_activity,
            [Widgets.ListStatsReport]: listWidgetsConfig.list_stats_report,
            [Widgets.ListPendingActions]: listWidgetsConfig.list_pending_actions
        },
        [WidgetCategories.Charts]: {
            [Widgets.ChartHeadcount]: chartWidgetsConfig.chart_headcount,
            [Widgets.ChartSpendBySupplier]: chartWidgetsConfig.chart_spend_by_supplier,
            [Widgets.ChartSpendByCategory]: chartWidgetsConfig.chart_spend_by_category,
            [Widgets.ChartBudgetSpend]: chartWidgetsConfig.chart_budget_spend,
            [Widgets.ChartDailySpend]: chartWidgetsConfig.chart_daily_spend,
            [Widgets.Chart_RT_OT_Expense]: chartWidgetsConfig.chart_rt_ot_expense,
            [Widgets.ChartSpendByCandidate]: chartWidgetsConfig.chart_spend_by_candidate,
            [Widgets.ChartJobReport]: chartWidgetsConfig.chart_job_report,
            [Widgets.ChartSpendByYear]: chartWidgetsConfig.chart_spend_by_year,
            [Widgets.ChartSpendOverTime]: chartWidgetsConfig.chart_spend_over_time,
            [Widgets.ChartSpendReport]: chartWidgetsConfig.chart_spend_report,
            [Widgets.ChartTenureReport]: chartWidgetsConfig.chart_tenure_report,
            [Widgets.ChartCandidateByOT]: chartWidgetsConfig.chart_candidate_by_ot
        },
        [WidgetCategories.Calendars]: {
            [Widgets.CalendarInterviewsAndOffers]: calendarWidgetsConfig.calendar_interview_and_offers
        }
    }
};

export const VendorWidgetConfigs = {
    widget_data: {
        [WidgetCategories.QuickLink]: {
            [Widgets.QuickContactSupport]: quickLinkWidgetsConfig.quick_contact_support
        },
        [WidgetCategories.Lists]: {
            [Widgets.ListPendingActions]: listWidgetsConfig.list_pending_actions
        },
        [WidgetCategories.Charts]: {},
        [WidgetCategories.Calendars]: {
            [Widgets.CalendarInterviewsAndOffers]: calendarWidgetsConfig.calendar_interview_and_offers
        }
    }
};

export const HiringManagerWidgetConfigs = {
    widget_data: {
        [WidgetCategories.QuickLink]: {
            [Widgets.QuickAddJob]: quickLinkWidgetsConfig.quick_add_job,
            [Widgets.QuickContactSupport]: quickLinkWidgetsConfig.quick_contact_support,
            [Widgets.QuickHeadCount]: quickLinkWidgetsConfig.quick_head_count
        },
        [WidgetCategories.Lists]: {
            [Widgets.ListPendingActions]: listWidgetsConfig.list_pending_actions
        },
        [WidgetCategories.Charts]: {
            [Widgets.ChartHeadcount]: chartWidgetsConfig.chart_headcount,
            [Widgets.ChartBudgetSpend]: chartWidgetsConfig.chart_budget_spend
        },
        [WidgetCategories.Calendars]: {
            [Widgets.CalendarInterviewsAndOffers]: calendarWidgetsConfig.calendar_interview_and_offers
        }
    }
};

export const WorkerWidgetConfigs = {
    widget_data: {
        [WidgetCategories.QuickLink]: {
            [Widgets.QuickViewAllTimesheets]: quickLinkWidgetsConfig.quick_view_all_timesheets,
            [Widgets.QuickCreateTimesheet]: quickLinkWidgetsConfig.quick_create_timesheet,
        },
        [WidgetCategories.Lists]: {
            [Widgets.ListTimesheets]: listWidgetsConfig.list_timesheets
        },
        [WidgetCategories.Charts]: {},
        [WidgetCategories.Calendars]: {
            [Widgets.CalendarLeaves]: calendarWidgetsConfig.calendar_leaves
        },
        [WidgetCategories.Custom]: {
            [Widgets.CustomCardMyProfile]: customWidgetsConfig.custom_card_my_profile
        }
    }
};

export const MasterWidgetConfigs = {
    widget_data: {
        [WidgetCategories.QuickLink]: {
            [Widgets.QuickAddJob]: quickLinkWidgetsConfig.quick_add_job,
            [Widgets.QuickSpendAnalytics]: quickLinkWidgetsConfig.quick_spend_analytics,
            [Widgets.QuickContactSupport]: quickLinkWidgetsConfig.quick_contact_support,
            [Widgets.QuickActiveJobs]: quickLinkWidgetsConfig.quick_active_jobs,
            [Widgets.QuickOpenJobs]: quickLinkWidgetsConfig.quick_open_jobs,
            [Widgets.QuickResumeToReview]: quickLinkWidgetsConfig.quick_resume_to_review,
            [Widgets.QuickHeadCount]: quickLinkWidgetsConfig.quick_head_count,
            [Widgets.QuickPendingTimesheets]: quickLinkWidgetsConfig.quick_pending_timesheets,
            [Widgets.QuickPendingExpenses]: quickLinkWidgetsConfig.quick_pending_expenses,
            [Widgets.QuickPendingWorkorders]: quickLinkWidgetsConfig.quick_pending_workorders,
            [Widgets.QuickPendingInterviews]: quickLinkWidgetsConfig.quick_pending_interviews,
            [Widgets.QuickPendingOffers]: quickLinkWidgetsConfig.quick_pending_offers,
            [Widgets.QuickContractEnding]: quickLinkWidgetsConfig.quick_contract_ending,
            [Widgets.QuickActiveContracts]: quickLinkWidgetsConfig.quick_active_contracts
        },
        [WidgetCategories.Lists]: {
            [Widgets.ListYourActivity]: listWidgetsConfig.list_your_activity,
            [Widgets.ListStatsReport]: listWidgetsConfig.list_stats_report,
            [Widgets.ListPendingActions]: listWidgetsConfig.list_summary,
            [Widgets.ListPendingActions]: listWidgetsConfig.list_pending_actions
        },
        [WidgetCategories.Charts]: {
            [Widgets.ChartHeadcount]: chartWidgetsConfig.chart_headcount,
            [Widgets.ChartSpendBySupplier]: chartWidgetsConfig.chart_spend_by_supplier,
            [Widgets.ChartSpendByCategory]: chartWidgetsConfig.chart_spend_by_category,
            [Widgets.ChartBudgetSpend]: chartWidgetsConfig.chart_budget_spend,
            [Widgets.ChartDailySpend]: chartWidgetsConfig.chart_daily_spend,
            [Widgets.Chart_RT_OT_Expense]: chartWidgetsConfig.chart_rt_ot_expense,
            [Widgets.ChartSpendByCandidate]: chartWidgetsConfig.chart_spend_by_candidate,
            [Widgets.ChartJobReport]: chartWidgetsConfig.chart_job_report,
            [Widgets.ChartSpendByYear]: chartWidgetsConfig.chart_spend_by_year,
            [Widgets.ChartSpendOverTime]: chartWidgetsConfig.chart_spend_over_time,
            [Widgets.ChartSpendReport]: chartWidgetsConfig.chart_spend_report,
            [Widgets.ChartTenureReport]: chartWidgetsConfig.chart_tenure_report,
            [Widgets.ChartCandidateByOT]: chartWidgetsConfig.chart_candidate_by_ot
        },
        [WidgetCategories.Calendars]: {
            [Widgets.CalendarInterviewsAndOffers]: calendarWidgetsConfig.calendar_interview_and_offers
        }
    }
};
