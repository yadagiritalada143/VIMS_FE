import { WidgetCategories, Widgets, WidgetSizes } from '../widget.types';
import { IQuickLinkWidget } from '../widget.interfaces';
import { widgetIcons } from '../widget-icons.config';


// --- MOCKUP WIDGETS --- //
const quickAddJob: IQuickLinkWidget = {
  label: 'Add Job',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickAddJob,
  api: '/job-manager/programs/<PROGRAM_ID>/jobs?is_widget=true&status=ACTIVE_JOBS',
  ...widgetIcons[Widgets.QuickAddJob],
  isActive: false,
  isExpandable: false,
  link: '/jobs/create',
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickAddSOW: IQuickLinkWidget = {
  label: 'Add SOW',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickAddSOW,
  api: '/job-manager/programs/<PROGRAM_ID>/jobs?is_widget=true&status=ACTIVE_JOBS',
  ...widgetIcons[Widgets.QuickAddSOW],
  isActive: false,
  isExpandable: false,
  link: '/jobs/create',
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickSpendAnalytics: IQuickLinkWidget = {
  label: 'Spend Analytics',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickSpendAnalytics,
  api: '',
  ...widgetIcons[Widgets.QuickSpendAnalytics],
  isActive: false,
  isExpandable: false,
  link: '/dashboard',
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickContactSuport: IQuickLinkWidget = {
  label: 'Contact Support',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickContactSupport,
  api: '',
  ...widgetIcons[Widgets.QuickContactSupport],
  isActive: false,
  isExpandable: false,
  link: '/dashboard/contact-support',
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickCurrentOpenings: IQuickLinkWidget = {
  label: 'Current Openings',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickCurrentOpenings,
  api: '/job-manager/programs/<PROGRAM_ID>/jobs?is_widget=true&status=SOURCING',
  ...widgetIcons[Widgets.QuickCurrentOpenings],
  isActive: false,
  isExpandable: false,
  link: '/jobs/list/sourcing',
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickActiveJobs: IQuickLinkWidget = {
  label: 'Active Jobs',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickActiveJobs,
  api: '',
  link: '/jobs/list/sourcing',
  ...widgetIcons[Widgets.QuickActiveJobs],
  isActive: false,
  isExpandable: false,
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const pendingActions: IQuickLinkWidget = {
  label: 'Pending Actions',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickPendingAction,
  api: '',
  // TODO: change the link to something else
  link: '/pending-actions/content',
  ...widgetIcons[Widgets.QuickPendingAction],
  isActive: false,
  isExpandable: true,
  height: 4,
  width: 4,
  filters: [],
  size: WidgetSizes.Medium,

  // TODO: change the userType
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label',
    },
  },
};

const quickOpenJobs: IQuickLinkWidget = {
  label: 'Open Jobs',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickOpenJobs,
  api: '',
  link: '/jobs/list',
  ...widgetIcons[Widgets.QuickOpenJobs],
  isActive: false,
  isExpandable: false,
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickResumeToReview: IQuickLinkWidget = {
  label: 'Resume to Review',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickResumeToReview,
  api: '',
  link: '/jobs/submissions',
  isActive: false,
  isExpandable: false,
  ...widgetIcons[Widgets.QuickResumeToReview],
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickHeadCount: IQuickLinkWidget = {
  label: 'Head Count',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickHeadCount,
  api: '/assignment/programs/<PROGRAM_ID>/assignment/counts?status=approved',
  link: '/assignment/all-list/open',
  ...widgetIcons[Widgets.QuickHeadCount],
  isActive: false,
  isExpandable: false,
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickPendingExpenses: IQuickLinkWidget = {
  label: 'Pending Expenses',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickPendingExpenses,
  api: '',
  ...widgetIcons[Widgets.QuickPendingExpenses],
  isActive: false,
  isExpandable: false,
  link: '/',
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickActiveContracts: IQuickLinkWidget = {
  label: 'Active Contracts',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickActiveContracts,
  api: '',
  ...widgetIcons[Widgets.QuickActiveContracts],
  isActive: false,
  isExpandable: false,
  link: '/dashboard',
  height: 2,
  width: 3,
  filters: [],

  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickContractEnding: IQuickLinkWidget = {
  label: 'Contract Ending',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickContractEnding,
  api: '/assignment/programs/<PROGRAM_ID>/assignment/counts?status=upcoming-closure',
  ...widgetIcons[Widgets.QuickContractEnding],
  isActive: false,
  isExpandable: false,
  link: '/assignment/all-list/upcoming',
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickPendingTimesheets: IQuickLinkWidget = {
  label: 'Pending Timesheets',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickPendingTimesheets,
  api: '',
  ...widgetIcons[Widgets.QuickPendingTimesheets],
  isActive: false,
  isExpandable: false,
  link: '/timesheet/list/pending',
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickPendingOffers: IQuickLinkWidget = {
  label: 'Pending Offers',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickPendingOffers,
  api: '',
  ...widgetIcons[Widgets.QuickPendingOffers],
  isActive: false,
  isExpandable: false,
  link: '/dashboard',
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickPendingWorkorders: IQuickLinkWidget = {
  label: 'Pending Workorders',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickPendingWorkorders,
  api: '',
  ...widgetIcons[Widgets.QuickPendingWorkorders],
  isActive: false,
  isExpandable: false,
  link: '/dashboard',
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickPendingInterviews: IQuickLinkWidget = {
  label: 'Pending Interviews',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickPendingInterviews,
  api: '',
  ...widgetIcons[Widgets.QuickPendingInterviews],
  isActive: false,
  isExpandable: false,
  link: '/dashboard',
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickViewAllTimesheets: IQuickLinkWidget = {
  label: 'View All Timesheets',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickViewAllTimesheets,
  api: '',
  ...widgetIcons[Widgets.QuickViewAllTimesheets],
  isActive: false,
  isExpandable: false,
  link: '/timesheet/list',
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

const quickCreateTimesheet: IQuickLinkWidget = {
  label: 'Create New Timesheet',
  category: WidgetCategories.QuickLink,
  name: Widgets.QuickCreateTimesheet,
  api: '',
  ...widgetIcons[Widgets.QuickCreateTimesheet],
  isActive: false,
  isExpandable: false,
  link: '/timesheet/list',
  height: 2,
  width: 3,
  filters: [],
  size: WidgetSizes.Small,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
};

export const quickLinkWidgetsConfig = {
  [Widgets.QuickActiveJobs]: quickActiveJobs,
  [Widgets.QuickAddJob]: quickAddJob,
  [Widgets.QuickContactSupport]: quickContactSuport,
  [Widgets.QuickContractEnding]: quickContractEnding,
  [Widgets.QuickCurrentOpenings]: quickCurrentOpenings,
  [Widgets.QuickHeadCount]: quickHeadCount,
  [Widgets.QuickPendingExpenses]: quickPendingExpenses,
  [Widgets.QuickPendingTimesheets]: quickPendingTimesheets,
  [Widgets.QuickResumeToReview]: quickResumeToReview,
  [Widgets.QuickSpendAnalytics]: quickSpendAnalytics,
  [Widgets.QuickOpenJobs]: quickOpenJobs,
  [Widgets.QuickPendingWorkorders]: quickPendingWorkorders,
  [Widgets.QuickPendingInterviews]: quickPendingInterviews,
  [Widgets.QuickPendingOffers]: quickPendingOffers,
  [Widgets.QuickActiveContracts]: quickActiveContracts,
  [Widgets.QuickViewAllTimesheets]: quickViewAllTimesheets,
  [Widgets.QuickCreateTimesheet]: quickCreateTimesheet,
  [Widgets.QuickAddSOW]: quickAddSOW,
  [Widgets.QuickPendingAction]: pendingActions
};
