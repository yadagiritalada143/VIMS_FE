import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrganizationsRoutingModule } from './organizations-routing.module';
import { OrganizationsComponent } from './organizations.component';
import { OrganizationListComponent } from './organization-list/organization-list.component';
import { OrganizationCreateComponent } from './organization-create/organization-create.component';
import { NoOrganizationComponent } from './no-organization/no-organization.component';
import { OrganizationHeaderComponent } from './organization-header/organization-header.component';
import { SharedModule } from '../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MspBasicInfoComponent } from './components/msp-basic-info/msp-basic-info.component';
import { VmsTableModule } from '../library/smartTable/vms-table.module';
import { ImageCropperModule } from 'ngx-image-cropper';
import { VendorBasicInfoComponent } from './components/vendor-basic-info/vendor-basic-info.component';
import { ClientBasicInfoComponent } from './components/client-basic-info/client-basic-info.component';
import { AddressAndContactDetailsComponent } from './components/address-and-contact-details/address-and-contact-details.component';
import { DatePipe } from '@angular/common';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { I18NextModule } from 'angular-i18next';
import { SsoSettingInfoComponent } from './components/sso-setting-info/sso-setting-info.component';

@NgModule({
  declarations: [OrganizationsComponent, OrganizationListComponent, OrganizationCreateComponent, NoOrganizationComponent, OrganizationHeaderComponent, MspBasicInfoComponent, VendorBasicInfoComponent, ClientBasicInfoComponent, AddressAndContactDetailsComponent, SsoSettingInfoComponent],
  imports: [
    CommonModule,
    OrganizationsRoutingModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    VmsTableModule,
    ImageCropperModule,
    ReactiveFormsModule,
    NewSharedModule,
    I18NextModule,
  ],
  exports: [
    OrganizationCreateComponent
  ],
  providers: [ DatePipe]
})
export class OrganizationsModule { }
