import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SelfConfigurationRoutingModule } from './self-configuration-routing.module';
import { SelfConfigurationComponent } from './self-configuration.component';
import { SelfConfigSidebarComponent } from './components/self-config-sidebar/self-config-sidebar.component';

import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { SelfConfigHeaderComponent } from './components/self-config-header/self-config-header.component';
import { SharedModule } from '../shared/shared.module';
import { ProgramDetailsComponent } from './configs/program/program-details/program-details.component';
import { ProgramSetupModule } from '../program-setup/program-setup.module';
import { ProgramConfigComponent } from './configs/configuration/program-config/program-config.component';
import { BaseProgramConfigComponent } from './configs/configuration/program-config/base/base-program-config.component';
import { JobProgramConfigComponent } from './configs/configuration/program-config/job-program-config/job-program-config.component';
import { LoadCompDirective } from './configs/shared/directives/loadcomponent/load-comp.directive';
import { NgSelectModule } from '@ng-select/ng-select';
import { ProgramConfigControlComponent } from './configs/configuration/program-config/program-config-control/program-config-control.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotificationProgramConfigComponent } from './configs/configuration/program-config/notification-program-config/notification-program-config.component';
import { SubmissionProgramConfigComponent } from './configs/configuration/program-config/submission-program-config/submission-program-config.component';
import { CandidateProgramConfigComponent } from './configs/configuration/program-config/candidate-program-config/candidate-program-config.component';
import { OfferProgramConfigComponent } from './configs/configuration/program-config/offer-program-config/offer-program-config.component';
import { FeaturesConfigComponent } from './configs/configuration/program-config/features-config/features-config.component';
import { InterviewConfigComponent } from './configs/configuration/program-config/interview-config/interview-config.component';
import { PlatformProgramConfigComponent } from './configs/configuration/program-config/platform-program-config/platform-program-config.component';
import { QuillModule } from 'ngx-quill';
import { MasterDataTypesComponent } from './configs/program/master-data-types/master-data-types.component';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { HierarchyModule } from '../program-setup/hierarchy/hierarchy.module';
import { SvmsTableModule } from '../library/svms-table/svms-table.module';
import { RateCardsComponent } from './configs/rate/rate-cards/rate-cards-listing/rate-cards.component';
import { RateCardModule } from '../program-setup/rate-card/rate-card.module';
import { ChecklistsComponent } from './configs/onboarding/checklists/checklists.component';
import { OnboardingConfigurationModule } from '../program-setup/onboarding-configuration/onboarding-configuration.module';
import { VendorDistributionSchedulesComponent } from './configs/vendor-management/vendor-distribution-schedules/vendor-distribution-schedules.component';
import { VendorModule } from '../program-setup/vendor/vendor.module';
import { FlowsListComponent } from 'src/app/self-configuration/flows-management/flows-list/flows-list.component';
import { FlowDetailedListingComponent } from 'src/app/self-configuration/flows-management/flow-detailed-listing/flow-detailed-listing.component';
import { FlowsManagementModule } from 'src/app/self-configuration/flows-management/flows-management.module';
import { RulesManagementModule } from 'src/app/self-configuration/rule-management/rules-management.module';
import { QualificationsComponent } from './configs/job/qualifications/qualifications.component';
import { QualificationsModule } from '../program-setup/qualifications/qualifications.module';
import { WorkLocationListComponent } from './configs/program/work-location/work-location-list/work-location-list.component';
import { ComplianceRestrictionRulesComponent } from './configs/vendor-management/compliance-restriction-rules/compliance-restriction-rules.component';
import { RateFactorsListingComponent } from './configs/rate/rate-factors/rate-factors-listing/rate-factors-listing.component';
import { RateFactorModule } from '../program-setup/rate-factor/rate-factor.module';
import { CostComponentModule } from './configs/rate/cost-component/cost-component.module';
import { JobTemplateListComponent } from './configs/job/job-template/job-template-list/job-template-list.component';
import { CreateJobTemplatesComponent } from './configs/job/job-template/create-job-templates/create-job-templates.component';
import { VendorsListingComponent } from './configs/vendor-management/vendors/vendors-listing/vendors-listing.component';
import { VendorGroupsListingComponent } from './configs/vendor-management/vendor-groups/vendor-groups-listing/vendor-groups-listing.component';
import { VendorComplianceDocumentsComponent } from './configs/vendor-management/vendor-compliance-documents/vendor-compliance-documents.component';
import { VendorComplianceDocumentsViewComponent } from './configs/vendor-management/vendor-compliance-documents/vendor-compliance-documents-view/vendor-compliance-documents-view.component';
import { VendorComplianceDocumentsCreateComponent } from './configs/vendor-management/vendor-compliance-documents/vendor-compliance-documents-create/vendor-compliance-documents-create.component';
import { TasksListingComponent } from './configs/onboarding/tasks/tasks-listing/tasks-listing.component';
import { QualificationItemsComponent } from './configs/job/qualification-items/qualification-items.component';
import { MasterDataItemsComponent } from './configs/program/master-data-items/master-data-items.component';
import { UserListComponent } from './configs/user/user-list/user-list.component';
import { VendorComplianceDocumentGroupsComponent } from './configs/vendor-management/vendor-compliance-document-groups/vendor-compliance-document-groups.component';
import { VendorComplianceListComponent } from './configs/vendor-management/vendor-compliance-list/vendor-compliance-list.component';
import { VendorManagmentModule } from '../vendor-managment/vendor-managment.module';
import { CustomFieldsModule } from '../program-setup/custom-fields/custom-fields.module';
import { CustomFieldsModule as CFModule } from '../library/custom-fields/custom-fields.module';
import { HierarchyConfigurationListingComponent } from './configs/program/hierarchy-configuration/hierarchy-configuration-listing/hierarchy-configuration-listing.component';
import { UserRoleListingComponent } from './configs/user/user-role/user-role-listing/user-role-listing.component';
import { UserManagementModule } from '../user-management/user-management.module';
import { ManageUsersModule } from '../program-setup/manage-users/manage-users.module';
import { PicklistsComponent } from './configs/data-management/picklists/picklists.component';
import { PicklistModule } from '../picklist/picklist.module';
import { TimesheetConfigurationListsComponent } from './configs/configuration/timesheet-configuration/timesheet-configuration-lists/timesheet-configuration-lists.component';
import { CreateNewComponent } from './configs/configuration/timesheet-configuration/create-new/create-new.component';
import { BreakRuleComponent } from './configs/configuration/timesheet-configuration/break-rule/break-rule.component';
import { CreateHierarchyComponent } from './configs/program/hierarchy-configuration/create-hierarchy/create-hierarchy.component';
import { ViewHierarchyComponent } from './configs/program/hierarchy-configuration/view-hierarchy/view-hierarchy.component';
import { HierarchyConfigurationModule } from './configs/program/hierarchy-configuration/hierarchy-configuration.module';
import { ReasonCodeComponent } from './configs/data-management/reason-code/reason-code.component';
import { EditReasonCodeComponent } from './configs/data-management/reason-code/edit-reason-code/edit-reason-code.component';
import { ReasonCodeDetailsComponent } from './configs/data-management/reason-code/reason-code-details/reason-code-details.component';
import { SortHelperPipe } from '../shared/pipe/sort-helper.pipe';
import { NotificationLogComponent } from './configs/notifications/notification-log/notification-log.component';
import { EmailViewerComponent } from './configs/notifications/notification-log/email-viewer/email-viewer.component';
import { RuleConfigurationListComponent } from './configs/configuration/rule-configuration/rule-configuration-list/rule-configuration-list.component';
import { CreateNewRuleConfigComponent } from './configs/configuration/rule-configuration/create-new-rule-config/create-new-rule-config.component';
import { ViewJobTemplateComponent } from './configs/job/job-template/view-job-template/view-job-template.component';
import { AddRuleComponent } from './configs/configuration/rule-configuration/add-rule/add-rule.component';
import { LogsModule } from '../library/logs/logs.module';
import { CreateNewWorkLocationComponent } from './configs/program/work-location/create-new-work-location/create-new-work-location.component';
import { ViewWorkLocationComponent } from './configs/program/work-location/view-work-location/view-work-location.component';
import { ListViewModule } from '../library/list-view/list-view.module';
import { CreateVendorGroupComponent } from './configs/vendor-management/vendor-groups/create-vendor-group/create-vendor-group.component';
import { ViewVendorGroupComponent } from './configs/vendor-management/vendor-groups/view-vendor-group/view-vendor-group.component';
import { TasksDetailComponent } from './configs/onboarding/tasks/tasks-detail/tasks-detail.component';
import { VendorComplianceDocumentGroupsCreateComponent } from './configs/vendor-management/vendor-compliance-document-groups-create/vendor-compliance-document-groups-create.component';
import { VendorComplianceDocumentGroupsViewComponent } from './configs/vendor-management/vendor-compliance-document-groups-view/vendor-compliance-document-groups-view.component';
import { I18NextModule } from 'angular-i18next';
import { ImpactedAssignmentDetailsComponent } from './configs/configuration/timesheet-configuration/impacted-assignment-details/impacted-assignment-details.component';
import { InfiniteScrollModule } from "ngx-infinite-scroll";
import { VmsTableModule } from '../library/smartTable/vms-table.module';
import { ViewMasterDataItemComponent } from './configs/program/master-data-items/view-master-data-item/view-master-data-item.component';
import { MasterDataItemDetailComponent } from './configs/program/master-data-items/master-data-item-detail/master-data-item-detail.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NotificationReminderThresholdComponent } from './configs/notifications/notification-reminder-threshold/notification-reminder-threshold.component';
import { ViewMasterDataComponent } from './configs/program/master-data-types/view-master-data/view-master-data.component';
import { MasterDataDetailsComponent } from './configs/program/master-data-types/master-data-details/master-data-details.component';
import { TogglePanelComponent } from './configs/program/master-data-types/master-data-details/toggle-panel/toggle-panel.component';
import { SelfConfigLogComponent } from './components/self-config-log/self-config-log.component';
import { LaborCategoryComponent } from './configs/data-management/labor-category/labor-category.component';
import { SupportTextListComponent } from './configs/program/supporting-text/support-text-list/support-text-list.component';
import { SupportTextViewComponent } from './configs/program/supporting-text/support-text-view/support-text-view.component';
import { TimeSheetAndExpenseComponent } from './configs/configuration/program-config/time-sheet-and-expense/time-sheet-and-expense.component';
import { VendorInvitesComponent } from './configs/vendor-management/vendor-invites/vendor-invites.component';
import { VendorInvitesCreateComponent } from './configs/vendor-management/vendor-invites/vendor-invites-create/vendor-invites-create.component';
import { VendorInvitesViewComponent } from './configs/vendor-management/vendor-invites/vendor-invites-view/vendor-invites-view.component';
import { CreateLaborCategoryComponent } from './configs/data-management/create-labor-category/create-labor-category.component';
import { ViewLaborCategoryComponent } from './configs/data-management/view-labor-category/view-labor-category.component';
import { ViewRuleConfigurationComponent } from './configs/configuration/rule-configuration/view-rule-configuration/view-rule-configuration.component';
import { ResumeUploadModule } from '../library/svms-resume-uploader/resume-upload.module';
import { ReassignItemsComponent } from './configs/shared/components/reassign-items/reassign-items.component';
import { UploadUtilityComponent } from './configs/data-management/upload-utility/upload-utility.component';
import { SelfConfigurationComponentModule } from './components/self-configuration-component.module';
import { CostComponentGroupModule } from './configs/rate/cost-component-group/cost-component-group.module';
import { PasswordPolicyComponent } from './configs/user/password-policy/password-policy.component';
import { ReorderModalComponent } from './configs/rate/rate-factors/components/reorder-modal/reorder-modal.component';
import { DndModule } from "ngx-drag-drop";
import { RateFactorsDetailComponent } from './configs/rate/rate-factors/rate-factors-detail/rate-factors-detail/rate-factors-detail.component';
import { CredentialingComponent } from './configs/configuration/credentialing/credentialing.component';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};

@NgModule({
  declarations: [
    SelfConfigurationComponent,
    ProgramDetailsComponent,
    SelfConfigSidebarComponent,
    SelfConfigHeaderComponent,
    ProgramConfigComponent,
    LoadCompDirective,
    JobProgramConfigComponent,
    BaseProgramConfigComponent,
    ProgramConfigControlComponent,
    NotificationProgramConfigComponent,
    SubmissionProgramConfigComponent,
    CandidateProgramConfigComponent,
    OfferProgramConfigComponent,
    FeaturesConfigComponent,
    InterviewConfigComponent,
    PlatformProgramConfigComponent,
    CreateJobTemplatesComponent,
    JobTemplateListComponent,
    MasterDataTypesComponent,
    RateCardsComponent,
    ChecklistsComponent,
    VendorDistributionSchedulesComponent,
    FlowsListComponent,
    FlowDetailedListingComponent,
    QualificationsComponent,
    WorkLocationListComponent,
    ComplianceRestrictionRulesComponent,
    RateFactorsListingComponent,
    VendorInvitesComponent,
    VendorInvitesCreateComponent,
    VendorInvitesViewComponent,
    VendorComplianceDocumentsComponent,
    VendorComplianceDocumentsViewComponent,
    VendorComplianceDocumentsCreateComponent,
    QualificationItemsComponent,
    VendorsListingComponent,
    VendorGroupsListingComponent,
    MasterDataItemsComponent,
    VendorComplianceDocumentsComponent,
    TasksListingComponent,
    UserListComponent,
    VendorComplianceDocumentGroupsComponent,
    VendorComplianceListComponent,
    HierarchyConfigurationListingComponent,
    UserRoleListingComponent,
    PicklistsComponent,
    TimesheetConfigurationListsComponent,
    CreateNewComponent,
    BreakRuleComponent,
    CreateHierarchyComponent,
    ViewHierarchyComponent,
    ReasonCodeComponent,
    EditReasonCodeComponent,
    ReasonCodeDetailsComponent,
    NotificationLogComponent,
    EmailViewerComponent,
    RuleConfigurationListComponent,
    CreateNewRuleConfigComponent,
    ViewJobTemplateComponent,
    AddRuleComponent,
    CreateVendorGroupComponent,
    ViewVendorGroupComponent,
    TasksDetailComponent,
    VendorComplianceDocumentGroupsCreateComponent,
    VendorComplianceDocumentGroupsViewComponent,
    AddRuleComponent,
    CreateNewWorkLocationComponent,
    ViewWorkLocationComponent,
    ImpactedAssignmentDetailsComponent,
    ViewMasterDataItemComponent,
    MasterDataItemDetailComponent,
    // SelectorModalComponent,
    NotificationReminderThresholdComponent,
    ViewMasterDataComponent,
    MasterDataDetailsComponent,
    TogglePanelComponent,
    SelfConfigLogComponent,
    TimeSheetAndExpenseComponent,
    LaborCategoryComponent,
    TimeSheetAndExpenseComponent,
    CreateLaborCategoryComponent,
    ViewLaborCategoryComponent,
    SupportTextListComponent,
    SupportTextViewComponent,
    ViewRuleConfigurationComponent,
    ReassignItemsComponent,
    UploadUtilityComponent,
    PasswordPolicyComponent,
    CredentialingComponent,
    ReorderModalComponent,
    RateFactorsDetailComponent
  ],
  imports: [
    InfiniteScrollModule,
    CommonModule,
    SelfConfigurationRoutingModule,
    PerfectScrollbarModule,
    SharedModule,
    NgSelectModule,
    ProgramSetupModule,
    FormsModule,
    ReactiveFormsModule,
    QuillModule,
    NewSharedModule,
    HierarchyModule,
    RateCardModule,
    RateFactorModule,
    CostComponentModule,
    CostComponentGroupModule,
    SvmsTableModule,
    OnboardingConfigurationModule,
    VendorModule,
    FlowsManagementModule,
    RulesManagementModule,
    HierarchyConfigurationModule,
    QualificationsModule,
    VendorManagmentModule,
    CustomFieldsModule,
    UserManagementModule,
    ManageUsersModule,
    PicklistModule,
    LogsModule,
    ProgramSetupModule,
    ListViewModule,
    I18NextModule,
    VmsTableModule,
    NgxSkeletonLoaderModule,
    ResumeUploadModule,
    CFModule,
    SelfConfigurationComponentModule,
    DndModule,
  ], exports: [
    ProgramDetailsComponent,
  ],
  providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    },
    SortHelperPipe
  ],
})
export class SelfConfigurationModule { }
