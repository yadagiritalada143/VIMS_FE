import { CommonModule, DatePipe, LowerCasePipe, TitleCasePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Ng5SliderModule } from 'ng5-slider';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { VmsTableModule } from '../../library/smartTable/vms-table.module';
import { CountDownTimerModule } from '../../library/count-down-timer/count-down-timer.module';
import { SharedModule } from '../../shared/shared.module';
import { AddTaskComponent } from './components/add-task/add-task.component';
import { ApprovalComponent } from './components/approval/approval.component';
import { AssignmentComponent } from './components/assignment/assignment.component';
import { AvailableCandidatesComponent } from './components/available-candidates/available-candidates.component';
import { DistributionSidebarComponent } from './components/distribution-sidebar/distribution-sidebar.component';
import { DistributionComponent } from './components/distribution/distribution.component';
import { EditTaskComponent } from './components/edit-task/edit-task.component';
import { GridFilterComponent } from './components/grid-view/grid-filter/grid-filter.component';
import { GridViewComponent } from './components/grid-view/grid-view.component';
import { HistoryComponent } from './components/history/history.component';
import { InterviewDetailsComponent } from './components/interview-details/interview-details.component';
import { InterviewsComponent } from './components/interviews/interviews.component';
import { JobDetailSidebarComponent } from './components/job-detail-sidebar/job-detail-sidebar.component';
import { JobDetailComponent } from './components/job-details/job-details.component';
import { OffersComponent } from './components/offers/offers.component';
import { OnboardingComponent } from './components/onboarding/onboarding.component';
import {  CandidateJobOnboardingComponent } from './components/candidate-job-view/components/candidate-job-onboarding/candidate-job-onboarding.component';

import { PendingApprovalRequestComponent } from './components/pending-approval-request/pending-approval-request.component';
import { SubmittedCandidatesComponent } from './components/submitted-candidates/submitted-candidates.component';
import { ViewProfileComponent } from './components/view-profile/view-profile.component';
import { ViewSubmittedCandidateComponent } from './components/view-submitted-candidate/view-submitted-candidate.component';
import { WithdrawCandidateComponent } from './components/withdraw-candidate/withdraw-candidate.component';
import { JobDetailsRoutingModule } from './job-details-routing.module';
import { JobDetailsComponent } from './job-details.component';
import { JobDetailsSidebarViewComponent } from './job-details-sidebar-view/job-details-sidebar-view.component';
import { JobDetailsSidebarCreateComponent } from './job-details-sidebar-create/job-details-sidebar-create.component';
import { SvmsSidebarNgModule } from '../../library/svms-sidebar-ng/svms-sidebar-ng.module';
import { InterviewDetailsSidebarComponent } from './components/interview-details-sidebar/interview-details-sidebar.component';
import { GroupNameComponent } from './components/group-name/group-name.component';
import { DistributionReleaseComponent } from './components/distribution-release/distribution-release.component';
import { UpdateReleaseComponent } from './components/update-release/update-release.component';
import { OfferDetailsComponent } from './components/offer-details/offer-details.component';
import { AssignmentDetailsSidebarComponent } from './components/assignment-details-sidebar/assignment-details-sidebar.component';
import { ScheduleInterviewComponent } from './components/schedule-interview/schedule-interview.component';
import { CreateOffersComponent } from './components/create-offers/create-offers.component';
import { CandidateProfileSidebarComponent } from './components/candidate-profile-sidebar/candidate-profile-sidebar.component';
import { ApprovalNotesHistoryComponent } from './components/approval-notes-history/approval-notes-history.component';
import { ApprovalRequestComponent } from './components/approval-request/approval-request.component';
import { ApprovalNotesComponent } from './components/approval-notes/approval-notes.component';
import { OptOutReasonComponent } from './components/opt-out-reason/opt-out-reason.component';
import { CounterOfferComponent } from './components/counter-offer/counter-offer.component';
import { JobDetailsSidebarCounterOfferComponent } from './job-details-sidebar-counter-offer/job-details-sidebar-counter-offer.component';
import { FormatTimePipe, InterviewTimerComponent } from './components/interviews/interview-timer/interview-timer.component';
import { SubmissionDetailsComponent } from './components/submission-details/submission-details.component';
import { CandidateJobViewContentComponent } from './components/candidate-job-view/candidate-job-view-content/candidate-job-view-content.component';
import { CandidateJobViewRightPanelComponent } from './components/candidate-job-view/candidate-job-view-right-panel/candidate-job-view-right-panel.component';
import { CandidateJobViewComponent } from './components/candidate-job-view/candidate-job-view.component';
import { CandidateJobSubmissionsViewComponent } from './components/candidate-job-view/components/candidate-job-submissions-view/candidate-job-submissions-view.component';
import { CandidateJobViewInterviewsComponent } from './components/candidate-job-view/components/candidate-job-view-interviews/candidate-job-view-interviews.component';
import { CandidateJobViewOffersComponent } from './components/candidate-job-view/components/candidate-job-view-offers/candidate-job-view-offers.component';
import { NotificationCardsComponent } from './components/candidate-job-view/notification-cards/notification-cards.component';
import { CandidateJobViewInterviewDetailsComponent } from './components/candidate-job-view/components/candidate-job-view-interviews/details/candidate-job-view-interview-details.component';
import { CandidateJobViewInterviewListComponent } from './components/candidate-job-view/components/candidate-job-view-interviews/list/candidate-job-view-interview-list.component';
import { CandidateJobViewInterviewCreateComponent } from './components/candidate-job-view/components/candidate-job-view-interviews/create/candidate-job-view-interview-create.component';
import { RejectAndCloseReasonComponent } from './components/reject-and-close-reason/reject-and-close-reason.component';
import { AcceptInterviewSidepanelComponent } from './components/candidate-job-view/components/candidate-job-view-interviews/accept-interview-sidepanel/accept-interview-sidepanel.component';
import { CandidateJobCredentialingComponent } from './components/candidate-job-view/components/candidate-job-credentialing/candidate-job-credentialing.component';
import { CredentialingBackgroundCheckComponent } from './components/candidate-job-view/components/candidate-job-credentialing/credentialing-background-check/credentialing-background-check.component';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { CandidateTaskDetailsComponent } from './components/candidate-job-view/components/candidate-task-details/candidate-task-details.component';
import { CreateBackgroundCheckComponent } from './components/candidate-job-view/components/candidate-job-credentialing/create-background-check/create-background-check.component';
import { FoundationalFieldsModule } from 'src/app/library/foundational-fields/foundational-fields.module';
import { CustomFieldsModule } from 'src/app/library/custom-fields/custom-fields.module';
import { CandidateJobOfferApprovalComponent } from './components/candidate-job-view/components/candidate-job-offer-approval/candidate-job-offer-approval.component';
import { MarkAsComSidePanelComponent } from './components/candidate-job-view/components/mark-as-complete-side-panel/mark-as-complete-side-panel';
import { ApprovalReplaceComponent } from './components/approval-replace/approval-replace.component';
import { ApprovalMemberProfileComponent } from './components/approval-member-profile/approval-member-profile.component';
import { UpdateSubmisionLimitPopupComponent } from './components/update-submision-limit-popup/update-submision-limit-popup.component';
import {ApproveRehireCandidateComponent} from './components/approve-rehire-candidate/approve-rehire-candidate.component';
import { HistoryDetailsComponent } from './components/history-details/history-details.component';
import { CandidateJobSubmissionRehireApprovalComponent } from './components/candidate-job-view/components/candidate-job-submission-rehire-approval/candidate-job-submission-rehire-approval.component';
import { LogsModule } from '../../library/logs/logs.module';

import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { JobBudgetEstimateViewComponent } from './components/job-budget-estimate-view/job-budget-estimate-view.component';
import { CandidateResumeViewComponent } from './components/candidate-job-view/components/candidate-resume-view/candidate-resume-view.component';
import { ResumeDetailsComponent } from './components/resume-details/resume-details.component';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { DateTimePickerComponent } from './components/candidate-job-view/components/candidate-job-view-interviews/create/date-time-picker/date-time-picker.component';
import { CandidateJobHistoryComponent } from './components/candidate-job-view/components/candidate-job-history/candidate-job-history.component';
import { CandidateHistoryViewComponent } from './components/candidate-history-view/candidate-history-view.component';
import { WithdrawStatusCandidatesComponent } from './components/withdraw-status-candidates/withdraw-status-candidates.component';
import { I18NextModule } from 'angular-i18next';
import { OfferEstimateBudgetComponent } from './components/offer-estimate-budget/offer-estimate-budget.component';
import { CandidateComparisonComponent } from './components/candidate-comparison/candidate-comparison.component';
import { CandidateScoreComponent } from './components/candidate-score/candidate-score.component';
import { JobWorkflowComponent } from './job-workflow/job-workflow.component';
import { MultiApprovalsModule } from 'src/app/multi-approvals/multi-approvals.module';
import { ClickOutsideModule } from 'ng-click-outside';
import { EditRateFactorsComponent } from './components/edit-rate-factors/edit-rate-factors.component';
import { PontentialDuplicateCandidateComponent } from './components/pontential-duplicate-candidate/pontential-duplicate-candidate.component';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UpdateInterviewComponent } from './components/candidate-job-view/components/candidate-job-view-interviews/update-interview/update-interview.component';
import { AssignmentOverlapWarningComponent } from './components/assignment-overlap-warning/assignment-overlap-warning.component';
import { CandidateJobCredentialsComponent } from './components/candidate-job-view/components/candidate-job-credentials/candidate-job-credentials.component';
const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollY: true
};

@NgModule({
  declarations: [
    JobDetailsComponent,
    DistributionSidebarComponent,
    DistributionComponent,
    JobDetailComponent,
    AvailableCandidatesComponent,
    SubmittedCandidatesComponent,
    InterviewsComponent,
    OffersComponent,
    AssignmentComponent,
    ApprovalComponent,
    HistoryComponent,
    GridViewComponent,
    ViewProfileComponent,
    WithdrawCandidateComponent,
    GridFilterComponent,
    JobDetailSidebarComponent,
    PendingApprovalRequestComponent,
    InterviewDetailsComponent,
    ViewSubmittedCandidateComponent,
    OnboardingComponent,
    CandidateJobOnboardingComponent,
    AddTaskComponent,
    EditTaskComponent,
    JobDetailsSidebarViewComponent,
    JobDetailsSidebarCreateComponent,
    GroupNameComponent,
    DistributionReleaseComponent,
    UpdateReleaseComponent,
    OfferDetailsComponent,
    ScheduleInterviewComponent,
    InterviewDetailsSidebarComponent,
    CreateOffersComponent,
    AssignmentDetailsSidebarComponent,
    CandidateProfileSidebarComponent,
    ApprovalNotesHistoryComponent,
    ApprovalRequestComponent,
    ApprovalNotesComponent,
    OptOutReasonComponent,
    CounterOfferComponent,
    JobDetailsSidebarCounterOfferComponent,FormatTimePipe, InterviewTimerComponent,
    SubmissionDetailsComponent, CandidateJobViewComponent, CandidateJobViewRightPanelComponent,
    CandidateJobViewContentComponent, CandidateJobSubmissionsViewComponent,
    CandidateJobViewInterviewsComponent, CandidateJobViewOffersComponent,
    CandidateJobViewInterviewDetailsComponent,
    CandidateJobViewInterviewListComponent,
    CandidateJobViewInterviewCreateComponent,
    NotificationCardsComponent,
    RejectAndCloseReasonComponent,
    AcceptInterviewSidepanelComponent,
    CandidateJobCredentialingComponent,
    CredentialingBackgroundCheckComponent,
    CandidateTaskDetailsComponent,
    CreateBackgroundCheckComponent,
    CandidateJobOfferApprovalComponent,
    MarkAsComSidePanelComponent,
    ApprovalReplaceComponent,
    ApprovalMemberProfileComponent,
    UpdateSubmisionLimitPopupComponent,
    ApproveRehireCandidateComponent,
    HistoryDetailsComponent,
    CandidateJobSubmissionRehireApprovalComponent,
    JobBudgetEstimateViewComponent,
    CandidateResumeViewComponent,
    ResumeDetailsComponent,
    DateTimePickerComponent,
    CandidateJobHistoryComponent,
    CandidateHistoryViewComponent,
    WithdrawStatusCandidatesComponent,
    OfferEstimateBudgetComponent,
    CandidateComparisonComponent,
    CandidateScoreComponent,
    JobWorkflowComponent,
    EditRateFactorsComponent,
    PontentialDuplicateCandidateComponent,
    UpdateInterviewComponent,
    CandidateJobCredentialsComponent,
    AssignmentOverlapWarningComponent,
  ],

  imports: [
    CommonModule,
    SvmsSidebarNgModule,
    JobDetailsRoutingModule,
    SharedModule,
    NgSelectModule,
    VmsTableModule,
    FormsModule,
    ReactiveFormsModule,
    Ng5SliderModule,
    NgxSkeletonLoaderModule,
    CountDownTimerModule,
    NewSharedModule,
    FoundationalFieldsModule,
    CustomFieldsModule,
    LogsModule,
    PerfectScrollbarModule,
    NgxDocViewerModule,
    I18NextModule,
    MultiApprovalsModule,
    ClickOutsideModule,
    NgbModule
  ],
  exports: [
    JobDetailSidebarComponent,
    WithdrawCandidateComponent,
    InterviewDetailsComponent,
    SubmittedCandidatesComponent,
    OptOutReasonComponent,
    JobDetailsSidebarViewComponent,MarkAsComSidePanelComponent,
    ScheduleInterviewComponent,
    FormatTimePipe, InterviewTimerComponent, JobDetailsSidebarCreateComponent,
    CandidateJobViewInterviewDetailsComponent, CandidateJobViewInterviewCreateComponent,RejectAndCloseReasonComponent,
    ViewSubmittedCandidateComponent,
    EditRateFactorsComponent,
    AssignmentOverlapWarningComponent
  ],
  providers: [DatePipe, JobDetailsComponent, LowerCasePipe, TitleCasePipe,NgbActiveModal,
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    }
  ]
})
export class JobDetailsModule {}
