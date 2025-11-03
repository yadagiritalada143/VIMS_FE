import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthguardService } from '../core/services/auth_guard.service';
import { ProgramConfigComponent } from './configs/configuration/program-config/program-config.component';
import { SelfConfigurationComponent } from './self-configuration.component';
import { ProgramDetailsComponent } from './configs/program/program-details/program-details.component';
import { CreateJobTemplatesComponent } from './configs/job/job-template/create-job-templates/create-job-templates.component';
import { MasterDataTypesComponent } from './configs/program/master-data-types/master-data-types.component';
import { RateCardsComponent } from './configs/rate/rate-cards/rate-cards-listing/rate-cards.component';
import { CostComponentListComponent } from './configs/rate/cost-component/cost-component-list/cost-component-list.component';
import { CreateCostComponentComponent } from './configs/rate/cost-component/create-cost-component/create-cost-component.component';
import { ChecklistsComponent } from './configs/onboarding/checklists/checklists.component';
import { VendorDistributionSchedulesComponent } from './configs/vendor-management/vendor-distribution-schedules/vendor-distribution-schedules.component';
import { QualificationsComponent } from './configs/job/qualifications/qualifications.component';
import { ComplianceRestrictionRulesComponent } from './configs/vendor-management/compliance-restriction-rules/compliance-restriction-rules.component';
import { RateFactorsListingComponent } from './configs/rate/rate-factors/rate-factors-listing/rate-factors-listing.component';
import { JobTemplateListComponent } from './configs/job/job-template/job-template-list/job-template-list.component';
import { VendorsListingComponent } from './configs/vendor-management/vendors/vendors-listing/vendors-listing.component';
import { VendorInvitesCreateComponent } from './configs/vendor-management/vendor-invites/vendor-invites-create/vendor-invites-create.component';
import { VendorInvitesViewComponent } from './configs/vendor-management/vendor-invites/vendor-invites-view/vendor-invites-view.component';
import { VendorInvitesComponent } from './configs/vendor-management/vendor-invites/vendor-invites.component';
import { VendorGroupsListingComponent } from './configs/vendor-management/vendor-groups/vendor-groups-listing/vendor-groups-listing.component';
import { VendorComplianceDocumentsComponent } from './configs/vendor-management/vendor-compliance-documents/vendor-compliance-documents.component';
import { VendorComplianceDocumentsViewComponent } from './configs/vendor-management/vendor-compliance-documents/vendor-compliance-documents-view/vendor-compliance-documents-view.component';
import { VendorComplianceDocumentsCreateComponent } from './configs/vendor-management/vendor-compliance-documents/vendor-compliance-documents-create/vendor-compliance-documents-create.component';
import { TasksListingComponent } from './configs/onboarding/tasks/tasks-listing/tasks-listing.component';
import { QualificationItemsComponent } from './configs/job/qualification-items/qualification-items.component';
import { MasterDataItemsComponent } from './configs/program/master-data-items/master-data-items.component';
import { UserListComponent } from './configs/user/user-list/user-list.component';
import { WorkLocationListComponent } from './configs/program/work-location/work-location-list/work-location-list.component';
import { VendorComplianceDocumentGroupsComponent } from './configs/vendor-management/vendor-compliance-document-groups/vendor-compliance-document-groups.component';
import { VendorComplianceListComponent } from './configs/vendor-management/vendor-compliance-list/vendor-compliance-list.component';
import { UserRoleListingComponent } from './configs/user/user-role/user-role-listing/user-role-listing.component';
import { PicklistsComponent } from './configs/data-management/picklists/picklists.component';
import { TimesheetConfigurationListsComponent } from './configs/configuration/timesheet-configuration/timesheet-configuration-lists/timesheet-configuration-lists.component';
import { ReasonCodeComponent } from './configs/data-management/reason-code/reason-code.component';
import { EditReasonCodeComponent } from './configs/data-management/reason-code/edit-reason-code/edit-reason-code.component';
import { ReasonCodeDetailsComponent } from './configs/data-management/reason-code/reason-code-details/reason-code-details.component';
import { CreateNewComponent } from './configs/configuration/timesheet-configuration/create-new/create-new.component';
import { NotificationLogComponent } from './configs/notifications/notification-log/notification-log.component';
import { RuleConfigurationListComponent } from './configs/configuration/rule-configuration/rule-configuration-list/rule-configuration-list.component';
import { CreateNewRuleConfigComponent } from './configs/configuration/rule-configuration/create-new-rule-config/create-new-rule-config.component';
import { ViewRuleConfigurationComponent } from './configs/configuration/rule-configuration/view-rule-configuration/view-rule-configuration.component';
import { CreateNewWorkLocationComponent } from './configs/program/work-location/create-new-work-location/create-new-work-location.component';
import { ViewWorkLocationComponent } from './configs/program/work-location/view-work-location/view-work-location.component';
import { ViewJobTemplateComponent } from './configs/job/job-template/view-job-template/view-job-template.component';
import { TasksDetailComponent } from './configs/onboarding/tasks/tasks-detail/tasks-detail.component';
import { VendorComplianceDocumentGroupsCreateComponent } from './configs/vendor-management/vendor-compliance-document-groups-create/vendor-compliance-document-groups-create.component';
import { CreateVendorGroupComponent } from './configs/vendor-management/vendor-groups/create-vendor-group/create-vendor-group.component';
import { ViewVendorGroupComponent } from './configs/vendor-management/vendor-groups/view-vendor-group/view-vendor-group.component';
import { VendorComplianceDocumentGroupsViewComponent } from './configs/vendor-management/vendor-compliance-document-groups-view/vendor-compliance-document-groups-view.component';
import { ImpactedAssignmentDetailsComponent } from './configs/configuration/timesheet-configuration/impacted-assignment-details/impacted-assignment-details.component';
import { ViewMasterDataItemComponent } from './configs/program/master-data-items/view-master-data-item/view-master-data-item.component';
import { MasterDataItemDetailComponent } from './configs/program/master-data-items/master-data-item-detail/master-data-item-detail.component';
import { NotificationReminderThresholdComponent } from './configs/notifications/notification-reminder-threshold/notification-reminder-threshold.component';
import { ViewMasterDataComponent } from './configs/program/master-data-types/view-master-data/view-master-data.component';
import { MasterDataDetailsComponent } from './configs/program/master-data-types/master-data-details/master-data-details.component';
import { LaborCategoryComponent } from './configs/data-management/labor-category/labor-category.component';
import { CreateLaborCategoryComponent } from './configs/data-management/create-labor-category/create-labor-category.component';
import { ViewLaborCategoryComponent } from './configs/data-management/view-labor-category/view-labor-category.component';
import { PreferencesComponent } from '../program-setup/notification-config/preferences/preferences.component';
import { SupportTextListComponent } from './configs/program/supporting-text/support-text-list/support-text-list.component';
import { SupportTextViewComponent } from './configs/program/supporting-text/support-text-view/support-text-view.component';
import { UploadUtilityComponent } from './configs/data-management/upload-utility/upload-utility.component';
import { OnbaordSetupComponent } from '../vendor-managment/onbaord-setup/onbaord-setup.component';
import { CostComponentDetailsComponent } from './configs/rate/cost-component/cost-component-details/cost-component-details.component';
import { CostComponentGroupDetailsComponent } from './configs/rate/cost-component-group/cost-component-group-details/cost-component-group-details.component';
import { CostComponentGroupListComponent } from './configs/rate/cost-component-group/cost-component-group-list/cost-component-group-list.component';
import { CreateCostComponentGroupComponent } from './configs/rate/cost-component-group/create-cost-component-group/create-cost-component-group.component';
import { PasswordPolicyComponent } from './configs/user/password-policy/password-policy.component';
import { CredentialingComponent } from './configs/configuration/credentialing/credentialing.component';

const routes: Routes = [
  {
    path: '',
    component: SelfConfigurationComponent,
    children: [
      {
        path: 'program',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        children: [
          {
            path: 'program-details',
            canActivate: [AuthguardService],
            data: { userRoles: ['program_details_view'] },
            component: ProgramDetailsComponent,
          },
          {
            path: 'hierarchy',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            data: { userRoles: ['hierarchy_view'] },
            loadChildren: () =>
              import('src/app/self-configuration/configs/program/hierarchy-configuration/hierarchy-configuration.module').then(
                m => m.HierarchyConfigurationModule,
              ),
          },
          {
            path: 'master-data-type',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            children: [
              {
                path: 'list',
                component: MasterDataTypesComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['master_data_view'] },
              },
              {
                path: 'view/:id',
                component: ViewMasterDataComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['master_data_view'] },
              },
              {
                path: 'create',
                component: MasterDataDetailsComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['master_data_manage'] },
              },
              {
                path: 'edit/:id',
                component: MasterDataDetailsComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['master_data_manage'] },
              },
            ],
          },
          {
            path: 'master-data-type/list-foundational-data/:id',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            children: [
              {
                path: 'list',
                component: MasterDataItemsComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['master_data_view'] },
              },
              {
                path: 'view/:item',
                component: ViewMasterDataItemComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['master_data_view'] },
              },
              {
                path: 'create',
                component: MasterDataItemDetailComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['master_data_manage'] },
              },
              {
                path: 'edit/:item',
                component: MasterDataItemDetailComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['master_data_manage'] },
              },
            ],
          },
          {
            path: 'work-location',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            children: [
              {
                path: 'list',
                component: WorkLocationListComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['work_location_view'] },
              },
              {
                path: 'create',
                component: CreateNewWorkLocationComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['work_location_manage'] },
              },
              {
                path: `view`,
                component: ViewWorkLocationComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['work_location_view'] },
              },
              {
                path: `edit`,
                component: CreateNewWorkLocationComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['work_location_manage'] },
              },
            ],
          },
          {
            path: 'support-text',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            children: [
              {
                path: 'list',
                component: SupportTextListComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['supporting_text_view'] },
              },
              {
                path: 'view/:id',
                component: SupportTextViewComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['supporting_text_view'] },
              },
              {
                path: 'edit/:id',
                component: SupportTextViewComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['supporting_text_manage'] },
              },
            ],
          },
          {
            path: 'program-setup',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            loadChildren: () => import('../program-setup/program-setup.module').then(m => m.ProgramSetupModule),
          },
          {
            path: 'workflow',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            data: { userRoles: ['workflow_view'] },
            loadChildren: () =>
              import('src/app/self-configuration/flows-management/flows-management.module').then(m => m.FlowsManagementModule),
          },
          {
            path: 'rules-builder',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            data: { userRoles: ['rule_builder_view'] },
            loadChildren: () =>
              import('src/app/self-configuration/rule-management/rules-management.module').then(m => m.RulesManagementModule),
          },
        ],
      },
      {
        path: 'onboarding',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        children: [
          {
            path: 'task/list',
            canActivate: [AuthguardService],
            data: { userRoles: ['task_view'] },
            component: TasksListingComponent,
          },
          {
            path: `task/create`,
            canActivate: [AuthguardService],
            data: { userRoles: ['task_manage'] },
            component: TasksDetailComponent,
          },
          {
            path: `task/:id/mode/:mode`,
            canActivate: [AuthguardService],
            data: { userRoles: ['task_view'] },
            component: TasksDetailComponent,
          },
          {
            path: `task/checklist`,
            canActivate: [AuthguardService],
            data: { userRoles: ['checklist_view'] },
            component: ChecklistsComponent,
          },
        ],
      },
      {
        path: 'tenure-limit',
        loadChildren: () => import('../program-setup/tenure-limit/tenure-limit.module').then(m => m.TenureLimitModule),
      },
      {
        path: 'invoice',
        loadChildren: () =>
          import('../program-setup/invoice-configuration/invoice-configuration.module').then(m => m.InvoiceConfigurationModule),
      },
      {
        path: 'vendor/vendor-list',
        component: VendorsListingComponent,
      },
      {
        path: 'vendor/vendor-group-list',
        component: VendorGroupsListingComponent,
      },
      {
        path: 'vendor/create-vendor-group',
        component: CreateVendorGroupComponent,
      },
      {
        path: 'vendor/edit-vendor-group/:id',
        component: CreateVendorGroupComponent,
      },
      {
        path: 'vendor/view-vendor-group/:id',
        component: ViewVendorGroupComponent,
      },
      {
        path: 'vendor/vendor-compliance-list',
        component: VendorComplianceDocumentsComponent,
      },
      {
        path: 'vendor/vendor-compliance-view/:id',
        component: VendorComplianceDocumentsViewComponent,
      },
      {
        path: 'vendor/vendor-compliance-create',
        component: VendorComplianceDocumentsCreateComponent,
      },
      {
        path: 'vendor/vendor-distribution-list',
        component: VendorDistributionSchedulesComponent,
      },
      {
        path: 'vendor/compliance-restriction-rule',
        component: ComplianceRestrictionRulesComponent,
      },
      {
        path: 'vendor/vendor-document-group-list',
        component: VendorComplianceDocumentGroupsComponent,
      },
      {
        path: 'vendor/compliance-list/:progId/:orgId',
        component: VendorComplianceListComponent,
      },
      {
        path: 'vendor',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        children: [{
          path: 'vendor-invites/list',
          component: VendorInvitesComponent
        }, {
          path: 'vendor-invites/create',
          component: VendorInvitesCreateComponent
        }, {
          path: 'vendor-invites/edit/:id',
          component: VendorInvitesCreateComponent
        }, {
          path: 'vendor-invites/resend/:id',
          component: VendorInvitesCreateComponent
        }, {
          path: 'vendor-invites/view/:id',
          component: VendorInvitesViewComponent
        }, {
          path: 'vendor-list',
          canActivate: [AuthguardService],
          data: { userRoles: ['vendors_view'] },
          component: VendorsListingComponent
        }, {
          path: 'vendor-group-list',
          canActivate: [AuthguardService],
          data: { userRoles: ['vendor_group_view'] },
          component: VendorGroupsListingComponent
        }, {
          path: 'vendor-compliance-list',
          canActivate: [AuthguardService],
          data: { userRoles: ['vendor_compliance_view'] },
          component: VendorComplianceDocumentsComponent
        }, {
          path: 'compliance-restriction-rule',
          canActivate: [AuthguardService],
          data: { userRoles: ['vendor_compliance_view'] },
          component: ComplianceRestrictionRulesComponent
        }, {
          path: 'vendor-document-group-list',
          canActivate: [AuthguardService],
          data: { userRoles: ['vendor_compliance_view'] },
          component: VendorComplianceDocumentGroupsComponent
        }, {
          path: 'vendor-distribution-list',
          canActivate: [AuthguardService],
          data: { userRoles: ['vendor_distribution_schedule_view'] },
          component: VendorDistributionSchedulesComponent
        }, {
          path: 'vendor-document-group-create',
          canActivate: [AuthguardService],
          data: { userRoles: ['vendor_compliance_manage'] },
          component: VendorComplianceDocumentGroupsCreateComponent
        }, {
          path: 'vendor-document-group-view',
          canActivate: [AuthguardService],
          data: { userRoles: ['vendor_compliance_view'] },
          component: VendorComplianceDocumentGroupsViewComponent
        }, {
          path: 'compliance-list/:progId/:orgId',
          canActivate: [AuthguardService],
          data: { userRoles: ['vendor_compliance_view'] },
          component: VendorComplianceListComponent
        }]
      },
      {
        path: 'notifications/log',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: { userRoles: ['notification_log_view'] },
        component: NotificationLogComponent,
      },
      {
        path: 'notifications/preferences',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: { userRoles: ['notification_preferences'] },
        component: PreferencesComponent,
      },
      {
        path: 'notifications/reminder-threshold',
        component: NotificationReminderThresholdComponent,
      },
      {
        path: 'notifications',
        loadChildren: () => import('../program-setup/notifications/notifications.module').then(m => m.NotificationsModule),
      },
      {
        path: 'rate-factor/list',
        component: RateFactorsListingComponent,
      },
      {
        path: 'rate-factor',
        // loadChildren: './rate-factor/rate-factor.module#RateFactorModule'
        loadChildren: () => import('../program-setup/rate-factor/rate-factor.module').then(m => m.RateFactorModule),
      },
      {
        // path: 'users/list',
        path: 'rate',
        canActivateChild: [AuthguardService],
        canActivate: [AuthguardService],
        children: [
          {
            path: 'rate-factor/list',
            canActivate: [AuthguardService],
            data: { userRoles: ['rate_factor_view'] },
            component: RateFactorsListingComponent,
          },
          {
            path: 'rate-factor',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            data: { userRoles: ['rate_factor_view'] },
            loadChildren: () => import('../program-setup/rate-factor/rate-factor.module').then(m => m.RateFactorModule),
          },
          {
            path: 'rate-card/list',
            canActivate: [AuthguardService],
            data: { userRoles: ['rate_card_view'] },
            component: RateCardsComponent,
          },
          {
            path: 'cost-component/list',
            canActivate: [AuthguardService],
            component: CostComponentListComponent,
          },
          {
            path: 'cost-component/create',
            canActivate: [AuthguardService],
            component: CreateCostComponentComponent,
          },
          {
            path: 'cost-component/details/:id',
            canActivate: [AuthguardService],
            component: CostComponentDetailsComponent,
          },
          {
            path: 'cost-component/edit/:id',
            canActivate: [AuthguardService],
            component: CreateCostComponentComponent,
          },
          {
            path: 'cost-component-group/list',
            canActivate: [AuthguardService],
            component: CostComponentGroupListComponent,
          },
          {
            path: 'cost-component-group/create',
            canActivate: [AuthguardService],
            component: CreateCostComponentGroupComponent,
          },
          {
            path: 'cost-component-group/details/:id',
            canActivate: [AuthguardService],
            component: CostComponentGroupDetailsComponent,
          },
          {
            path: 'cost-component-group/edit/:id',
            canActivate: [AuthguardService],
            component: CreateCostComponentGroupComponent,
          },
          {
            path: 'rate-card',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            data: { userRoles: ['rate_card_view'] },
            loadChildren: () => import('../program-setup/rate-card/rate-card.module').then(m => m.RateCardModule),
          },
        ],
      },
      {
        path: 'users',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        children: [{
          path: 'list',
          canActivate: [AuthguardService],
          data: { userRoles: ['user_view'] },
          component: UserListComponent
        }, {
          path: 'roles',
          canActivate: [AuthguardService],
          data: { userRoles: ['user_role_view'] },
          component: UserRoleListingComponent
        }, {
          path: 'organization-users',
          canActivate: [AuthguardService],
          data: { userRoles: ['user_view'] },
          loadChildren: () => import('../user-management/user-management.module').then(m => m.UserManagementModule),
        }, {
          path: 'password-policy',
          canActivate: [AuthguardService],
          data: { userRoles: ['password_policies_view'] },
          component: PasswordPolicyComponent
        }]
      },
      {
        path: 'users',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: { userRoles: ['user_view'] },
        loadChildren: () => import('../program-setup/manage-users/manage-users.module').then(m => m.ManageUsersModule),
      },
      {
        path: 'job',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        children: [
          {
            path: 'qualificationsList',
            children: [
              {
                path: 'list-qualifications',
                canActivate: [AuthguardService],
                data: { userRoles: ['qualification_view'] },
                component: QualificationItemsComponent,
              },
              {
                path: 'list',
                canActivate: [AuthguardService],
                data: { userRoles: ['qualification_view'] },
                component: QualificationsComponent,
              },
            ],
          },
          {
            path: 'job-template',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            children: [
              {
                path: 'list',
                canActivate: [AuthguardService],
                data: { userRoles: ['job_template_view'] },
                component: JobTemplateListComponent,
              },
              {
                path: 'create',
                canActivate: [AuthguardService],
                data: { userRoles: ['job_template_manage'] },
                component: CreateJobTemplatesComponent,
              },
              {
                path: 'view/:id/:name',
                canActivate: [AuthguardService],
                data: { userRoles: ['job_template_view'] },
                component: ViewJobTemplateComponent,
              },
              {
                path: 'create/:id/:name',
                canActivate: [AuthguardService],
                data: { userRoles: ['job_template_manage'] },
                component: CreateJobTemplatesComponent,
              },
            ],
          },
        ],
      },
      {
        path: 'configuration',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        children: [
          {
            path: 'fees-configuration',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            loadChildren: () =>
              import('./configs/configuration/fees-configuration/fees-configuration.module').then(m => m.FeesConfigurationModule),
          },
          {
            path: 'invoice-configuration',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            loadChildren: () =>
              import('./configs/configuration/invoice-configuration/invoice-configuration.module').then(m => m.InvoiceConfigurationModule),
          },
          {
            path: 'credentialing',
            canActivate: [AuthguardService],
            data: { userRoles: ['view_credentialing'] },
            component: CredentialingComponent,
          },
          {
            path: 'expense-configuration',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            data: { userRoles: ['expense_configuration_view'] },
            loadChildren: () =>
              import('./configs/configuration/expense-configuration/expense-configuration.module').then(m => m.ExpenseConfigurationModule),
          },
          {
            path: 'accuracy-configuration',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            loadChildren: () =>
              import('./configs/configuration/accuracy-configuration/accuracy-configuration.module').then(
                m => m.AccuracyConfigurationModule,
              ),
          },
          {
            path: 'assignment-configuration',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            loadChildren: () =>
              import('./configs/configuration/assignment-configuration/assignment-configuration.module').then(
                m => m.AssignmentConfigurationModule,
              ),
          },
          {
            path: 'program-configuration',
            canActivate: [AuthguardService],
            data: { userRoles: ['program_configuration_view'] },
            component: ProgramConfigComponent,
          },
          {
            path: 'program-setup',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            loadChildren: () => import('../program-setup/program-setup.module').then(m => m.ProgramSetupModule),
          },
          {
            path: 'timesheet',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            data: { userRoles: ['timesheet_configuration_view'] },
            children: [
              {
                path: '',
                component: TimesheetConfigurationListsComponent,
              },
              {
                path: 'create',
                canActivate: [AuthguardService],
                component: CreateNewComponent,
              },
              {
                path: 'list',
                component: TimesheetConfigurationListsComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['timesheet_configuration_view'] },
              },
              {
                path: 'impacted-assignment-details',
                component: ImpactedAssignmentDetailsComponent,
                canActivate: [AuthguardService],
                data: { userRoles: ['timesheet_configuration_view'] },
              },
            ],
          },
          {
            path: 'timesheet-rule',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            data: { userRoles: ['timesheet_rule_configuration_view'] },
            children: [
              {
                path: '',
                component: RuleConfigurationListComponent,
              },
              {
                path: 'create',
                canActivate: [AuthguardService],
                data: { userRoles: ['timesheet_rule_configuration_manage', 'timesheet_rule_configuration_view'] },
                component: CreateNewRuleConfigComponent,
              },
              {
                path: 'list',
                canActivate: [AuthguardService],
                data: { userRoles: ['timesheet_rule_configuration_view'] },
                component: RuleConfigurationListComponent,
              },
              {
                path: 'view',
                canActivate: [AuthguardService],
                data: { userRoles: ['timesheet_rule_configuration_view'] },
                component: ViewRuleConfigurationComponent,
              },
            ],
          },
        ],
      },
      {
        path: 'data-management',
        canActivateChild: [AuthguardService],
        canActivate: [AuthguardService],
        children: [
          {
            path: 'reason-codes',
            children: [
              {
                path: '',
                canActivate: [AuthguardService],
                data: { userRoles: ['reason_code_view'] },
                component: ReasonCodeComponent,
              },
              {
                path: 'reason-code-details',
                canActivate: [AuthguardService],
                data: { userRoles: ['reason_code_view'] },
                component: ReasonCodeDetailsComponent,
              },
              {
                path: 'edit-reason',
                canActivate: [AuthguardService],
                data: { userRoles: ['reason_code_manage'] },
                component: EditReasonCodeComponent,
              },
            ],
          },
          {
            path: 'setup/account-codes',
            loadChildren: () => import('../account-code-setup/account-code-setup.module').then(m => m.AccountCodeSetupModule),
          },
          {
            path: 'picklist',
            canActivate: [AuthguardService],
            data: { userRoles: ['picklist_view'] },
            component: PicklistsComponent,
          },
          {
            path: 'custom-field',
            canActivate: [AuthguardService],
            canActivateChild: [AuthguardService],
            data: { userRoles: ['custom_field_view'] },
            loadChildren: () =>
              import('../self-configuration/configs/data-management/custom-field/custom-field-management.module').then(
                m => m.CustomFieldManagementModule,
              ),
          },
          {
            path: 'labor-categories',
            canActivate: [AuthguardService],
            // data: { userRoles: ['labor_category_manage','labor_category_view'] },
            component: LaborCategoryComponent,
          },
          {
            path: 'labor-create',
            canActivate: [AuthguardService],
            // data: { userRoles: ['labor_category_manage','labor_category_view'] },
            component: CreateLaborCategoryComponent,
          },
          {
            path: 'labor-view',
            canActivate: [AuthguardService],
            // data: { userRoles: ['labor_category_manage','labor_category_view'] },
            component: ViewLaborCategoryComponent,
          },
          {
            path: 'upload-utility',
            canActivate: [AuthguardService],
            // data: { userRoles: ['labor_category_manage','labor_category_view'] },
            component: UploadUtilityComponent,
          },
        ],
      },
      {
        path: 'notification/config',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: { userRoles: ['notification_view'] },
        loadChildren: () => import('../program-setup/notification-config/notification-config.module').then(m => m.NotificationConfigModule),
      },
      {
        path: 'tax-configuration',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: { userRoles: ['view_tax_configuration'] },
        loadChildren: () => import('../tax-configuration/tax-configuration.module').then(m => m.TaxConfigurationModule),
      },
      {
        path: 'vendor-managment/setup',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: { userRoles: ['vendor_details'] },
        component: OnbaordSetupComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SelfConfigurationRoutingModule {}
