import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InterviewsComponent } from './components/interviews/interviews.component';
import { JobDetailComponent } from './components/job-details/job-details.component';
import { OffersComponent } from './components/offers/offers.component';
import { SubmittedCandidatesComponent } from './components/submitted-candidates/submitted-candidates.component';
import { JobDetailsComponent } from './job-details.component';
import { ApprovalComponent } from './components/approval/approval.component';
import { DistributionComponent } from './components/distribution/distribution.component';
import { AvailableCandidatesComponent } from './components/available-candidates/available-candidates.component';
import { OnboardingComponent } from './components/onboarding/onboarding.component';
import {  CandidateJobOnboardingComponent } from './components/candidate-job-view/components/candidate-job-onboarding/candidate-job-onboarding.component';
import { HistoryComponent } from './components/history/history.component';
import { AssignmentComponent } from './components/assignment/assignment.component';
import { CandidateJobViewComponent } from './components/candidate-job-view/candidate-job-view.component';
import { CandidateJobProfileComponent } from './components/candidate-job-view/components/candidate-job-profile/candidate-job-profile.component';
import { CandidateJobSubmissionsViewComponent } from './components/candidate-job-view/components/candidate-job-submissions-view/candidate-job-submissions-view.component';
import { CandidateJobViewInterviewsComponent } from './components/candidate-job-view/components/candidate-job-view-interviews/candidate-job-view-interviews.component';
import { CandidateJobViewOffersComponent } from './components/candidate-job-view/components/candidate-job-view-offers/candidate-job-view-offers.component';
import { CandidateJobViewInterviewDetailsComponent } from './components/candidate-job-view/components/candidate-job-view-interviews/details/candidate-job-view-interview-details.component';
import { CandidateJobViewInterviewListComponent } from './components/candidate-job-view/components/candidate-job-view-interviews/list/candidate-job-view-interview-list.component';
import { CandidateJobViewInterviewCreateComponent } from './components/candidate-job-view/components/candidate-job-view-interviews/create/candidate-job-view-interview-create.component';
import {CandidateJobCredentialingComponent } from './components/candidate-job-view/components/candidate-job-credentialing/candidate-job-credentialing.component';
import { CandidateResumeViewComponent } from './components/candidate-job-view/components/candidate-resume-view/candidate-resume-view.component';
import { CandidateJobHistoryComponent } from './components/candidate-job-view/components/candidate-job-history/candidate-job-history.component';
import { JobWorkflowComponent } from './job-workflow/job-workflow.component';
import { JobDataResolver } from '../job-data.resolver';
import { CandidateJobCredentialsComponent } from './components/candidate-job-view/components/candidate-job-credentials/candidate-job-credentials.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';
const routes: Routes = [
  {
    path: 'job-details/:id',
    component: JobDetailsComponent,
    resolve: {
      jobResolvedData: JobDataResolver
    },
    children: [
      {
        path: '',
        component: JobDetailComponent,
        pathMatch: 'full',
      },
      {
        path: 'assignment',
        component: AssignmentComponent,
      },
      {
        path: 'available',
        component: AvailableCandidatesComponent,
      },
      {
        path: 'submitted-candidate',
        component: SubmittedCandidatesComponent,
      },
      {
        path: 'offers',
        component: OffersComponent,
      },
      {
        path: 'interviews',
        component: InterviewsComponent,
      },
      {
        path: 'approval',
        component: ApprovalComponent,
      },
      {
        path: 'workflow',
        component: JobWorkflowComponent,
      },
      {
        path: 'distribution',
        component: DistributionComponent,
      },
      {
        path: 'onboarding',
        component: OnboardingComponent,
      },
      {
        path: 'history',
        component: HistoryComponent,
      }
    ]
  },
  {
    path: 'job-details/:id/candidate/:candidateId',
    component: CandidateJobViewComponent,
    children: [
      { path: 'profile', component: CandidateJobProfileComponent },
      { path: 'resume', component: CandidateResumeViewComponent },
      { path: 'credentialing', component: CandidateJobCredentialingComponent },
      { path: 'credentials', component: CandidateJobCredentialsComponent, canActivateChild: [AuthguardService], data: { userRoles: ['view_credentialing'], },},
      { path: 'submissions', component: CandidateJobSubmissionsViewComponent },
      { path: 'interviews',
        component: CandidateJobViewInterviewsComponent,
        children : [
          { path: 'details', component: CandidateJobViewInterviewDetailsComponent },
          { path: '', component: CandidateJobViewInterviewListComponent },
          { path: 'create', component: CandidateJobViewInterviewCreateComponent },
          { path: 're-schedule/:interviewId', component: CandidateJobViewInterviewCreateComponent, data: { isReSchedule: true } },
          { path: 'edit/:interviewId', component: CandidateJobViewInterviewCreateComponent, data: { isEditInterview: true } },
          { path: 'list', component: CandidateJobViewInterviewListComponent },
        ]
      },
      { path: 'offers', component: CandidateJobViewOffersComponent },
      { path: 'onboarding', component: CandidateJobOnboardingComponent },
      { path: '', component: CandidateJobProfileComponent },
      { path: 'history', component: CandidateJobHistoryComponent }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class JobDetailsRoutingModule {}
