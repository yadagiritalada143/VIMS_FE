import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HierarchyRoutingModule } from './hierarchy-routing.module';
import { HierarchyComponent } from './hierarchy.component';
import { HierarchyConfigurationComponent } from './hierarchy-configuration/hierarchy-configuration.component';
import { VmsTableModule } from '../../library/table/vms-table.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { CreateFoundationalDataTypeComponent } from './create-foundational-data-type/create-foundational-data-type.component';
import { ListFoundationalDataTypeComponent } from './list-foundational-data-type/list-foundational-data-type.component';
import { CreateFoundationalDataComponent } from './create-foundational-data/create-foundational-data.component';
import { ListFoundationalDataComponent } from './list-foundational-data/list-foundational-data.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NoListingPageComponent } from './components/no-listing-page/no-listing-page.component';
import { CreateHierarchyComponent } from './create-hierarchy/create-hierarchy.component';
import { ListWorkLocationComponent } from './list-work-location/list-work-location.component';
import { CreateWorkLocationComponent } from './create-work-location/create-work-location.component';
import { ReorderFlyoutComponent } from './components/reorder-flyout/reorder-flyout.component';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { CustomNgSelectorComponent } from './components/custom-ng-selector/custom-ng-selector.component';
import { DndModule } from 'ngx-drag-drop';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { TreeModule } from 'src/app/library/tree/tree.module';
import { CustomFieldsModule } from '../custom-fields/custom-fields.module';
import { SvmsTableModule } from 'src/app/library/svms-table/svms-table.module';
import { TreeviewModule } from 'ngx-treeview';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [HierarchyComponent, HierarchyConfigurationComponent, CreateFoundationalDataTypeComponent, ListFoundationalDataTypeComponent, CreateFoundationalDataComponent, ListFoundationalDataComponent, NoListingPageComponent, CreateHierarchyComponent, ListWorkLocationComponent, CreateWorkLocationComponent, ReorderFlyoutComponent, CustomNgSelectorComponent],
  imports: [
    CommonModule,
    HierarchyRoutingModule,
    SharedModule,
    VmsTableModule,
    SvmsTableModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    NewSharedModule,
    DndModule,
    TreeModule,
    CustomFieldsModule,
    TreeviewModule.forRoot(),
    I18NextModule,
  ], providers: [
    SortHelperPipe
  ], exports: [
    NoListingPageComponent,
    CreateFoundationalDataTypeComponent,
    ReorderFlyoutComponent,
    CreateFoundationalDataComponent,
    CreateWorkLocationComponent,
    CreateHierarchyComponent,
    CustomNgSelectorComponent
  ]
})
export class HierarchyModule { }
