import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { SubmittedCandidateComponent } from './submitted-candidate.component';
import { SubmittedDetailsComponent } from './components/submitted-details/submitted-details.component';
import { InterviewsComponent } from './components/interviews/interviews.component';
import { OffersComponent } from './components/offers/offers.component';
import { AssignmentsComponent } from './components/assignments/assignments.component';
import { ApprovalComponent } from './components/approval/approval.component';
import { HistoryComponent } from './components/history/history.component';
import { SubmittedCandidateRoutingModule } from './submitted-candidate-route.module';
import { SubmittedCandidateSidebarComponent } from 'src/app/jobs/submitted-candidate/components/submitted-candidate-sidebar/submitted-candidate-sidebar.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { JobDetailsModule } from '../job-details/job-details.module';
import { ScheduleInterviewComponent } from './components/schedule-interview/schedule-interview.component';
import { OfferDetailPanelComponent } from './components/offer-detail-panel/offer-detail-panel.component';
import { VmsTableModule } from '../../library/table/vms-table.module';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { I18NextModule } from 'angular-i18next';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
  suppressScrollY: false
};

@NgModule({
  declarations: [SubmittedCandidateComponent, SubmittedDetailsComponent, InterviewsComponent, OffersComponent, AssignmentsComponent, ApprovalComponent, HistoryComponent, SubmittedCandidateSidebarComponent, ScheduleInterviewComponent, OfferDetailPanelComponent],
  imports: [
    CommonModule,
    SubmittedCandidateRoutingModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    JobDetailsModule,
    VmsTableModule,
    PerfectScrollbarModule,
    NewSharedModule,
    I18NextModule,
  ],
  providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    }
  ]
})
export class SubmittedCandidateModule { }
