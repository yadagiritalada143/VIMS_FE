import { Injectable } from '@angular/core';
import { ProgramSetupSidebarModule } from './program-setup-sidebar.module';

@Injectable({
  providedIn: 'root'
})
export class ProgramSetupSidebarService {
  sideBarData: ProgramSetupSidebarModule[] = [
    {
      name: 'dashboard',
      title: 'Dashboard',
      icon: 'speed',
      class: 'sidebar-icon',
      path: '/dashboard',
      permission: null,
      isSideMenu: false,
      isSearch: false
    },
    {
      name: 'Program Details',
      title: 'Program Details',
      icon: 'info',
      class: 'sidebar-icon',
      path: '/program-setup/program-detail',
      permission: 'menu_program_details',
      isSideMenu: false,
      isSearch: false
    },
    // {
    //   name: 'Activities',
    //   title: 'Activities',
    //   icon: 'insights',
    //   class: 'sidebar-icon',
    //   path: '/activities',
    //   permission: 'menu_activities',
    //   isSideMenu: false,
    //   isSearch: false
    // },
    {
      name: 'Hierarchy',
      title: 'Hierarchy',
      icon: 'account_tree',
      class: 'sidebar-icon',
      permission: 'menu_hierarchy',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'Hierarchy',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          title: 'Master data',
          subMenuItem: [
            {
              title: 'Add Master data Type',
              icon: 'add_box',
              class: 'sidebar-icon-submenu',
              path: '/hierarchy/list/add',
              isNotification: false
            },
            {
              title: 'List of Master data Type(s)',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/hierarchy/list',
              isNotification: false
            }
          ]
        },
        {
          title: 'Hierarchy',
          subMenuItem: [
            {
              title: 'Hierarchy Configuration',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/hierarchy/hierarchy-configuraton',
              isNotification: false
            }
          ]
        },
        {
          title: 'Work Location',
          subMenuItem: [
            {
              title: 'Add Work Location',
              icon: 'add_box',
              class: 'sidebar-icon-submenu',
              path: '/hierarchy/work-location/list/add',
              isNotification: false
            },
            {
              title: 'List Work Locations',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/hierarchy/work-location/list',
              isNotification: false
            }
          ]
        }
      ]
    },
    {
      name: 'Users',
      title: 'Manage Users',
      icon: 'people_alt',
      class: 'sidebar-icon',
      permission: 'menu_users',
      isSideMenu: true,
      isSearch: false,

      closeSubMenu: {
        title: 'USERS',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          title: 'Manage Users',
          subMenuItem: [
            {
              title: 'Add User',
              icon: 'add_box',
              class: 'sidebar-icon-submenu',
              path: '/users/list/add',
              isNotification: false
            },
            {
              title: 'List of User(s)',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/users/list',
              isNotification: false
            }
          ]
        },
        {
          title: 'User Roles',
          subMenuItem: [
            {
              title: 'Add User Role',
              icon: 'add_box',
              class: 'sidebar-icon-submenu',
              path: '/users/roles/add',
              isNotification: false
            },
            {
              title: 'List of User Role(s)',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/users/roles',
              isNotification: false
            }
          ]
        }
      ]
    },
    {
      name: 'Manage Pages',
      title: 'Manage Pages',
      icon: 'assignment',
      class: 'sidebar-icon',
      permission: 'menu_manage_pages',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'MANAGE PAGES',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      }
    },
    {
      name: 'Rate Card',
      title: 'Rate Card',
      icon: 'attach_money',
      class: 'sidebar-icon',
      permission: 'menu_rate_cards',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'Rate card configuration',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          subMenuItem: [
            {
              title: 'Add Rate Card',
              icon: 'add_box',
              class: 'sidebar-icon-submenu',
              path: '/rate-card/list/add',
              isNotification: false
            },
            {
              title: 'List of Rate cards',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/rate-card/list',
              isNotification: false
            }
          ]
        }]
    },
    {
      name: 'Qualifications',
      title: 'Qualifications',
      icon: 'school',
      class: 'sidebar-icon',
      permission: 'menu_qualifications',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'QUALIFICATIONS',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          title: 'Qualification Type',
          subMenuItem: [
            {
              title: 'List of Qualification Type(s)',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/qualifications/list',
              isNotification: false
            }
          ]
        },
      ]
    },
    {
      name: 'Rate Factor',
      title: 'Rate Factor',
      icon: 'attach_money',
      class: 'sidebar-icon',
      permission: 'menu_rate_factors',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'Rate factor configuration',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          subMenuItem: [
            {
              title: 'Add Rate Factor',
              icon: 'add_box',
              class: 'sidebar-icon-submenu',
              path: '/rate-factor/list/add',
              isNotification: false
            },
            {
              title: 'Rate Factors List',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/rate-factor/list',
              isNotification: false
            }
          ]
        }]
    },
    {
      name: 'Custom Fields',
      title: 'Custom Fields',
      icon: 'view_stream',
      class: 'sidebar-icon',
      permission: 'custom_field_view',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'CUSTOM FIELDS',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          title: 'Custom Field Management',
          subMenuItem: [
            {
              title: 'Configuration & Settings',
              // icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/custom-fields/list',
              isNotification: false
            }
          ]
        },
      ]
    },
    {
      name: 'Notifications',
      title: 'Notifications',
      icon: 'notifications',
      class: 'sidebar-icon',
      permission: 'menu_notifications',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'NOTIFICATIONS',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          title: 'Categories',
          subMenuItem: [
            {
              title: 'Job',
              class: 'sidebar-icon-submenu',
              path: '/notifications/job',
              isNotification: false
            },
            {
              title: 'Password Management',
              class: 'sidebar-icon-submenu',
              path: '/notifications/password',
              isNotification: true
            },
            {
              title: 'Profile Management',
              class: 'sidebar-icon-submenu',
              path: '/notifications/profile',
              isNotification: true
            },
            {
              title: 'Approval',
              class: 'sidebar-icon-submenu',
              path: '/notifications/approval',
              isNotification: true
            },
            {
              title: 'Generic',
              class: 'sidebar-icon-submenu',
              path: '/notifications/generic',
              isNotification: true
            },
            {
              title: 'Expense',
              class: 'sidebar-icon-submenu',
              path: '/notifications/expense',
              isNotification: true
            },
            {
              title: 'Time Sheet',
              class: 'sidebar-icon-submenu',
              path: '/notifications/time-sheet',
              isNotification: true
            },
            {
              title: 'Assignment',
              class: 'sidebar-icon-submenu',
              path: '/notifications/assignment',
              isNotification: true
            },
            {
              title: 'Onboarding',
              class: 'sidebar-icon-submenu',
              path: '/notifications/onboarding',
              isNotification: true
            },
            {
              title: 'Job Distribution',
              class: 'sidebar-icon-submenu',
              path: '/notifications/job-distribution',
              isNotification: true
            },
            {
              title: 'Interview',
              class: 'sidebar-icon-submenu',
              path: '/notifications/interview',
              isNotification: true
            },
            {
              title: 'Submission',
              class: 'sidebar-icon-submenu',
              path: '/notifications/submission',
              isNotification: true
            },
            {
              title: 'Offer',
              class: 'sidebar-icon-submenu',
              path: '/notifications/offer',
              isNotification: true
            },
            {
              title: 'Invoice',
              class: 'sidebar-icon-submenu',
              path: '/notifications/invoice',
              isNotification: true
            },
            {
              title: 'Consolidated Invoice',
              class: 'sidebar-icon-submenu',
              path: '/notifications/consolidated-invoice',
              isNotification: true
            },
          ]
        },
        {
          title: 'Layout Configuration',
          subMenuItem: [
            {
              title: 'Manage Email Template Header',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/notifications/layout/header',
              isNotification: false
            },
            {
              title: 'Manage Email Template Footer',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/notifications/layout/footer',
              isNotification: false
            }
          ]
        }
      ]
    },
    {
      name: 'Reason Code',
      title: 'Reason Code',
      icon:'navigate_beforenavigate_next',
      class: 'sidebar-icon',
      permission: 'menu_reason',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'Global Modules',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          subMenuItem: [
            {
              title: 'Job',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              path: '/reason-codes/job',
            },
            {
              title: 'Submissions',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              path: '/reason-codes/submission',
            },
            {
              title: 'Interview',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              path: '/reason-codes/interview',
            },
            {
              title: 'Offer',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              path: '/reason-codes/offer',
            },
            {
              title: 'Onboarding',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              path: '/reason-codes/onboarding',
            },
            {
              title: 'Assignment',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              path: '/reason-codes/assignment',
            },
            {
              title: 'Timesheet',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              path: '/reason-codes/time-sheet',
            },
            {
              title: 'Expense',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              path: '/reason-codes/expense',
            },
            {
              title: 'Invoice',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              path: '/reason-codes/invoice',
            },
            {
              title: 'SOW',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              path: '/reason-codes/sow',
            }
          ],
        }
      ]
    },
    {
      name: 'Vendor',
      title: 'Manage Vendor',
      icon: 'school',
      class: 'sidebar-icon',
      permission: 'menu_vendor',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'MANAGE VENDOR',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          title: 'Vendor(s)',
          subMenuItem: [
            {
              title: 'Add New Vendor',
              icon: 'add_box',
              class: 'sidebar-icon-submenu',
              path: '/vendor/create-vendor',
              isNotification: false
            },
            {
              title: 'List of Vendor(s)',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/vendor/vendor-list',
              isNotification: false
            },
            {
              title: 'Vendor Group List',
              icon: 'api',
              class: 'sidebar-icon-submenu',
              path: '/vendor/vendor-group-list',
              isNotification: false
            },
            {
              title: 'Vendor Distribution Schedule',
              icon: 'more_time',
              class: 'sidebar-icon-submenu',
              path: '/vendor/vendor-distribution-list',
              isNotification: false
            },
            {
              title: 'Vendor Compliance',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/vendor/vendor-compliance-list',
              isNotification: false
            }
          ]
        },
      ]
    },
    {
      name: 'management',
      title: 'Job Management',
      icon: 'school',
      class: 'sidebar-icon',
      permission: 'menu_job_management',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'JOB MANAGEMENT',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          title: 'Job Management',
          subMenuItem: [
            {
              title: 'Create New Job Template',
              icon: 'add_box',
              class: 'sidebar-icon-submenu',
              path: '/job-template/create',
              isNotification: false
            },
            {
              title: 'View Job Templates',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/job-template/list',
              isNotification: false
            }
          ]
        },
        {
          title: 'Questionnaire',
          subMenuItem: [
            {
              title: 'List Questions',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/questionnaire/list-question',
              isNotification: false
            },
            {
              title: 'List Questionnaire',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/questionnaire/list',
              isNotification: false
            }
          ]
        },
      ]
    },
    {
      name: 'Time & Expense',
      title: 'Time & Expense',
      icon: 'pending_actions',
      class: 'sidebar-icon',
      permission: 'ADMIN',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'TIME & EXPENSE',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          title: 'Timesheet',
          subMenuItem: [
            {
              title: 'Timesheet Configuration List',
              icon: 'add_box',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              path: '/timesheet/config/list'
            }
          ]
        },
        {
          title: 'Expense',
          subMenuItem: [
            {
              title: 'Expense Configuration List',
              icon: 'account_balance_wallet',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              path: '/expense/list'
            }
          ]
        }
      ]
    },
    {
      name: 'Work Flows',
      title: 'Work Flows',
      icon: 'device_hub',
      class: 'sidebar-icon',
      permission: 'menu_work_flows',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'WORK FLOWS',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      }
    },

    {
      name: 'Credentialing',
      title: 'Credentialing',
      icon: 'security',
      class: 'sidebar-icon',
      permission: 'menu_credentialing',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'CREDENTIALING',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      }
    },
    {

      name: 'Onboarding Configuration',
      title: 'Onboarding',
      icon: 'check_circle_outline',
      class: 'sidebar-icon',
      permission: 'menu_onboarding',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'MANAGE Onboarding',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          subMenuItem: [
            {
              title: 'Tasklist',
              icon: 'task_alt',
              class: 'sidebar-icon-submenu',
              path: '/onboarding-configuration/task-list',
              isNotification: false
            },
            {
              title: 'Checklist',
              icon: 'done_all',
              class: 'sidebar-icon-submenu',
              path: '/onboarding-configuration/task-checklist',
              isNotification: false
            }
          ]
        }
      ]
    },
    {

      name: 'Candidate Screening',
      title: 'Candidate Screening',
      icon: 'gpp_good',
      class: 'sidebar-icon',
      permission: 'menu_screening',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'Candidate Screening',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          subMenuItem: [
            {
              title: 'shortlisting',
              icon: 'task_alt',
              class: 'sidebar-icon-submenu',
              path: '/program-setup/candidate-screening/shortlisting',
              isNotification: false
            }
          ]
        }
      ]
    }
  ]

  constructor() { }
  getSideMenu() {
    return this.sideBarData;
  }

}
