import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { DndModule } from 'ngx-drag-drop';
import { FormsModule } from '@angular/forms';
import { TreeviewModule } from 'ngx-treeview';
import { HierarchyConfigurationRoutingModule } from './hierarchy-configuration-routing.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    NgSelectModule,
    DndModule,
    HierarchyConfigurationRoutingModule,
    TreeviewModule.forRoot(),
    FormsModule
  ]
})
export class HierarchyConfigurationModule { }
