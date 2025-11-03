import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CandidatesComponent } from './candidates.component';
import { CandidateListComponent } from './candidate-list/candidate-list.component';
import { CreateCandidateComponent } from './create-candidate/create-candidate.component';
import { SubmitCandidateComponent } from './submit-candidate/submit-candidate.component';
import { CandidateJobViewComponent } from '../jobs/job-details/components/candidate-job-view/candidate-job-view.component';
import { CandidateResumeViewComponent } from '../jobs/job-details/components/candidate-job-view/components/candidate-resume-view/candidate-resume-view.component';
import { CandidateJobCredentialsComponent } from '../jobs/job-details/components/candidate-job-view/components/candidate-job-credentials/candidate-job-credentials.component';
import { CandidateJobProfileComponent } from '../jobs/job-details/components/candidate-job-view/components/candidate-job-profile/candidate-job-profile.component';
import { AuthguardService } from '../core/services/auth_guard.service';

const routes: Routes = [
  {
    path: '',
    component: CandidatesComponent,
    children: [
      {
        path: 'list',
        component: CandidateListComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_candidate'],
        },
      },
      {
        path: 'create',
        component: CreateCandidateComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['create_candidate'],
        },
      },
      {
        path: 'edit/:id',
        component: CreateCandidateComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['create_candidate'],
        },
      },
      {
        path: 'view/:id',
        component: CreateCandidateComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_candidate'],
        },
      },
      {
        path: 'candidate/:candidateId',
        component: CandidateJobViewComponent,
        children: [
          { path: 'profile', component: CandidateJobProfileComponent },
          { path: 'resume', component: CandidateResumeViewComponent },
          { path: 'credentials', component: CandidateJobCredentialsComponent, canActivateChild: [AuthguardService], data: { userRoles: ['view_credentialing'], },},
        ],
        canActivateChild: [AuthguardService], data: { userRoles: ['view_candidate'], },
      },
      {
        path: 'submit-candidate',
        component: SubmitCandidateComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['submit_candidate'],
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CandidatesRoutingModule {}
