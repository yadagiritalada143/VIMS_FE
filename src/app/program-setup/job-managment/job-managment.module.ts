import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { JobManagmentRoutingModule } from './job-managment-routing.module';
import { JobManagmentComponent } from './job-managment.component';
import { CreateJobTemplateComponent } from './create-job-template/create-job-template.component';
import { ViewJobTemplateComponent } from './view-job-template/view-job-template.component';
import { HierarchyComponent } from './component/hierarchy/hierarchy.component';
import { QualificationComponent } from './component/qualification/qualification.component';
import { DistributionComponent } from './component/distribution/distribution.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { VmsTableModule } from 'src/app/library/table/vms-table.module';
import { SvmsHierarchyModule } from 'src/app/library/hierarchy/hierarchy.module';
import { BasicJobTemplateComponent } from './component/basic-job-template/basic-job-template.component';
import { QuillModule } from 'ngx-quill';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { OthersComponent } from './component/others/others.component';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [JobManagmentComponent, CreateJobTemplateComponent, ViewJobTemplateComponent, HierarchyComponent, QualificationComponent, DistributionComponent, BasicJobTemplateComponent, OthersComponent],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    JobManagmentRoutingModule,
    SharedModule,
    NgSelectModule,
    VmsTableModule,
    SvmsHierarchyModule,
    QuillModule.forRoot(),
    NewSharedModule,
    I18NextModule,
  ],
  providers: [SortHelperPipe]
})
export class JobManagmentModule { }
