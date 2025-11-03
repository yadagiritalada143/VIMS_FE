import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowsManagementRoutingModule } from 'src/app/self-configuration/flows-management/flows-management-routing.module';
import { VmsTableModule } from '../../library/smartTable/vms-table.module';
import { NewSharedModule } from '../../new-shared/new-shared.module';
import { SharedModule } from '../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { DndModule } from 'ngx-drag-drop';
import { FlowsViewComponent } from './flows-view/flows-view.component';
import { FormsModule } from '@angular/forms';
import { TreeviewModule } from 'ngx-treeview';
import { NewFlowComponent } from 'src/app/self-configuration/flows-management/new-flow/new-flow.component';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [NewFlowComponent, FlowsViewComponent],
  imports: [
    CommonModule,
    FlowsManagementRoutingModule,
    VmsTableModule,
    NewSharedModule,
    SharedModule,
    NgSelectModule,
    DndModule,
    TreeviewModule.forRoot(),
    FormsModule,
    I18NextModule,
  ],
})
export class FlowsManagementModule { }
