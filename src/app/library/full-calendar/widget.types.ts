// import { ChartWidgetComponent } from './chart-widget/chart-widget.component';
// import { ListWidgetComponent } from './list-widget/list-widget.component';
// import { CalendarWidgetComponent } from './calendar-widget/calendar-widget.component';
// import { QuickLinkWidgetComponent } from './quick-link-widget/quick-link-widget.component';
// import { CustomWidgetComponent } from './custom-widget/custom-widget.component';

export enum WidgetCategories {
    QuickLink = 'quick_link',
    Lists = 'lists',
    Calendars = 'calendars',
    Charts = 'charts',
    Table = 'table',
    Custom = 'custom'
}

export enum WidgetActions {
    Link = 'link',
    Custom = 'custom'
}

export enum WidgetSizes {
    Small = 'small',
    Medium = 'medium',
    Large = 'large'
}

export enum WidgetTypes {
    Type = 'Type',
    Status = 'Status',
    Categoty = 'Category',
    Business_Need = 'Business need',
    Business_Unit = 'Business unit',
    Cost_Center = 'Cost center',
    Location = 'Location'
}

export enum ChartTypes {
    Bubble = 'buble',
    Donut = 'donut',
    Pie = 'pie',
    Line = 'line',
    Map = 'map',
    LineDetailed = 'lineDetailed',
    Vertical = 'vertical',
    VerticalDouble = 'verticalDouble',
    Horizontal = 'horizontal',
    Treemap = 'treemap',
    Spiral = 'spiral',
    ConnectedLines = 'connected_lines',
    Liquid = 'liquid',
    Area = 'area',
    StackedVertical = 'StackedVertical',
    StackedHorizontal = 'StackedHorizontal'
}

export enum Widgets {
    ////////////// MOCKUP WIDGETS//////////
    // --- QUICK LINK --- //
    QuickAddJob = 'quick_add_job',
    quickCompleteComplainceCheck = 'quick_complete_complaince_check',
    QuickAddAssignment = 'quick_add_assignment',
    QuickSpendAnalytics = 'quick_spend_analytics',
    QuickContactSupport = 'quick_contact_support',
    QuickCurrentOpenings = 'quick_current_openings',
    QuickActiveJobs = 'quick_active_jobs',
    QuickOpenJobs = 'quick_open_jobs',
    QuickResumeToReview = 'quick_resume_to_review',
    QuickHeadCount = 'quick_head_count',
    QuickPendingExpenses = 'quick_pending_expenses',
    QuickContractEnding = 'quick_contract_ending',
    QuickActiveContracts = 'quick_active_contracts',
    QuickPendingTimesheets = 'quick_pending_timesheets',
    QuickPendingOffers = 'quick_pending_offers',
    QuickPendingWorkorders = 'quick_pending_workorders',
    QuickPendingInterviews = 'quick_pending_interviews',
    QuickViewAllTimesheets = 'quick_view_all_timesheets',
    QuickCreateTimesheet = 'quick_create_timesheet',
    QuickAddSOW = 'quick_add_sow',

    // --- LISTS --- //
    ListSummary = 'list_summary',
    ListStatsReport = 'list_stats_report',
    ListSOWPendingActions = 'list_sow_pending_actions',
    ListPendingActions = 'list_pending_actions',
    ListYourActivity = 'list_your_activity',
    ListTimesheets = 'list_timesheets',

    // --- CHARTS --- //
    ChartHeadcount = 'chart_headcount',
    ChartSpendBySupplier = 'chart_spend_by_supplier',
    ChartSpendByCategory = 'chart_spend_by_category',
    ChartSpendByCandidate = 'chart_spend_by_candidate',
    ChartJobReport = 'chart_job_report',
    ChartBudgetSpend = 'chart_budget_spend',
    ChartDailySpend = 'chart_daily_spend',
    ChartSpendByYear = 'chart_spend_by_year',
    ChartSpendOverTime = 'chart_spend_over_time',
    ChartSpendReport = 'chart_spend_report',
    ChartTenureReport = 'chart_tenure_report',
    ChartCandidateByOT = 'chart_candidate_by_ot',
    Chart_RT_OT_Expense = 'chart_rt_ot_expense',

    // --- CALENDARS --- //
    CalendarItems = 'calendar_items',
    CalendarInterviewsAndOffers = 'calendar_interview_and_offers',
    CalendarLeaves = 'calendar_leaves',

    // --- TABLES --- //
    TableTimesheetsRejected = 'table_timesheets_rejected',
    TableTimesheetsToSubmit = 'table_timesheets_to_submit',

    // --- CUSTOM --- //
    CustomCardMyProfile = 'custom_card_my_profile'
}

export enum IconNames {
    /// Quick-link
    AddJob = 'add_job',
    SpendAnalytics = 'spend_analytics',
    ContactSupport = 'contact_support',
    CurrentOpenings = 'current_openings',
    ActiveJob = 'active_job',
    ResumeToReview = 'resume_to_review',
    HeadCount = 'head_count',
    PendingExpenses = 'pending_expenses',
    ContractEnding = 'contract_ending',
    PendingTimesheets = 'pending_timesheets',
    OpenJobs = 'open_jobs',
    PendingOffers = 'pending_offers',
    PendingWorkorders = 'pending_workorders',
    PendingInterviews = 'pending_interviews',
    ViewAllTimesheets = 'view_all_timesheets',
    CreateTimesheet = 'create_timesheet',
    ActiveContracts = 'active_contracts',

    /// Lists
    Summary = 'summary',
    StatsReport = 'stats_report',
    PendingActions = 'pending_actions',
    Timesheets = 'timesheets',
    YourActivity = 'your_activity',
    SOWPendingActions = 'sow_pending_actions',

    // Charts
    SpendBySupplier = 'spend_by_supplier',
    SpendByCategory = 'spend_by_category',
    SpendByCandidate = 'spend_by_candidate',
    JobReport = 'job_report',
    BudgetSpend = 'budget_spend',
    DailySpend = 'daily_spend',
    RTOTExpense = 'rt_ot_expense',
    SpendByYear = 'spend_by_year',
    TenureReport = 'tenure_report',
    SpendOverTime = 'spend_over_time',
    SpendReport = 'spend_report',
    CandidateByOT = 'candidate_by_ot',

    // Calendars
    InterviewsOffers = 'interviews_offers',
    CalendarLeaves = 'calendar_leaves',

    // Custom
    MyProfile = 'my_profile'
}
