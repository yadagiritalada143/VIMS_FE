import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultiApprovalsComponent } from './multi-approvals/multi-approvals.component';
import { SharedModule } from '../shared/shared.module';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { ReplaceApproverComponent } from './components/replace-approver/replace-approver.component';
import { SvmsSidebarNgModule } from '../library/svms-sidebar-ng/svms-sidebar-ng.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { MultiWorkflowComponent } from './components/multi-workflow/multi-workflow.component';
import { LogsModule } from '../library/logs/logs.module';
import { FormsModule } from '@angular/forms';
import { I18NextModule} from 'angular-i18next';

@NgModule({
  declarations: [MultiApprovalsComponent,ReplaceApproverComponent,
    MultiWorkflowComponent],
  imports: [
    CommonModule,
    SharedModule,
    NewSharedModule,
    SvmsSidebarNgModule,
    NgSelectModule,
    LogsModule,
    FormsModule,
    I18NextModule.forRoot(),
  ],
  exports: [MultiApprovalsComponent, MultiWorkflowComponent]
})
export class MultiApprovalsModule { }
