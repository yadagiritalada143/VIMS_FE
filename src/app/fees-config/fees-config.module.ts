import { NewSharedModule } from './../new-shared/new-shared.module';
import { SharedModule } from './../shared/shared.module';
import { VmsTableModule } from './../library/smartTable/vms-table.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeesConfigRoutingModule } from './fees-config-routing.module';
import { FeesConfigComponent } from './fees-config.component';
import { CreateFeeComponent } from './create-fee/create-fee.component';
import { FeeListingComponent } from './fee-listing/fee-listing.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilderModule } from '../library/form-builder/form-builder.module';
import { TreeviewModule } from 'ngx-treeview';
import { FilterFeeConfigComponent } from './filter-fee-config/filter-fee-config.component';
import { SvmsSidebarNgModule } from '../library/svms-sidebar-ng/svms-sidebar-ng.module';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [
    FeesConfigComponent, 
    CreateFeeComponent, 
    FeeListingComponent, 
    FilterFeeConfigComponent
  ],
  imports: [
    CommonModule,
    FeesConfigRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    FormBuilderModule,
    VmsTableModule,
    SharedModule,
    NewSharedModule,
    TreeviewModule.forRoot(),
    SvmsSidebarNgModule,
    NgbDatepickerModule,
    I18NextModule,
  ],
})
export class FeesConfigModule { }
