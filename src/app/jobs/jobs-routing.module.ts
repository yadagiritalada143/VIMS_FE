import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateJobComponent } from './create-job/create-job.component';
import { JobListComponent } from './job-list/job-list.component';
import { SubmittedCandidatesComponent } from './submitted-candidates/submitted-candidates.component';
import { OffersComponent } from './offers/offers.component';
import { InterviewsComponent } from './interviews/interviews.component';
import { JobsComponent } from './jobs.component';
import { OptedOutJobComponent } from './opted-out-job/opted-out-job.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';
import { ListViewComponent } from '../library/list-view/list-view.component';
import { JobDataResolver } from './job-data.resolver';

const routes: Routes = [
  { path: '', redirectTo: '', pathMatch: 'full' },
  {
    path: '',
    component: JobsComponent,
    children: [
      {
        path: 'create',
        component: CreateJobComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['create_job'],
        },
      },
      {
        path: 'create/:id/:template_id/:name',
        component: CreateJobComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['create_job'],
        },
        resolve: {
          jobResolvedData: JobDataResolver
        },
      },
      {
        path: 'details',
        loadChildren: () => import('./job-details/job-details.module').then(m => m.JobDetailsModule),
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_job'],
        },
      },
      {
        path: 'list',
        component: JobListComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_job'],
        },
      },
      {
        path: 'list/:status',
        component: JobListComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_job'],
        },
      },
      {
        path: 'genericlist/:module/:entity',
        component: ListViewComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_job'],
        },
      },
      {
        path: 'optout-list',
        component: OptedOutJobComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['hide_opted_out_jobs'],
        },
      },
      {
        path: 'submissions',
        component: SubmittedCandidatesComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_job'],
        },
      },
      {
        path: 'submissions/:status',
        component: SubmittedCandidatesComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_job'],
        },
      },
      {
        path: 'offers',
        component: OffersComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_job'],
        },
      },
      {
        path: 'offers/:status',
        component: OffersComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_job'],
        },
      },
      {
        path: 'interviews',
        component: InterviewsComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_job'],
        },
      },
      {
        path: 'interviews/:status',
        component: InterviewsComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_job'],
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class JobsRoutingModule {}
