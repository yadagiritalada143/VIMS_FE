import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CandidatesRoutingModule } from './candidates-routing.module';
import { CandidatesComponent } from './candidates.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CandidateListComponent } from './candidate-list/candidate-list.component';
import { CreateCandidateComponent } from './create-candidate/create-candidate.component';
import { VmsTableModule } from '../library/smartTable/vms-table.module';
import { SharedModule } from '../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddCertificationComponent } from './component/add-certification/add-certification.component';
import { AddCredentialsComponent } from './component/add-credentials/add-credentials.component';
import { AddSpecializationComponent } from './component/add-specialization/add-specialization.component';
import { AddVaccinationComponent } from './component/add-vaccination/add-vaccination.component';
import { AddSkillsComponent } from './component/add-skills/add-skills.component';
import { AddEducationComponent } from './component/add-education/add-education.component';
import { SvmsSidebarNgModule } from '../library/svms-sidebar-ng/svms-sidebar-ng.module';
import { SvmsUploadAvatarModule } from './../library/svms-upload-user-avatar/svms-upload-avatar.module';
import { EditAvailabilityComponent } from './component/edit-availability/edit-availability.component';
import { SubmitCandidateComponent } from './submit-candidate/submit-candidate.component';
import { CreateQualificationComponent } from './create-qualification/create-qualification.component';
import { TimePanelComponent } from './component/time-panel/time-panel.component';
import { JobDetailsModule } from '../jobs/job-details/job-details.module';
import { JobAssignmentsComponent } from './job-assignments/job-assignments.component';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { FoundationalFieldsModule } from '../library/foundational-fields/foundational-fields.module';
import { CustomFieldsModule } from '../library/custom-fields/custom-fields.module';
import { LogsModule } from '../library/logs/logs.module';
import { ResumeUploadModule } from '../library/svms-resume-uploader/resume-upload.module';
import { UniqueKeyPipe } from '../shared/pipe/unique-key.pipe';
import { I18NextModule } from 'angular-i18next';
import { SortHelperPipe } from '../shared/pipe/sort-helper.pipe';

@NgModule({
  declarations: [
    CandidatesComponent,
    CandidateListComponent,
    CreateCandidateComponent,
    AddCertificationComponent,
    AddCredentialsComponent,
    AddSpecializationComponent,
    AddVaccinationComponent,
    AddSkillsComponent,
    AddEducationComponent,
    EditAvailabilityComponent,
    SubmitCandidateComponent,
    CreateQualificationComponent,
    TimePanelComponent,
    JobAssignmentsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    CandidatesRoutingModule,
    VmsTableModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    SvmsUploadAvatarModule,
    SvmsSidebarNgModule,
    NgxSkeletonLoaderModule,
    JobDetailsModule,
    NewSharedModule,
    FoundationalFieldsModule,
    CustomFieldsModule,
    LogsModule,
    ResumeUploadModule,
    I18NextModule,
  ],
  providers: [DatePipe,UniqueKeyPipe, SortHelperPipe],
})
export class CandidatesModule {}
