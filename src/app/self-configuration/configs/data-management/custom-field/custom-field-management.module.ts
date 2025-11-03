import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomFieldManagementRoutingModule } from './custom-field-management-routing.module';
import { CustomFieldListComponent } from './custom-field-list/custom-field-list.component';
import { NewCustomFieldComponent } from './new-custom-field/new-custom-field.component';
import { VmsTableModule } from 'src/app/library/smartTable/vms-table.module';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { DndModule } from 'ngx-drag-drop';
import { CustomFieldViewComponent } from './custom-field-view/custom-field-view.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TreeviewModule } from 'ngx-treeview';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { SvmsTableModule } from "src/app/library/svms-table/svms-table.module";
import { HierarchyModule } from "src/app/program-setup/hierarchy/hierarchy.module";
import { SvgIconsModule } from '@ngneat/svg-icon';
import { PicklistComponent } from './picklist/picklist.component';
import { VendorSelectionModalComponent } from './vendor-selection-modal/vendor-selection-modal.component';
import { I18NextModule} from 'angular-i18next';

@NgModule({
    declarations: [CustomFieldListComponent, NewCustomFieldComponent, CustomFieldViewComponent, PicklistComponent, VendorSelectionModalComponent],
    providers: [
        SortHelperPipe
    ],
    imports: [
        CommonModule,
        CustomFieldManagementRoutingModule,
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
        SvgIconsModule,
        I18NextModule.forRoot()
    ]
})
export class CustomFieldManagementModule { }
