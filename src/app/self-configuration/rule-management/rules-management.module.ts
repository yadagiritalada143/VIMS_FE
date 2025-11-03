import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RulesManagementRoutingModule } from './rules-management-routing.module';
import { RulesListComponent } from './rule-list/rules-list.component';
import { NewRuleComponent } from './new-rule/new-rule.component';
import { VmsTableModule } from '../../library/smartTable/vms-table.module';
import { NewSharedModule } from '../../new-shared/new-shared.module';
import { SharedModule } from '../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { DndModule } from 'ngx-drag-drop';
import { RulesViewComponent } from './rule-view/rules-view.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TreeviewModule } from 'ngx-treeview';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { SvmsTableModule } from "../../library/svms-table/svms-table.module";
import { HierarchyModule } from "../../program-setup/hierarchy/hierarchy.module";
import { I18NextModule } from 'angular-i18next';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollY: true
};
@NgModule({
    declarations: [RulesListComponent, NewRuleComponent, RulesViewComponent],
    providers: [
        SortHelperPipe,
        {
          provide: PERFECT_SCROLLBAR_CONFIG,
          useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
        }
    ],
  imports: [
    CommonModule,
    RulesManagementRoutingModule,
    VmsTableModule,
    NewSharedModule,
    SharedModule,
    NgSelectModule,
    DndModule,
    TreeviewModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    SvmsTableModule,
    HierarchyModule,
    I18NextModule,
    PerfectScrollbarModule,
  ],
})
export class RulesManagementModule { }
