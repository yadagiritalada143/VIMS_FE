import { CommonModule, CurrencyPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { QuillModule } from 'ngx-quill';
import { SvmsHierarchyModule } from 'src/app/library/hierarchy/hierarchy.module';
import { VmsTableModule } from '../library/smartTable/vms-table.module';
import { SharedModule } from '../shared/shared.module';
import { BasicJobInfoComponent } from './component/basic-job-info/basic-job-info.component';
import { JobDetailsComponent } from './component/job-details/job-details.component';
import { JobQualificationsComponent } from './component/job-qualifications/job-qualifications.component';
import { JobsSummaryComponent } from './component/jobs-summary/jobs-summary.component';
import { MarketRateComponent } from './component/market-rate/market-rate.component';
import { SimplifyAssistComponent } from './component/simplify-assist/simplify-assist.component';
import { CreateJobComponent } from './create-job/create-job.component';
import { JobDetailsModule } from './job-details/job-details.module';
import { JobsService } from './jobs.service';
import { JobListComponent } from './job-list/job-list.component';
import { SubmittedCandidatesComponent } from './submitted-candidates/submitted-candidates.component';
import { OffersComponent } from './offers/offers.component';
import { InterviewsComponent } from './interviews/interviews.component';
import { JobsRoutingModule } from './jobs-routing.module';
import { JobsComponent } from './jobs.component';
import { JobDistributionComponent } from './component/job-distribution/job-distribution.component';
import { JobEstimateComponent } from './component/job-estimate/job-estimate.component';
import { PerfectScrollbarModule, PERFECT_SCROLLBAR_CONFIG, PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { CreateJobChartModule } from 'src/app/jobs/create-job-chart/create-job-chart.module';
import { OptedOutJobComponent } from './opted-out-job/opted-out-job.component';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { CustomFieldsModule } from '../library/custom-fields/custom-fields.module';
import { FoundationalFieldsModule } from '../library/foundational-fields/foundational-fields.module';
import { CandidatesModule } from '../candidates/candidates.module';
import { LogsModule } from '../library/logs/logs.module';
import { ResumeUploadModule } from '../library/svms-resume-uploader/resume-upload.module';
import { SvmsSidebarNgModule } from '../library/svms-sidebar-ng/svms-sidebar-ng.module';
import { I18NextModule } from 'angular-i18next';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

// @NgModule({
//   declarations: [JobsComponent, CreateJobComponent, SimplifyAssistComponent, MarketRateComponent, BasicJobInfoComponent, JobQualificationsComponent, JobDetailsComponent, JobDistributionComponent, JobsSummaryComponent, CreateCandidateComponent, JobListComponent, JobEstimateComponent],

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
};

@NgModule({
  declarations: [
    JobsComponent,
    CreateJobComponent,
    SimplifyAssistComponent,
    MarketRateComponent,
    BasicJobInfoComponent,
    JobQualificationsComponent,
    JobDetailsComponent,
    JobDistributionComponent,
    JobsSummaryComponent,
    JobListComponent,
    SubmittedCandidatesComponent,
    OffersComponent,
    InterviewsComponent,
    JobEstimateComponent,
    OptedOutJobComponent,
  ],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    JobsRoutingModule,
    JobDetailsModule,
    SharedModule,
    NgSelectModule,
    VmsTableModule,
    FormsModule,
    ReactiveFormsModule,
    SvmsHierarchyModule,
    QuillModule.forRoot(),
    SvmsHierarchyModule,
    PerfectScrollbarModule,
    CreateJobChartModule,
    NewSharedModule,
    CandidatesModule,
    CustomFieldsModule,
    FoundationalFieldsModule,
    LogsModule,
    ResumeUploadModule,
    SvmsSidebarNgModule,
    I18NextModule,
    NgxSkeletonLoaderModule
  ],
  providers: [
    JobsService,
    NgbActiveModal,
    CurrencyPipe,
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
    },
  ],
})
export class JobsModule {}
