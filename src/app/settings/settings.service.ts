import { Injectable } from '@angular/core';
import { SettingsModule } from './settings.module';
import * as _ from 'lodash';
import { I18NextPipe } from 'angular-i18next';
import { StorageKeys, StorageService } from '../core/services/storage.service';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {

  settingData: SettingsModule[] = [
    {
      name: 'Programs',
      title: 'programs',
      icon: 'home_max',
      class: 'sidebar-icon',
      isSideMenu: true,
      isSearch: false,
      permission: 'menu_programs',
      sideBarSubMenu: [
        {
          title: 'program_details',
          icon: 'add_box',
          class: 'sidebar-icon-submenu',
          path: 'program-setup/program-detail',
          isNotification: false,
          permission: 'menu_program_details',
        },
        {
          title: 'accuracy_configuration',
          icon: 'add_box',
          class: 'sidebar-icon-submenu',
          path: 'program-setup/configure-accuracy',
          isNotification: false,
          permission: 'view_accuracy_config',
        },
        // {
        //   title: 'Acitivities',
        //   icon: 'add_box',
        //   class: 'sidebar-icon-submenu',
        //   path: 'program-setup',
        //   isNotification: false,
        // },
      ],
    },
    {
      name: 'Hierarchy',
      title: 'hierarchy',
      icon: 'account_tree',
      class: 'sidebar-icon',
      permission: 'menu_hierarchy',
      isSideMenu: true,
      isSearch: false,
      sideBarSubMenu: [
        {
          title: 'master_data_types',
          icon: 'layers',
          class: 'sidebar-icon-submenu',
          path: '/hierarchy/list',
          isNotification: false,
        },
        {
          title: 'hierarchies',
          icon: 'layers',
          class: 'sidebar-icon-submenu',
          permission: 'view_hierarchy',
          path: '/hierarchy/hierarchy-configuraton',
          isNotification: false,
        },
        {
          title: 'work_locations',
          icon: 'layers',
          class: 'sidebar-icon-submenu',
          path: '/hierarchy/work-location/list',
          isNotification: false,
          permission: 'work_location_view'
        },
      ],
    },
    {
      name: 'Users',
      title: 'manage_users',
      icon: 'people_alt',
      class: 'sidebar-icon',
      permission: 'menu_users',
      isSideMenu: true,
      isSearch: false,
      sideBarSubMenu: [
        {
          title: 'organization_users',
          icon: 'layers',
          class: 'sidebar-icon-submenu',
          path: '/user-management/list',
          isNotification: false,
        },
        {
          title: 'program_users',
          icon: 'add_box',
          class: 'sidebar-icon-submenu',
          path: '/users/list',
          isNotification: false,
        },
        {
          title: 'program_user_roles',
          icon: 'layers',
          class: 'sidebar-icon-submenu',
          path: 'users/roles',
          permission: 'menu_program_roles',
          isNotification: false,
        }
        // {
        //   title: 'Add User Role',
        //   icon: 'add_box',
        //   class: 'sidebar-icon-submenu',
        //   path: 'users/roles/add',
        //   isNotification: false,
        // }
      ],
    },
    // {
    //   name: 'Manage Pages',
    //   title: 'Manage Pages',
    //   icon: 'assignment',
    //   class: 'sidebar-icon',
    //   permission: 'menu_manage_pages',
    //   isSideMenu: true,
    //   isSearch: false,
    // },
    {
      name: 'Rate Card',
      title: 'rate_card',
      icon: 'attach_money',
      class: 'sidebar-icon',
      permission: 'menu_rate_cards',
      isSideMenu: true,
      isSearch: false,
      sideBarSubMenu: [
        {
          title: 'rate_cards',
          icon: 'layers',
          class: 'sidebar-icon-submenu',
          path: '/rate-card/list',
          isNotification: false,
        },
      ],
    },
    {
      name: 'Qualifications',
      title: 'qualifications',
      icon: 'school',
      class: 'sidebar-icon',
      permission: 'menu_qualifications',
      isSideMenu: true,
      isSearch: false,
      sideBarSubMenu: [
        {
          title: 'qualification_types',
          icon: 'layers',
          class: 'sidebar-icon-submenu',
          path: '/qualificationsList/list',
          isNotification: false,
        },
      ],
    },
    {
      name: 'Rate Factor',
      title: 'rate_factor',
      icon: 'attach_money',
      class: 'sidebar-icon',
      permission: 'menu_rate_factors',
      isSideMenu: true,
      isSearch: false,
      sideBarSubMenu: [
        {
          title: 'rate_factors',
          icon: 'layers',
          class: 'sidebar-icon-submenu',
          path: '/rate-factor/list',
          isNotification: false,
        },
      ],
    },
    {
      name: 'Custom Fields',
      title: 'custom_fields',
      icon: 'view_stream',
      class: 'sidebar-icon',
      permission: 'custom_field_view',
      isSideMenu: true,
      isSearch: false,
      sideBarSubMenu: [
        // {
        //   title: 'Configuration',
        //   class: 'sidebar-icon-submenu',
        //   path: '/custom-fields/list?entity=Configuration&currentTab=',
        //   isNotification: false,
        // },
        {
          title: 'job',
          class: 'sidebar-icon-submenu',
          path: '/custom-fields/list?entity=Job&currentTab=',
          isNotification: false,
        },
        {
          title: 'assignment',
          // icon: 'layers',
          class: 'sidebar-icon-submenu',
          path: '/custom-fields/list?entity=Assignment&currentTab=',
          isNotification: false,
        },
        {
          title: 'candidate',
          // icon: 'layers',
          class: 'sidebar-icon-submenu',
          path: '/custom-fields/list?entity=Candidates&currentTab=',
          isNotification: false,
        },
        {
          title: 'times_&_expense',
          // icon: 'layers',
          class: 'sidebar-icon-submenu',
          path: '/custom-fields/list?entity=TimeAndExpense&currentTab=',
          isNotification: false,
        },
        // {
        //   title: 'Invoice',
        //   // icon: 'layers',
        //   class: 'sidebar-icon-submenu',
        //   path: '/custom-fields/list?entity=Invoice&currentTab=',
        //   isNotification: false,
        // },
        {
          title: 'statement_of_work',
          // icon: 'layers',
          class: 'sidebar-icon-submenu',
          path: '/custom-fields/list?entity=StatementOfWork&currentTab=',
          isNotification: false,
        },
      ],
    },
    {
      name: 'Reason Code',
      title: 'reason_code',
      icon: 'navigate_beforenavigate_next',
      class: 'sidebar-icon',
      permission: 'menu_reason_codes',
      isSideMenu: true,
      isSearch: false,
      closeSubMenu: {
        title: 'global_modules',
        icon: 'close',
        class: 'sidebar-icon',
        isNotification: false
      },
      sideBarSubMenu: [
        {
          title: 'reason_codes',
          class: 'sidebar-icon-submenu',
          isNotification: false,
          path: '/reason-codes/job',
          permission: 'reason_code_view'
        },
      ]
    },
    {
      name: 'Notifications',
      title: 'notifications',
      icon: 'notifications',
      class: 'sidebar-icon',
      permission: 'menu_notifications',
      isSideMenu: true,
      isSearch: false,
      sideBarSubMenu: [
        {
          title: 'job',
          class: 'sidebar-icon-submenu',
          path: '/notifications/job',
          isNotification: false,
        },
        {
          title: 'password_management',
          class: 'sidebar-icon-submenu',
          path: '/notifications/password',
          isNotification: true,
        },
        {
          title: 'profile_management',
          class: 'sidebar-icon-submenu',
          path: '/notifications/profile',
          isNotification: true,
        },
        {
          title: 'approval',
          class: 'sidebar-icon-submenu',
          path: '/notifications/approval',
          isNotification: true,
        },
        {
          title: 'generic',
          class: 'sidebar-icon-submenu',
          path: '/notifications/generic',
          isNotification: true,
        },
        {
          title: 'expense',
          class: 'sidebar-icon-submenu',
          path: '/notifications/expense',
          isNotification: true,
        },
        {
          title: 'timesheet',
          class: 'sidebar-icon-submenu',
          path: '/notifications/time-sheet',
          isNotification: true,
        },
        {
          title: 'assignment',
          class: 'sidebar-icon-submenu',
          path: '/notifications/assignment',
          isNotification: true,
        },
        {
          title: 'onboarding',
          class: 'sidebar-icon-submenu',
          path: '/notifications/onboarding',
          isNotification: true,
        },
        {
          title: 'job_distribution',
          class: 'sidebar-icon-submenu',
          path: '/notifications/job-distribution',
          isNotification: true,
        },
        {
  title: 'submission',
  class: 'sidebar-icon-submenu',
  path: '/notifications/submission',
  isNotification: true,
},
        {
          title: 'email_template_header',
          icon: 'layers',
          class: 'sidebar-icon-submenu',
          path: '/notifications/layout/header',
          isNotification: false,
        },
        {
          title: 'email_template_footer',
          icon: 'layers',
          class: 'sidebar-icon-submenu',
          path: '/notifications/layout/footer',
          isNotification: false,
        },
        {
          title: 'notifications',
          icon: 'task_alt',
          class: 'sidebar-icon-submenu',
          permission: 'manage_notification_configuration',
          path: '/notification/config',
          isNotification: false
        }
      ],
    },
    {
      name: 'Vendor',
      title: 'manage_vendor',
      icon: 'school',
      class: 'sidebar-icon',
      permission: 'menu_vendor',
      isSideMenu: true,
      isSearch: false,
      sideBarSubMenu: [
        {
          title: 'vendors',
          icon: 'layers',
          class: 'sidebar-icon-submenu',
          path: '/vendor/vendor-list',
          isNotification: false,
          permission: 'vendors_view'
        },
        {
          title: 'vendor_groups',
          icon: 'api',
          class: 'sidebar-icon-submenu',
          path: '/vendor/vendor-group-list',
          isNotification: false,
          permission: 'vendor_group_view'
        },
        {
          title: 'vendor_distribution_schedules',
          icon: 'more_time',
          class: 'sidebar-icon-submenu',
          permission: 'menu_vendor_distribution',
          path: '/vendor/vendor-distribution-list',
          isNotification: false,
        },
        {
          title: 'vendor_compliance',
          icon: 'layers',
          class: 'sidebar-icon-submenu',
          permission: 'menu_vendor_compliance',
          path: '/vendor/vendor-compliance-list',
          isNotification: false,
        },
        {
          title: 'compliance_restriction_rules',
          icon: 'layers',
          class: 'sidebar-icon-submenu',
          permission: 'vendor_compliance_restriction_rule_view',
          path: '/vendor/compliance-restriction-rule',
          isNotification: false,
        },
      ],
    },
    {
      name: 'fee',
      title: 'fee_configuration',
      icon: 'attach_money',
      class: 'sidebar-icon',
      permission: 'menu_job_management',
      isSideMenu: true,
      isSearch: false,
      sideBarSubMenu: [
        {
          title: 'fee_configuration',
          icon: 'add_box',
          class: 'sidebar-icon-submenu',
          path: '/configuration/fees-configuration/list',
          isNotification: false,
        },
      ],
    },
    {
      name: 'management',
      title: 'job_management',
      icon: 'school',
      class: 'sidebar-icon',
      permission: 'menu_job_management',
      isSideMenu: true,
      isSearch: false,
      sideBarSubMenu: [
        {
          title: 'job_templates',
          icon: 'layers',
          class: 'sidebar-icon-submenu',
          path: '/job-template/list',
          isNotification: false,
          permission: 'job_template_view'
        },
        // {
        //   title: 'Questions',
        //   icon: 'layers',
        //   class: 'sidebar-icon-submenu',
        //   path: '/questionnaire/list-question',
        //   isNotification: false,
        // },
        // {
        //   title: 'Questionnaires',
        //   icon: 'layers',
        //   class: 'sidebar-icon-submenu',
        //   path: '/questionnaire/list',
        //   isNotification: false,
        // },
      ],
    },
    {
      name: 'Assignment Management',
      title: 'assignment_management',
      icon: 'assignment',
      class: 'sidebar-icon',
      permission: 'ADMIN',
      isSideMenu: true,
      isSearch: false,
      sideBarSubMenu: [
        {
          title: 'assignment_configuration',
          icon: 'add_box',
          class: 'sidebar-icon-submenu',
          isNotification: false,
          path: '/assignment/config'
        }
      ],
    },
    {
      name: 'Time & Expense',
      title: 'time_&_expense',
      icon: 'pending_actions',
      class: 'sidebar-icon',
      permission: 'menu_time_and_expense',
      isSideMenu: true,
      isSearch: false,
      sideBarSubMenu: [
        {
          title: 'timesheet_configurations',
          icon: 'add_box',
          class: 'sidebar-icon-submenu',
          permission: 'menu_timesheet_configurations',
          isNotification: false,
          path: '/timesheet/config/list'
        },
        {
          title: 'account_code',
          icon: 'pending_actions',
          class: 'sidebar-icon-submenu',
          permission: 'menu_account_code_setup',
          isNotification: false,
          path: 'setup/account-codes',
          hide: () => {
            return (this.currentProgram?.config?.account_code?.enabled === true)?false:true;
          }
        },
        {
          title: 'expense_configurations',
          icon: 'account_balance_wallet',
          class: 'sidebar-icon-submenu',
          permission: 'menu_expense_configurations',
          isNotification: false,
          path: '/expense-config/list',
        },
      ],
    },
    // {
    //   name: 'Work Flows',
    //   title: 'Work Flows',
    //   icon: 'device_hub',
    //   class: 'sidebar-icon',
    //   permission: 'menu_work_flows',
    //   isSideMenu: true,
    //   isSearch: false,
    // },
    // {
    //   name: 'Credentialing',
    //   title: 'Credentialing',
    //   icon: 'security',
    //   class: 'sidebar-icon',
    //   permission: 'menu_credentialing',
    //   isSideMenu: true,
    //   isSearch: false,
    // },
    {
      name: 'Onboarding Configuration',
      title: 'onboarding',
      icon: 'check_circle_outline',
      class: 'sidebar-icon',
      permission: 'menu_onboarding',
      isSideMenu: true,
      isSearch: false,
      sideBarSubMenu: [
        {
          title: 'tasks',
          icon: 'task_alt',
          class: 'sidebar-icon-submenu',
          path: '/onboarding-configuration/task-list',
          isNotification: false,
        },
        {
          title: 'checklists',
          icon: 'done_all',
          class: 'sidebar-icon-submenu',
          path: '/onboarding-configuration/task-checklist',
          isNotification: false,
        },
      ],
    },
    {
      name: 'settings',
      title: 'settings',
      icon: 'check_circle_outline',
      class: 'sidebar-icon',
      permission: 'vendor_details',
      isSideMenu: true,
      isSearch: false,
      sideBarSubMenu: [
        {
          title: 'vendor_details',
          icon: 'task_alt',
          class: 'sidebar-icon-submenu',
          path: '/vendor-managment/setup',
          isNotification: false,
          permission: 'vendor_details',
          isNotProgram: true,
        },
        // {
        //   title: 'Configure Edit Rules',
        //   icon: 'layers',
        //   class: 'sidebar-icon-submenu',
        //   path: '/edit-rules/configure-edit-rules',
        //   permission: 'menu_edit_rules',
        //   isNotification: false,
        // },
        {
          title: 'compliance_documents',
          icon: 'assignment',
          class: 'sidebar-icon-submenu',
          isNotification: false,
          permission: 'view_compliance',
          path: '/vendor-managment/compliance-list/{PROGRAM_ID}/{ORG_ID}',
          isNotProgram: true,
          params: ['PROGRAM_ID', 'ORG_ID'],
        },
        {
          title: 'tax_configuration',
          icon: 'next_week',
          class: 'sidebar-icon-submenu',
          path: '/tax-configuration/list',
          permission: 'view_tax_configuration',
          isNotification: false,
        },
        {
          title: 'picklist',
          icon: 'checklist',
          class: 'sidebar-icon-submenu',
          path: '/picklist',
          permission: 'view_picklist',
          isNotification: false,
        },
      ],
    },
    // {
    //   name: 'manager vendor users',
    //   title: 'MANAGE VENDOR USERS',
    //   icon: 'check_circle_outline',
    //   class: 'sidebar-icon',
    //   permission: 'view_vendor_setup',
    //   isSideMenu: true,
    //   isSearch: false,
    //   sideBarSubMenu: [
    //     {
    //       title: 'Add User',
    //       icon: 'person_add',
    //       class: 'sidebar-icon-submenu',
    //       path: '/vendor-managment/users/list/add',
    //       isNotification: false,
    //       permission: 'view_vendor_setup',
    //       isNotProgram: true,
    //     },
    //     {
    //       title: 'List Of Users(s)',
    //       icon: 'layers',
    //       class: 'sidebar-icon-submenu',
    //       isNotification: false,
    //       permission: 'view_vendor_setup',
    //       path: '/vendor-managment/users/list',
    //       isNotProgram: true,
    //     }
    //   ]
    // },
    {

      name: 'Candidate Screening',
      title: 'hiring_process',
      icon: 'gpp_good',
      class: 'sidebar-icon',
      permission: 'menu_screening',
      isSideMenu: true,
      isSearch: false,

      sideBarSubMenu: [
        {
          title: 'hiring_process',
          icon: 'task_alt',
          class: 'sidebar-icon-submenu',
          path: '/program-setup/hiring-process',
          isNotification: false
        }
      ]
    },
    {

      name: 'Flows',
      title: 'flows_management',
      icon: 'download_done',
      class: 'sidebar-icon',
      permission: 'menu_flow_config',
      isSideMenu: true,
      isSearch: false,

      sideBarSubMenu: [
        {
          title: 'workflows',
          icon: 'task_alt',
          class: 'sidebar-icon-submenu',
          path: '/flows-management',
          isNotification: false
        }
      ]
    }
  ]

  filtereddata: SettingsModule[] = this.settingData;
  searchTerm: string = '';

  constructor (
    private storage: StorageService,private i18NextPipe:I18NextPipe
  ) { }

  getSettingsMenu() {
    return this.settingData;
  }

  updateFilteredData(): void {

    if (this.searchTerm === '') {
      this.filtereddata = this.settingData;
      return;
    }

    let tmpStore: SettingsModule[] = [];
    this.settingData.forEach((obj: any) => {

      // Present in main header
      if (this.i18NextPipe.transform(obj.title).toLowerCase().includes(this.searchTerm)){
        tmpStore.push(obj);
      }
      // Present in options
      else if (obj.sideBarSubMenu !== undefined) {

        let subMenuOptions: Array<any> = obj.sideBarSubMenu.filter(option => {
          return this.i18NextPipe.transform(option.title).toLowerCase().includes(this.searchTerm);
        });

        // console.log(subMenuOptions);
        if (subMenuOptions.length !== 0) {
          let deepObj: any = _.cloneDeep(obj);
          deepObj.sideBarSubMenu = subMenuOptions;
          tmpStore.push(deepObj);
        }
      }

    })

    this.filtereddata = tmpStore;
  }

  setSearchParam(data: string) {
    this.searchTerm = data.toLowerCase();
    this.updateFilteredData();
  }

  get currentProgram() {
    return this.storage?.get(StorageKeys.CURRENT_PROGRAM) || {};
  }
}
