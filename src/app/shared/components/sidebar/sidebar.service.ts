import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SidebarModule } from './sidebar.module';
import { HttpService } from '../../../core/services/http.service';
import { StorageKeys, StorageService } from '../../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
 
  sideBarData: SidebarModule[] = [
    {
      name: 'dashboard',
      title: 'dashboard',
      icon: 'dashboard',
      class: 'sidebar-icon',
      path: '/dashboard',
      permission: null,
      isSideMenu: false,
      isSearch: false
    },
    // {
    //   name: 'rfx',
    //   title: 'RFx',
    //   icon: 'gavel',
    //   class: 'sidebar-icon',
    //   permission: 'view_rfx',
    //   isSideMenu: true,
    //   isSearch: false,
    //   closeSubMenu: {
    //     title: 'RFx',
    //     icon: 'close',
    //     class: 'sidebar-close-icon',
    //     isNotification: false
    //   },
    //   sideBarSubMenu: [
    //     {
    //       subMenuItem: [
    //         {
    //           title: 'create_rfx',
    //           icon: 'add',
    //           class: 'sidebar-icon-submenu',
    //           linkClass: "create",
    //           permission: 'create_rfx',
    //           isNotification: false,
    //           path: '/rfx/create'
    //         },
    //         {
    //           title: 'RFxs',
    //           icon: 'gavel',
    //           class: 'sidebar-icon-submenu',
    //           permission: 'view_rfx',
    //           isNotification: false,
    //           path: '/rfx/list'
    //         },
    //         {
    //           title: 'Bids',
    //           icon: 'ballot',
    //           class: 'sidebar-icon-submenu',
    //           permission: 'view_bid',
    //           isNotification: false,
    //           path: '/rfx/bidlist'
    //         },
    //       ]
    //     }
    //   ]
    // },
    // {
    //   name: 'sow',
    //   title: 'sow',
    //   icon: 'dns',
    //   class: 'sidebar-icon',
    //   path: '/sow',
    //   permission: 'menu_sow',
    //   isSideMenu: true,
    //   isSearch: false,
    //   closeSubMenu: {
    //     title: 'statement_of_work',
    //     icon: 'close',
    //     class: 'sidebar-close-icon',
    //     isNotification: false
    //   },
    //   sideBarSubMenu: [
    //     {
    //       subMenuItem: [
    //         {
    //           title: 'create_sow',
    //           icon: 'add',
    //           class: 'sidebar-icon-submenu',
    //           linkClass: "create",
    //           permission: 'menu_sow_create',
    //           isNotification: false,
    //           path: '/sow/create_sow'
    //         },
    //         {
    //           title: 'sows',
    //           icon: 'view_stream',
    //           class: 'sidebar-icon-submenu',
    //           permission: 'menu_sow_view',
    //           isNotification: false,
    //           path: '/sow'
    //         },
    //         {
    //           title: 'Milestones',
    //           icon: 'content_paste_go',
    //           class: 'sidebar-icon-submenu',
    //           permission: 'menu_sow_view',
    //           isNotification: false,
    //           path: '/sow/milestones_list'
    //         },
    //         {
    //           title: 'Milestone Progress Updates',
    //           icon: 'playlist_add_check',
    //           class: 'sidebar-icon-submenu',
    //           permission: 'menu_progress_view',
    //           isNotification: false,
    //           path: '/sow/progress_list'
    //         }
    //       ]
    //     }
    //   ]
    // },
    {
      name: 'jobs',
      title: 'job',
      icon: 'work_outline',
      class: 'sidebar-icon',
      permission: 'menu_jobs',
      path: '/jobs',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'Jobs',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          subMenuItem: [
            {
              title: 'create_job',
              icon: 'add',
              class: 'sidebar-icon-submenu',
              linkClass: "create",
              permission: 'create_job',
              isNotification: false,
              path: '/jobs/create'
            },
            {
              title: 'jobs',
              icon: 'work',
              class: 'sidebar-icon-submenu',
              permission: 'view_job',
              isNotification: false,
              path: this._storageService.get(StorageKeys.GLV_PREFERENCE)?.jobs?.job ? '/jobs/genericlist/JobModule/Job' : '/jobs/list'
            },
            {
              title: 'opted-out_jobs',
              icon: 'view_stream',
              class: 'sidebar-icon-submenu',
              permission: 'hide_opted_out_jobs',
              isNotification: false,
              path: '/jobs/optout-list'
            },
            {
              title: 'candidates',
              icon: 'people',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              permission: 'menu_candidates',
              path: '/candidates/list'
            },
            {
              title: 'submissions',
              icon: 'how_to_reg',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              permission: 'view_job',
              path: '/jobs/submissions'
            },
            {
              title: 'interviews',
              icon: 'group_work',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              permission: 'view_job',
              path: '/jobs/interviews'
            },
            {
              title: 'offers',
              icon: 'drafts',
              class: 'sidebar-icon-submenu',
              isNotification: false,
              permission: 'view_job',
              path: '/jobs/offers'
            }
          ]
        }
      ]
    },
    // {
    //   name: 'candidates',
    //   title: 'Candidates',
    //   icon: 'people',
    //   class: 'sidebar-icon',
    //   permission: 'menu_jobs',
    //   isSideMenu: true,
    //   isSearch: false,
    //   closeSubMenu: {
    //     title: 'Candidates',
    //     icon: 'close',
    //     class: 'sidebar-icon',
    //     isNotification: false
    //   },
    //   sideBarSubMenu: [
    //     {
    //       subMenuItem: [
    //         {
    //           title: 'Create Candidates',
    //           icon: 'add',
    //           class: 'sidebar-icon-submenu',
    //           linkClass: "create",
    //           permission: 'create_job',
    //           isNotification: false,
    //           path: 'candidates/create'
    //         },
    //         {
    //           title: 'View All Candidates',
    //           icon: 'view_stream',
    //           class: 'sidebar-icon-submenu',
    //           permission: 'view_job',
    //           isNotification: false,
    //           path: '/candidates/list'
    //         }
    //       ]
    //     }
    //   ]
    // },
    // {
    //   name: 'Assignments',
    //   title: 'assignment',
    //   icon: 'assignment',
    //   class: 'sidebar-icon',
    //   permission: 'menu_assignments',
    //   path: '/assignment',
    //   isSideMenu: true,
    //   isSearch: false,
    //   closeSubMenu: {
    //     title: 'Assignments',
    //     icon: 'close',
    //     class: 'sidebar-close-icon',
    //     isNotification: false
    //   },
    //   sideBarSubMenu: [
    //     {
    //       subMenuItem: [
    //         {
    //           title: 'create_quick_assignment',
    //           icon: 'add',
    //           class: 'sidebar-icon-submenu',
    //           linkClass: "create",
    //           permission: 'create_quick_assignment',
    //           isNotification: false,
    //           path: '/assignment/create-assignment'
    //         },
    //         {
    //           title: 'assignments',
    //           icon: 'assignment',
    //           class: 'sidebar-icon-submenu',
    //           permission: 'view_assignment',
    //           isNotification: false,
    //           path: '/assignment/all-list'
    //         }
    //         // {
    //         //   title: 'Qualification',
    //         //   icon: 'verified_user',
    //         //   class: 'sidebar-icon-submenu',
    //         //   isNotification: false,
    //         //   path: '/qualifications/qualification-type'
    //         // }
    //       ]
    //     }
    //   ]
    // },
    {
      name: 'Master Talent Profiles',
      title: 'master_talent_profiles',
      icon: 'badge',
      class: 'sidebar-icon',
      permission: 'view_master_talent_profile',
      path: '/master-talent-profile/list',
      isSideMenu: false,
      isSearch: false,
    },
    {
      name: 'Candidates',
      title: 'candidates',
      icon: 'people',
      class: 'sidebar-icon',
      permission: 'menu_candidates',
      path: '/candidates',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'Candidates',
        icon: 'close',
        class: 'sidebar-close-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          subMenuItem: [
            {
              title: 'create_candidates',
              icon: 'add',
              class: 'sidebar-icon-submenu',
              linkClass: "create",
              permission: 'create_candidate',
              isNotification: false,
              path: '/candidates/create'
            },
            {
              title: 'view_candidates',
              icon: 'people',
              class: 'sidebar-icon-submenu',
              permission: 'view_candidate',
              isNotification: false,
              path: this._storageService.get(StorageKeys.GLV_PREFERENCE)?.candidate?.candidate ? '/jobs/genericlist/CandidateModule/Candidate' :  '/candidates/list'
            }
          ]
        }
      ]
    },
    // {
    //   name: 'timesheet',
    //   title: 'time_&_expense',
    //   icon: 'schedule',
    //   class: 'sidebar-icon',
    //   permission: 'menu_timesheet_and_expenses',
    //   isSideMenu: true,
    //   isSearch: false,
    //   closeSubMenu: {
    //     title: 'Time & Expense',
    //     icon: 'close',
    //     class: 'sidebar-close-icon',
    //     isNotification: false
    //   },
    //   sideBarSubMenu: [
    //     {
    //       title: 'timesheets',
    //       subMenuItem: [
    //         {
    //           title: 'timesheets',
    //           icon: 'pending_actions',
    //           class: 'sidebar-icon-submenu',
    //           permission: 'view_timesheet',
    //           isNotification: false,
    //           path: '/timesheet/list/all'
    //         },
    //         {
    //           title: 'account_code',
    //           icon: 'pending_actions',
    //           class: 'sidebar-icon-submenu',
    //           permission: 'menu_account_code_setup',
    //           isNotification: false,
    //           path: '/setup/account-codes'
    //         }
    //       ]
    //     },
    //     {
    //       title: 'Expense',
    //       subMenuItem: [
    //         {
    //           title: 'general_expenses',
    //           icon: 'account_balance_wallet',
    //           class: 'sidebar-icon-submenu',
    //           permission: 'view_expense',
    //           isNotification: false,
    //           path: '/expense/general/all'
    //         },
    //         {
    //           title: 'Misc Expenses',
    //           icon: 'payments',
    //           class: 'sidebar-icon-submenu',
    //           permission: 'view_misc_expense',
    //           isNotification: false,
    //           path: '/expense/misc/all'
    //         }
    //       ]
    //     }
    //   ]
    // },
    // {
    //   name: 'Invoices',
    //   title: 'invoice',
    //   icon: 'receipt_long',
    //   class: 'sidebar-icon',
    //   path: '/invoice',
    //   permission: 'menu_invoices',
    //   isSideMenu: true,
    //   isSearch: false,
    //   closeSubMenu: {
    //     title: 'Invoice',
    //     icon: 'close',
    //     class: 'sidebar-close-icon',
    //     isNotification: false
    //   },
    //   sideBarSubMenu: [
    //     {
    //       subMenuItem: [
    //         {
    //           title: 'Invoices',
    //           icon: 'receipt',
    //           class: 'sidebar-icon-submenu',
    //           permission: 'menu_submenu_individual_invoices',
    //           isNotification: false,
    //           path: '/invoice/individual-list'
    //         },
    //         {
    //           title: 'Consolidated Invoices',
    //           icon: 'request_quote',
    //           permission: 'menu_consolidate_invoices',
    //           class: 'sidebar-icon-submenu',
    //           isNotification: false,
    //           path: '/invoice/consolidated-list'
    //         },
    //         {
    //           title: 'Payments',
    //           icon: 'payments',
    //           class: 'sidebar-icon-submenu',
    //           permission: 'menu_client_payments_invoices',
    //           isNotification: false,
    //           path: '/invoice/invoice-client-payment'
    //         },
    //       ]
    //     }
    //   ]
    // },
    // {
    //   name: 'report',
    //   title: 'analytics_(reports)',
    //   icon: 'analytics',
    //   class: 'sidebar-icon',
    //   path: '/reports/list',
    //   permission: 'menu_reports',
    //   isSideMenu: false,
    //   isSearch: false,

    //   // sideBarSubMenu: [
    //   //   {
    //   //     subMenuItem: [
    //   //       {
    //   //         title: 'View Reports',
    //   //         icon: 'analytics',
    //   //         class: 'sidebar-icon-submenu',
    //   //         permission: 'menu_reports',
    //   //         isNotification: false,
    //   //         path: '/reports'
    //   //       }
    //   //     ]
    //   //   }
    //   // ]
    // },
    // {
    //   name: 'report_pbi',
    //   title: 'reports(pbi)',
    //   icon: 'analytics',
    //   class: 'sidebar-icon',
    //   path: '/view-reports',
    //   permission: 'view_pbi_analytics',
    //   isSideMenu: true,
    //   isSearch: false,
    //   closeSubMenu: {
    //     title: 'reports',
    //     icon: 'close',
    //     class: 'sidebar-icon',
    //     isNotification: false
    //   },
    //   sideBarSubMenu: [
    //     {
    //       subMenuItem: [
    //         {
    //           title: 'create_new',
    //           icon: 'add',
    //           class: 'sidebar-icon-submenu',
    //           linkClass: "create",
    //           permission: 'create_self_service_reports',
    //           isNotification: false,
    //           path: '/view-reports/create-new'
    //         },
    //         // {
    //         //   title: 'create_new',
    //         //   icon: 'add',
    //         //   class: 'sidebar-icon-submenu',
    //         //   linkClass: "create",
    //         //   permission: 'create_self_service_reports',
    //         //   isNotification: false,
    //         //   path: '/view-reports/create-report'
    //         // },
    //         // {
    //         //   title: 'create_new_dashboard',
    //         //   icon: 'add',
    //         //   class: 'sidebar-icon-submenu',
    //         //   permission: 'create_dashboard',
    //         //   isNotification: false,
    //         //   path: '/view-reports/create-dashboard'
    //         // },
    //         {
    //           title: 'Standard Reports',
    //           icon: 'table_chart',
    //           class: 'sidebar-icon-submenu',
    //           permission: 'view_pbi_analytics',
    //           isNotification: false,
    //           path: '/view-reports/standard-reports'
    //         },
    //         {
    //           title: 'Reports',
    //           icon: 'description',
    //           class: 'sidebar-icon-submenu',
    //           isNotification: false,
    //           permission: 'view_pbi_analytics',
    //           path: '/view-reports/reports/recent'
    //         },
    //         {
    //           title: 'dashboards',
    //           icon: 'space_dashboard',
    //           class: 'sidebar-icon-submenu',
    //           isNotification: false,
    //           permission: 'view_pbi_analytics',
    //           path: '/view-reports/dashboards/recent'
    //         },
    //         {
    //           title: 'My Schedules',
    //           icon: 'event_available',
    //           class: 'sidebar-icon-submenu',
    //           isNotification: false,
    //           permission: 'view_pbi_analytics',
    //           path: 'view-reports/schedules'
    //         },
    //         {
    //           title: 'Collections',
    //           icon: 'folder',
    //           class: 'sidebar-icon-submenu',
    //           isNotification: false,
    //           permission: 'view_pbi_analytics',

    //           path: 'view-reports/folders-all',
    //         },
    //         {
    //           title: 'Bookmarks',
    //           icon: 'bookmarks',
    //           class: 'sidebar-icon-submenu',
    //           isNotification: false,
    //           permission: 'view_pbi_analytics',
    //           path: 'view-reports/bookmarks/reports',
    //         },
    //         {
    //           title: 'Archives',
    //           icon: 'archive',
    //           class: 'sidebar-icon-submenu',
    //           isNotification: false,
    //           permission: 'view_pbi_analytics',
    //           path: 'view-reports/archive/reports',
    //         },
    //       ]
    //     }
    //   ]
    // },
    // {
    //   name: 'dashboard_pbi',
    //   title: 'dashboard(pbi)',
    //   icon: 'dashboard',
    //   class: 'sidebar-icon',
    //   path: '/view-dashboard',
    //   permission: 'dashboard_pbi_view',
    //   isSideMenu: false,
    //   isSearch: false
    // },
    {
      name: 'programs',
      title: 'programs',
      icon: 'layers',
      class: 'sidebar-icon',
      permission: 'menu_programs',
      path: '/programs',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'Programs',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          subMenuItem: [
            {
              title: 'create_program',
              icon: 'add',
              class: 'sidebar-icon-submenu',
              permission: 'create_program',
              linkClass: "create",
              path: '/programs/create',
              isNotification: false
            },
            {
              title: 'View All Program',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/programs/list',
              permission: 'view_program',
              isNotification: false
            },
            {
              title: 'View All Program',
              icon: 'layers',
              class: 'sidebar-icon-submenu',
              path: '/vendor-managment/program-list',
              permission: 'view_org_program',
              isNotification: false
            }
          ]
        },
        {
          title: 'Organization(s)',
          subMenuItem: [
            {
              title: 'View all Client(s)',
              icon: 'supervised_user_circle',
              class: 'sidebar-icon-submenu',
              path: '/org/list/client',
              permission: 'view_all_client_orgs',
              isNotification: false
            },
            {
              title: 'View all MSP(s)',
              icon: 'corporate_fare',
              class: 'sidebar-icon-submenu',
              path: '/org/list/msp',
              permission: 'view_all_msp_orgs',
              isNotification: false
            },
            {
              title: 'View all Vendor(s)',
              icon: 'storefront',
              class: 'sidebar-icon-submenu',
              path: '/org/list/vendor',
              permission: 'view_all_vendor_orgs',
              isNotification: false
            }
          ]
        }
      ]
    },
    {
      name: 'Settings',
      title: 'settings',
      icon: 'settings',
      class: 'sidebar-icon',
      permission: 'menu_settings',
      isSideMenu: false,
      isSearch: false,
      path: '/settings',
    },
    {
      name: 'Self Configuration',
      title: 'self_configuration',
      icon: 'settings',
      class: 'sidebar-icon',
      permission: 'menu_self_configuration', /** DO NOT remove the permission w/o discussing with Granthik Kundu */
      isSideMenu: false,
      isSearch: false,
      path: '/self-configuration',
    },
  ]

  constructor(private httpService: HttpService,
    private _storageService: StorageService
    ) {
     }

  getSideMenu() {
    return this.sideBarData;
  }

  getAllPrograms(): Observable<any> {
    return this.httpService.get(`/configurator/programs?source_user=SELF`);
  }
}
