import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main.component';
import { AuthguardService } from '../core/services/auth_guard.service';
import { ExpenseRoutes } from '../expense/enums/expense.enums';
import { ReportRoutes } from '../reports/enums/report.enums';
import { GraphCallbackComponent } from './component/graph-callback/graph-callback.component';
import { ExpenseConfigurationRoutes } from '../program-setup/expense-configuration/enums/expense-configuration.enums';
import { CreateCandidateComponent } from '../candidates/create-candidate/create-candidate.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'control-panel',
    canActivate: [AuthguardService],
    canActivateChild: [AuthguardService],
    loadChildren: () => import('../control-panel/control-panel.module').then(m => m.ControlPanelModule),
  },
  {
    path: 'graph-callback',
    component: GraphCallbackComponent,
  },
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: 'qualifications',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        loadChildren: () => import('../qualification/qualification.module').then(m => m.QualificationModule),
      },
      {
        path: 'programs',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['menu_programs'],
        },
        loadChildren: () => import('../programs/programs.module').then(m => m.ProgramsModule),
      },
      {
        path: 'assignment',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['menu_assignments'],
        },
        loadChildren: () => import('../assignment/assignment.module').then(m => m.AssignmentModule),
      },
      {
        path: 'org',
        canActivate: [AuthguardService],
        loadChildren: () => import('../organizations/organizations.module').then(m => m.OrganizationsModule),
      },
      {
        path: 'jobs',
        loadChildren: () => import('../jobs/jobs.module').then(m => m.JobsModule),
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['menu_jobs'],
        },
      },
      {
        path: 'candidates',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['menu_candidates'],
        },
        loadChildren: () => import('../candidates/candidates.module').then(m => m.CandidatesModule)
      },
      {
        path: 'master-talent-profile',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_master_talent_profile'],
        },
        loadChildren: () => import('../master-talent-profiles/master-talent-profiles.module').then(m => m.MasterTalentProfilesModule)
      },
      {
        // Added for only Worker edit. Please do not remove this without consent
        path: 'candidate-worker/edit/:id',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_assignment'],
        },
        component: CreateCandidateComponent
      },
      {
        path: 'create_sow',
        redirectTo: 'sow/create_sow',
        pathMatch: 'full'
      },
      {
        path: 'projects_list',
        redirectTo: 'sow/milestones_list',
        pathMatch: 'full'
      },
      {
        path: 'progress_list',
        redirectTo: 'sow/progress_list',
        pathMatch: 'full'
      },
      {
        path: 'sow',
        loadChildren: () => import('../sows/sows.module').then(m => m.SowsModule)
      },
      {
        path: 'createrfx',
        redirectTo: 'rfx/create',
        pathMatch: 'full'
      },
      {
        path: 'rfx',
        loadChildren: () => import('../rfxs/rfx.module').then(m => m.RFxModule)
      },
      {
        path: 'vendor_sow',
        loadChildren: () => import('../sows/sows.module').then(m => m.SowsModule)
      },
      {
        path: 'dashboard',
        loadChildren: () => import('../dashboard/dashboard.module').then(m => m.DashboardModule),
      },
      {
        path: 'view-dashboard',
        loadChildren: () => import('../view-dashboard/view-dashboard.module').then(m => m.ViewDashboardModule)
      },
      {
        path: 'pending-actions',
        loadChildren: () => import('../pending-action/pending-action.module').then(m => m.PendingActionModule)
      },
      {
        path: 'view-reports',
        loadChildren: () => import('../view-reports/view-reports.module').then(m => m.ViewReportsModule)
      },
      {
        path: 'settings',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: { 'userRoles': ['menu_settings'] },
        loadChildren: () => import('../settings/settings.module').then(m => m.SettingsModule),
      },
      {
        path: 'self-configuration',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: { 'userRoles': ['menu_self_configuration'] },
        loadChildren: () => import('../self-configuration/self-configuration.module').then(m => m.SelfConfigurationModule),
      },
      {
        path: 'rate-card',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: { 'userRoles': ['menu_rate_cards','rate_card_view'] },
        loadChildren: () => import('../program-setup/rate-card/rate-card.module').then(m => m.RateCardModule)
      },
      {
        path: 'program-setup',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        loadChildren: () => import('../program-setup/program-setup.module').then(m => m.ProgramSetupModule),
      },
      {
        path: 'questionnaire',
        loadChildren: () => import('../program-setup/questionnaire/questionnaire.module').then(m => m.QuestionnaireModule)
      },
      {
        path: 'onboarding-configuration',
        loadChildren: () => import('../program-setup/onboarding-configuration/onboarding-configuration.module').then(m => m.OnboardingConfigurationModule)
      },
      {
        path: ExpenseConfigurationRoutes.Root,
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['expense_configuration_view'],
        },
        loadChildren: () =>
          import('../program-setup/expense-configuration/expense-configuration.module').then(m => m.ExpenseConfigurationModule)
      },
      {
        path: 'assignment',
        loadChildren: () => import('../program-setup/assignment-configuration/assignment-configuration.module').then(m => m.AssignmentConfigurationModule),
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['menu_assignment_configurations', 'assignment_configuration_view'],
        },
      },
      {
        path: 'timesheet',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['timesheet_configuration_view'],
        },
        loadChildren: () => import('../program-setup/timesheet-configuration/timesheet-configuration.module').then(m => m.TimesheetConfigurationModule)
      },
      {
        path: 'tenure-limit',
        loadChildren: () =>
          import('../program-setup/tenure-limit/tenure-limit.module').then(m => m.TenureLimitModule)
      },
      {
        path: 'invoice',
        loadChildren: () => import('../program-setup/invoice-configuration/invoice-configuration.module').then(m => m.InvoiceConfigurationModule)
      },
      {
        path: 'vendor',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['vendors_view'],
        },
        loadChildren: () => import('../program-setup/vendor/vendor.module').then(m => m.VendorModule)
      },
      {
        path: 'job-template',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['job_template_view'],
        },
        loadChildren: () => import('../program-setup/job-managment/job-managment.module').then(m => m.JobManagmentModule)
      },
      {
        path: 'custom-fields',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['custom_field_view'],
        },
        loadChildren: () => import('../program-setup/custom-fields/custom-fields.module').then(m => m.CustomFieldsModule)
      },
      {
        path: 'notifications',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['notification_view'],
        },
        loadChildren: () => import('../program-setup/notifications/notifications.module').then(m => m.NotificationsModule)
      },
      {
        path: 'cost-component',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {},
        loadChildren: () => import('../self-configuration/configs/rate/cost-component/cost-component.module').then(m => m.CostComponentModule)
      },
      {
        path: 'cost-component-group',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {},
        loadChildren: () => import('../self-configuration/configs/rate/cost-component-group/cost-component-group.module').then(m => m.CostComponentGroupModule)
      },
      {
        path: 'rate-factor',
        // loadChildren: './rate-factor/rate-factor.module#RateFactorModule'
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['rate_factor_view'],
        },
        loadChildren: () => import('../program-setup/rate-factor/rate-factor.module').then(m => m.RateFactorModule)
      },
      {
        path: 'users',
        canActivateChild: [AuthguardService],
        loadChildren: () => import('../program-setup/manage-users/manage-users.module').then(m => m.ManageUsersModule)
      },
      {
        path: 'qualificationsList',
        // loadChildren: '../program-setup/qualifications/qualifications.module#QualificationsModule'
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['qualification_view'],
        },
        loadChildren: () => import('../program-setup/qualifications/qualifications.module').then(m => m.QualificationsModule)
      },
      {
        path: 'hierarchy',
        canActivateChild: [AuthguardService],
        //loadChildren: '../hierarchy/hierarchy.module#HierarchyModule'
        loadChildren: () => import('../program-setup/hierarchy/hierarchy.module').then(m => m.HierarchyModule),
      },
      /* {
        path: 'generic-timesheet',
        canActivate: [AuthguardService],
        loadChildren: () => import('../timesheet/timesheet.module').then(m => m.TimesheetModule),
      }, */
      {
        path: 'timesheet',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        loadChildren: () => import('../wipro-timesheet/timesheet.module').then(m => m.TimesheetModule),
      },
      {
        path: 'setup/account-codes',
        loadChildren: () => import('../account-code-setup/account-code-setup.module').then(m => m.AccountCodeSetupModule)
      },

      {
        path: 'vendor-managment',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        loadChildren: () => import('../vendor-managment/vendor-managment.module').then(m => m.VendorManagmentModule),
      },
      {
        path: ReportRoutes.Root,
        loadChildren: () => import('../reports/reports.module').then(m => m.ReportsModule),
      },
      {
        path: 'user-management',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        loadChildren: () => import('../user-management/user-management.module').then(m => m.UserManagementModule),
      },
      {
        path: 'edit-rules',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        loadChildren: () => import('../edit-rules/edit-rules.module').then(m => m.EditRulesModule),
      },
      {
        path: 'invoice',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        loadChildren: () => import('../invoice/invoice.module').then(m => m.InvoiceModule),
      },
      {
        path: 'auth/user-account',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        loadChildren: () => import('../auth/user-account/user-account.module').then(m => m.UserAccountModule),
      },
      {
        path: 'configuration/fees-configuration',
        loadChildren: () => import('../fee-settings/fee-settings.module').then(m => m.FeeSettingsModule)
      },
      {
        path: ExpenseRoutes.Root,
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        loadChildren: () => import('../expense/expense.module').then(m => m.ExpenseModule),
      },
      {
        path: 'reason-codes',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['reason_code_view'],
        },
        loadChildren: () => import('../program-setup/reason-codes/reason-codes.module').then(m => m.ReasonCodesModule)
      },
      {
        path: 'notification/config',
        canActivateChild: [AuthguardService],
        loadChildren: () => import('../program-setup/notification-config/notification-config.module').then(m => m.NotificationConfigModule)
      },
      {
        path: 'flows-management',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['menu_flow_config','workflow_view'],
        },
        loadChildren: () => import('../program-setup/flows-management/flows-management.module').then(m => m.FlowsManagementModule),
      },
      {
        path: 'tax-configuration',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: { 'userRoles': ['view_tax_configuration'] },
        loadChildren: () => import('../tax-configuration/tax-configuration.module').then(m => m.TaxConfigurationModule)
      },
      {
        path: 'picklist',
        data: { 'userRoles': ['view_picklist','picklist_view'] },
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        loadChildren: () => import('../picklist/picklist.module').then(m => m.PicklistModule)
      },
      {
        path: 'my-library',
        loadChildren: () => import('../documents-library/documents-library.module').then(m => m.DocumentsLibraryModule),
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
