import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { VmsTableModule } from '../library/smartTable/vms-table.module';
import { TreeModule } from '../library/tree/tree.module';
import { SharedModule } from '../shared/shared.module';
import { AddAddressComponent } from './component/add-address/add-address.component';
import { AddContactComponent } from './component/add-contact/add-contact.component';
import { AddDiversityComponent } from './component/add-diversity/add-diversity.component';
import { AddRefrenceComponent } from './component/add-refrence/add-refrence.component';
import { DocumentComplianceComponent } from './component/document-compliance/document-compliance.component';
import { VendorOnboardComponent } from './component/vendor-onboard/vendor-onboard.component';
import { WelcomeOnboardComponent } from './component/welcome-onboard/welcome-onboard.component';
import { OnbaordSetupComponent } from './onbaord-setup/onbaord-setup.component';
import { VendorComplianceListComponent } from './vendor-compliance-list/vendor-compliance-list.component';
import { VendorConfigurationComponent } from './vendor-configuration/vendor-configuration.component';
import { VendorGroupComponent } from './vendor-group/vendor-group.component';
import { VendorListComponent } from './vendor-list/vendor-list.component';
import { VendorManagmentRoutingModule } from './vendor-managment-routing.module';
import { VendorManagmentComponent } from './vendor-managment.component';
import { createVendorUserComponent } from './vendor-users/add-user/add-user.component';
import { VendorUserListComponent } from './vendor-users/user-list/user-list.component';
import { VendorBasicInfoComponent } from './vendor-users/add-user/basic-info/basic-info.component';
import { AddDocumentTypeComponent } from './component/add-document-type/add-document-type.component';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { I18NextModule } from 'angular-i18next';
import { CustomFieldsModule } from '../library/custom-fields/custom-fields.module';

@NgModule({
  declarations: [VendorManagmentComponent, OnbaordSetupComponent, WelcomeOnboardComponent,
    AddAddressComponent, AddContactComponent, AddDiversityComponent, VendorBasicInfoComponent,
    AddRefrenceComponent, VendorConfigurationComponent, VendorOnboardComponent, VendorComplianceListComponent,
    DocumentComplianceComponent,
    VendorListComponent, VendorGroupComponent, createVendorUserComponent, VendorUserListComponent, AddDocumentTypeComponent],
  imports: [
    CommonModule,
    VendorManagmentRoutingModule,
    SharedModule,
    NgSelectModule,
    VmsTableModule,
    FormsModule,
    ReactiveFormsModule,
    TreeModule,
    NewSharedModule,
    I18NextModule,
    CustomFieldsModule
  ],
  exports: [createVendorUserComponent,
    AddDocumentTypeComponent,
    DocumentComplianceComponent
  ]
})
export class VendorManagmentModule { }
