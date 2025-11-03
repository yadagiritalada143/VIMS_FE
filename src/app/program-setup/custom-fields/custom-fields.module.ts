import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SvgIconsModule } from '@ngneat/svg-icon';
import { DndModule } from 'ngx-drag-drop';
import { CustomFieldsRoutingModule } from './custom-fields-routing.module';
import { VmsTableModule } from '../../library/table/vms-table.module';
import { SharedModule } from '../../shared/shared.module';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { customFieldsIcons } from 'src/app/svg/custom-fields';
import { CustomFieldsComponent } from './custom-fields.component';
import { CreateCustomFieldsComponent } from './create-custom-fields/create-custom-fields.component';
import { ReOrderingCustomFieldsComponent } from './reordering-custom-fields/reordering-custom-fields.component';
import { CustomFieldsListComponent } from './custom-fields-list/custom-fields-list.component';
import { CustomFieldTypeComponent } from './components/custom-field-type/custom-field-type.component';
import { CustomFieldsTabsComponent } from './components/custom-fields-tabs/custom-fields-tabs.component';
import { CustomFieldOptionsFormComponent } from './custom-field-options-form/custom-field-options-form.component';
import { CustomDependentComponent } from './components/custom-dependent/custom-dependent.component';
import { DependentSelectionComponent } from './components/dependent-selection/dependent-selection.component';
import { LinkedModulesComponent } from './components/linked-modules/linked-modules.component';
import { VendorsFieldsComponent } from './components/vendors-fields/vendors-fields.component';
import { TreeviewModule } from 'ngx-treeview';
import { PicklistComponent } from './components/picklist/picklist.component';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [
    CustomFieldsComponent,
    ReOrderingCustomFieldsComponent,
    CreateCustomFieldsComponent,
    CustomFieldsListComponent,
    CustomFieldTypeComponent,
    CustomFieldOptionsFormComponent,
    CustomFieldsTabsComponent,
    CustomDependentComponent,
    DependentSelectionComponent,
    LinkedModulesComponent,
    VendorsFieldsComponent,
    PicklistComponent,
  ],
  imports: [
    CommonModule,
    VmsTableModule,
    SharedModule,
    DndModule,
    CustomFieldsRoutingModule,
    ReactiveFormsModule,
    NewSharedModule,
    NgSelectModule,
    FormsModule,
    SvgIconsModule.forChild(customFieldsIcons),
    TreeviewModule.forRoot(),
    DndModule,
    I18NextModule,
  ],
  exports: [CreateCustomFieldsComponent, CustomFieldsTabsComponent, ReOrderingCustomFieldsComponent],
  providers: [
    SortHelperPipe,
    UniqueKeyPipe
  ]
})
export class CustomFieldsModule { }
