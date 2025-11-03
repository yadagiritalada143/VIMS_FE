import { WidgetCategories, Widgets, WidgetSizes } from '../widget.types'
import { IListWidget } from '../widget.interfaces'
import { widgetIcons } from '../widget-icons.config';


// --- MOCKUP WIDGETS --- //
const listSummary: IListWidget = {
  label: 'Summary',
  category: WidgetCategories.Lists,
  name: Widgets.ListSummary,
  apis: [
    {
      JobsToRelease: {
        api: '',
        label: 'Job Count',
        link: '/dashboard'
      },
      NewInterviewRequest: {
        api: '',
        label: 'New Interview',
        link: '/dashboard'
      },
      PendingTimesheets: {
        api: '/approval/program/<PROGRAM_ID>/timesheet/count?status=pending',
        label: 'Pending Timesheet Count',
        link: '/timesheet/list/pending'
      },
      Spend: {
        api: '',
        label: 'Total Spend',
        link: '/dashboard'
      },
      Hours: {
        api: '',
        label: 'Total Hours',
        link: '/dashboard'
      },
      Headcount: {
        api: '/assignment/programs/<PROGRAM_ID>/assignment/counts?status=approved',
        label: 'HeadCount',
        link: '/assignment/all-list/open'
      },
      PendingBudget: {
        api: '',
        label: 'Pending Budget Count',
        link: '/dashboard'
      }
    }
  ],
  link: '/',
  ...widgetIcons[Widgets.ListSummary],
  isActive: false,
  isExpandable: false,
  height: 12,
  width: 3,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const listStatsReport: IListWidget = {
  label: 'Stats Report',
  category: WidgetCategories.Lists,
  name: Widgets.ListStatsReport,
  apis: [
    {
      NewRequisitions: {
        api: '',
        label: 'Job Count',
        link: '/dashboard'
      },
      TotalSubmissions: {
        api: '',
        label: 'Total Submission Count',
        link: '/dashboard'
      },
      PendingOffers: {
        api: '',
        label: 'Pending Offer Count',
        link: '/dashboard'
      },
      ContractsIssued: {
        api: '',
        label: 'Pending Workorders Count',
        link: '/dashboard'
      }
    }
  ],
  link: '/',
  ...widgetIcons[Widgets.ListStatsReport],
  isActive: false,
  isExpandable: false,
  height: 7,
  width: 3,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
}

const listSOWPendingActions: IListWidget = {
  label: 'SOW Pending Actions',
  category: WidgetCategories.Lists,
  name: Widgets.ListSOWPendingActions,
  apis: [
    {
      ExpensesPendingApproval: {
        api: '/approval/programs/<PROGRAM_ID>/expense/user-approvals/count?status=pending',
        label: 'General Expense(s) Pending Approval',
        link: '/expense/general/submitted'
      },
      MiscExpensesPendingApproval: {
        api: '/approval/programs/<PROGRAM_ID>/misc_expense/user-approvals/count?status=pending',
        label: 'Misc Expense(s) Pending Approval',
        link: '/expense/misc/submitted'
      },
      TimesheetsPendingApproval: {
        api: '/approval/programs/<PROGRAM_ID>/timesheet/user-approvals/count?status=pending',
        label: 'Timesheet(s) Pending Approval',
        link: '/timesheet/list/pending'
      },
      WorkersPendingEvaluations: {
        api: '/assignment/programs/<PROGRAM_ID>/assignment/counts?status=evaluate-pending',
        label: 'Worker(s) Pending Evaluation',
        link: '/assignment/all-list/pending-evalution'
      }
    }
  ],
  link: '/',
  ...widgetIcons[Widgets.ListPendingActions],
  isActive: false,
  isExpandable: false,
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
}

const ListYourActivityConfig: IListWidget = {
  label: 'Your Activity',
  category: WidgetCategories.Lists,
  name: Widgets.ListYourActivity,
  apis: [
    {
      JobsToRelease: {
        api: '',
        label: 'Jobs To Release',
        link: '/dashboard'
      },
      NewInterviewRequest: {
        api: '',
        label: 'New Interviews',
        link: '/dashboard'
      },
      PendingBudget: {
        api: '',
        label: 'Pending Budget',
        link: '/dashboard'
      },
      PendingTimesheets: {
        api: '/approval/program/<PROGRAM_ID>/timesheet/count?status=pending',
        label: 'Pending Timesheet Count',
        link: '/timesheet/list/pending'
      }
    }
  ],
  link: '/',
  ...widgetIcons[Widgets.ListYourActivity],
  isActive: false,
  isExpandable: false,
  height: 6,
  width: 3,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
}


const pendingActionsWidgetConfig: IListWidget = {
  label: 'Pending Actions',
  category: WidgetCategories.Lists,
  name: Widgets.ListPendingActions,
  apis: [
    {
      TimesheetsPendingApproval: {
        api: '/approval/program/<PROGRAM_ID>/timesheet/count?status=pending',
        label: 'Timesheet(s) Pending Approval',
        link: '/timesheet/list/pending'
      },
      WorkersPendingEvaluations: {
        api: '/assignment/programs/<PROGRAM_ID>/assignment/counts?status=evaluate-pending',
        label: 'Worker(s) Pending Evaluation',
        link: '/assignment/all-list/pending-evalution'
      },
      BackgroundCheckVerification: {
        api: '/onboarding-manager/programs/<PROGRAM_ID>/onboarding/background-checklists/stats',
        label: 'Background Check Verification',
        link: '/dashboard'
      },
      ValidateOnboardingCompletion: {
        api: '/onboarding-manager/programs/<PROGRAM_ID>/onboarding/tasks/stats',
        label: 'Validate Onboarding Completion',
        link: '/dashboard'
      },
      NewJobRequests: {
        api: '',
        label: 'New Job Requests',
        link: '/dashboard'
      },
      PendingInterviews: {
        api: '',
        label: 'Pending Interviews',
        link: '/dashboard'
      },
      PendingOffers: {
        api: '',
        label: 'Pending Offers',
        link: '/dashboard'
      },
      PendingWorkorders: {
        api: '',
        label: 'Pending Workorders',
        link: '/dashboard'
      },
      PendingExpenses: {
        api: '',
        label: 'Pending Expenses',
        link: '/dashboard'
      },
      MissingTimesheets: {
        api: '',
        label: 'Missing Timesheets',
        link: '/dashboard'
      },
      PendingContractExtension: {
        api: '',
        label: 'Pending Contract Extension',
        link: '/dashboard'
      },
      ContractAmendmentsPendingApproval: {
        api: '',
        label: 'Contract Amendments Pending Approval',
        link: '/dashboard'
      },
      BudgetPendingApproval: {
        api: '',
        label: 'Budget Pending Approval',
        link: '/dashboard'
      }
    }
  ],
  link: '/',
  ...widgetIcons[Widgets.ListPendingActions],
  isActive: false,
  isExpandable: false,
  height: 13,
  width: 3,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['VENDOR'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
}

const listTimesheets: IListWidget = {
  label: 'Timesheets List',
  category: WidgetCategories.Lists,
  name: Widgets.ListTimesheets,
  apis: [
    {
      TimesheetsToSubmit: {
        api: '/timesheet/programs/<PROGRAM_ID>/timesheet/missing?page=1&limit=5&assignment_uuid=<ASSIGNMENT_ID>',
        label: 'Timesheets To Submit',
        link: '/dashboard'
      },
      RejectedTimesheets: {
        api: '/timesheet/programs/<PROGRAM_ID>/timesheet?status=rejected&limit=5&assignments=<ASSIGNMENT_ID>',
        label: 'Rejected Timesheets',
        link: '/dashboard'
      }
    }
  ],
  link: '/',
  ...widgetIcons[Widgets.ListTimesheets],
  isActive: false,
  isExpandable: false,
  height: 7,
  width: 3,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
}

export const listWidgetsConfig = {
  [Widgets.ListStatsReport]: listStatsReport,
  [Widgets.ListSummary]: listSummary,
  [Widgets.ListSOWPendingActions]: listSOWPendingActions,
  [Widgets.ListYourActivity]: ListYourActivityConfig,
  [Widgets.ListPendingActions]: pendingActionsWidgetConfig,
  [Widgets.ListTimesheets]: listTimesheets
}