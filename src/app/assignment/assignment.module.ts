import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';

import { AssignmentRoutingModule } from './assignment-routing.module';
import { SvmsPieChartModule } from 'src/app/library/charts/svms-pie-chart/svms-pie-chart.module';
import { SvmsColumnChartModule } from 'src/app/library/charts/svms-column-chart/svms-column-chart.module';

import { AssignmentComponent } from '../assignment/assignment.component';
import { AssignmentListComponent } from './assignment-list/assignment-list.component';
import { CreateAssignmentComponent } from './create-assignment/create-assignment.component';
import { VmsTableModule } from '../library/smartTable/vms-table.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CreateCandidateComponent } from './create-candidate/create-candidate.component';
import { FormRendererModule } from '../library/form-renderer/form-renderer.module';
import { AssignmentService } from './assignment.service';
import { AssignmentViewComponent } from './assignment-view/assignment-view.component';
import { CandidateSidebarComponent } from './component/candidate-sidebar/candidate-sidebar.component';
import { AssignmentDetailsViewComponent } from './component/assignment-details-view/assignment-details-view.component';
import { BudgetComponent } from './component/budget/budget.component';
import { HistoryComponent } from './component/history/history.component';
import { AddAdditionalBudgetComponent } from './add-additional-budget/add-additional-budget.component';
import { TerminateAssignmentComponent } from './component/terminate-assignment/terminate-assignment.component';
import { EvaluationComponent } from './component/evaluation/evaluation.component';
import { DatePipe } from '@angular/common';
import { AllAssignmentsComponent } from './all-assignments/all-assignments.component';
import { OnboardingComponent } from './component/onboarding/onboarding.component';
import { TaskDetailsComponent } from './component/task-details/task-details.component';
import { AssignmentHistoryComponent } from './component/assignment-history/assignment-history.component';
import { ViewProfileComponent } from './component/view-profile/view-profile.component';
import { AssignmentDetailsSidebarViewComponent } from './assignment-details-sidebar-view/assignment-details-sidebar-view.component';
import { CandidateProfileComponent } from './components/candidate-profile/candidate-profile.component';
import { AssignmentDetailsComponent } from './components/assignment-details/assignment-details.component';
import { SvmsSidebarNgModule } from '../library/svms-sidebar-ng/svms-sidebar-ng.module';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { MassUpdateAssignmentComponent } from './component/mass-update-assignment/mass-update-assignment.component';
import { SummaryPageInfoComponent } from './component/summary-page-info/summary-page-info.component';
import { TimesheetAwaitingApprovalComponent } from './component/timesheet-awaiting-approval/timesheet-awaiting-approval.component';
import { ExpenseAwaitingApprovalComponent } from './component/expense-awaiting-approval/expense-awaiting-approval.component';
import { AssignmentDetailsSidepanelComponent } from './component/assignment-details-sidepanel/assignment-details-sidepanel.component';
import { MassAssignmentComponent } from './mass-assignment/mass-assignment.component';
import { SpecialTemporaryAccessComponent } from './component/special-temporary-access/special-temporary-access.component';
import { TimesheetService } from '../wipro-timesheet/timesheet.service';
import { ListOfApproversComponent } from './component/list-of-approvers/list-of-approvers.component';
import { AssignmentApprovalComponent } from './component/assignment-approval/assignment-approval.component';
import { RejectionSidebarComponent } from './component/rejection-sidebar/rejection-sidebar.component';
import { AssignmentDetailViewSidepanelComponent } from './component/assignment-detail-view-sidepanel/assignment-detail-view-sidepanel.component';
import { AssignmentDateUpdateComponent } from './component/assignment-date-update/assignment-date-update.component';
import { AssignmentCreateComponent } from './assignment-create/assignment-create.component';
import { FoundationalFieldsModule } from '../library/foundational-fields/foundational-fields.module';
import { CustomFieldsModule } from '../library/custom-fields/custom-fields.module';
import { SvmsHierarchyModule } from '../library/hierarchy/hierarchy.module';
import { } from '../library/form-renderer/impacted-timesheet/impacted-timesheet-table/impacted-timesheet-table.component';
import { ActivityBasedPricingComponent } from './activity-based-pricing/activity-based-pricing.component';
import { CreateQuickAssignmentComponent } from './create-quick-assignment/create-quick-assignment.component';
import { ViewAssignmentHistoryFlyoutComponent } from './component/view-assignment-history-flyout/view-assignment-history-flyout.component';
import { RateFactorDetailsComponent } from './component/rate-factor-details/rate-factor-details.component';
import { LogsModule } from '../library/logs/logs.module';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { PendingReviewOnboardingFlyoutComponent } from './component/pending-review-onboarding-flyout/pending-review-onboarding-flyout.component';
import { I18NextModule } from 'angular-i18next';
import { MassAssignmentFieldsComponent } from './mass-assignment/mass-assignment-fields/mass-assignment-fields.component';
import { MultiApprovalsModule } from '../multi-approvals/multi-approvals.module';
import { JobDetailsModule } from '../jobs/job-details/job-details.module';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollY: true
};

@NgModule({
  declarations: [AssignmentComponent, AssignmentListComponent, CreateAssignmentComponent, CreateCandidateComponent, AssignmentViewComponent, CandidateSidebarComponent, AssignmentDetailsViewComponent, BudgetComponent, HistoryComponent, AddAdditionalBudgetComponent, TerminateAssignmentComponent, EvaluationComponent, AllAssignmentsComponent, OnboardingComponent, TaskDetailsComponent, AssignmentHistoryComponent, ViewProfileComponent, AssignmentDetailsSidebarViewComponent, CandidateProfileComponent, AssignmentDetailsComponent, MassUpdateAssignmentComponent, SummaryPageInfoComponent, TimesheetAwaitingApprovalComponent, ExpenseAwaitingApprovalComponent, AssignmentDetailsSidepanelComponent, MassAssignmentComponent, SpecialTemporaryAccessComponent, ListOfApproversComponent, AssignmentApprovalComponent, RejectionSidebarComponent, AssignmentDetailViewSidepanelComponent, AssignmentDateUpdateComponent, AssignmentCreateComponent, ActivityBasedPricingComponent, CreateQuickAssignmentComponent,ViewAssignmentHistoryFlyoutComponent, RateFactorDetailsComponent, PendingReviewOnboardingFlyoutComponent, MassAssignmentFieldsComponent],
  imports: [
    CommonModule,
    AssignmentRoutingModule,
    SharedModule,
    VmsTableModule,
    NgSelectModule,
    SvmsSidebarNgModule,
    FormsModule,
    ReactiveFormsModule,
    FormRendererModule,
    NewSharedModule,
    SvmsPieChartModule,
    SvmsColumnChartModule,
    FoundationalFieldsModule,
    CustomFieldsModule,
    SvmsHierarchyModule,
    LogsModule,
    PerfectScrollbarModule,
    MultiApprovalsModule,
    I18NextModule,
    JobDetailsModule
  ],
  providers: [AssignmentService, TimesheetService, DatePipe,
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    }]
})
export class AssignmentModule { }
