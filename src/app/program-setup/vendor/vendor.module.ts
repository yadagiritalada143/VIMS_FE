import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { VendorRoutingModule } from './vendor-routing.module';
import { VendorListComponent } from './vendor-list/vendor-list.component';
import { VendorGroupListComponent } from './vendor-group-list/vendor-group-list.component';
import { VendorComplianceListComponent } from './vendor-compliance-list/vendor-compliance-list.component';
import { VendorDocumentGroupListComponent } from './vendor-document-group-list/vendor-document-group-list.component';
import { VendorDsListComponent } from './vendor-ds-list/vendor-ds-list.component';
import { CreateVendorComponent } from './create-vendor/create-vendor.component';
import { CreateVendorGroupComponent } from './create-vendor-group/create-vendor-group.component';
import { CreateVendorScheduleComponent } from './create-vendor-schedule/create-vendor-schedule.component';
import { VendorComponent } from './vendor.component';
import { ComplianceRestrictionRuleComponent } from './compliance-restriction-rule/compliance-restriction-rule.component';
import { NewComplianceRestictionRuleComponent } from './new-compliance-restiction-rule/new-compliance-restiction-rule.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TreeModule } from 'src/app/library/tree/tree.module';
import { NgSelectModule } from '@ng-select/ng-select';
import {CandidatesModule} from '../../candidates/candidates.module';
import {CreateVendorComplianceGroupComponent} from './create-vendor-compliance-group/create-vendor-compliance-group.component';
import {NewVendorDocumentComponent} from './new-vendor-document/new-vendor-document.component';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { VmsTableModule } from 'src/app/library/table/vms-table.module';
import { CustomFieldsModule } from '../custom-fields/custom-fields.module';
import { SvmsHierarchyModule } from 'src/app/library/hierarchy/hierarchy.module';
import { TreeviewModule } from 'ngx-treeview';
import { I18NextModule } from 'angular-i18next';
import { CustomFieldsModule as CFModule } from 'src/app/library/custom-fields/custom-fields.module';

@NgModule({
  declarations: [VendorListComponent, VendorGroupListComponent, VendorDsListComponent, CreateVendorComponent,
    CreateVendorGroupComponent, CreateVendorScheduleComponent, VendorComponent, VendorComplianceListComponent,
    VendorDocumentGroupListComponent,
    CreateVendorComplianceGroupComponent,
    ComplianceRestrictionRuleComponent,
    NewComplianceRestictionRuleComponent,
    NewVendorDocumentComponent],
  imports: [
    CommonModule,
    VendorRoutingModule,
    SharedModule,
    VmsTableModule,
    FormsModule,
    ReactiveFormsModule,
    TreeModule,
    NgSelectModule,
    CandidatesModule,
    NewSharedModule,
    CustomFieldsModule,
    SvmsHierarchyModule,
    TreeviewModule.forRoot(),
    I18NextModule,
    CFModule
  ], exports: [
    CreateVendorScheduleComponent,
    NewComplianceRestictionRuleComponent,
    CreateVendorComponent,
    CreateVendorGroupComponent,
    NewVendorDocumentComponent,
    CreateVendorComplianceGroupComponent
  ]
})
export class VendorModule { }
