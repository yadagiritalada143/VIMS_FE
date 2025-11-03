import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VmsTableModule } from '.././../library/table/vms-table.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { FormsModule } from '@angular/forms';
import { SvmsHierarchyModule } from 'src/app/library/hierarchy/hierarchy.module';
import { LogsModule } from 'src/app/library/logs/logs.module';
import { InvoiceConfigurationCreateComponent } from './invoice-configuration-create/invoice-configuration-create.component';
import { InvoiceConfigurationRoutingModule } from './invoice-configuration-routing.module';
import { InvoiceConfigurationListComponent } from './invoice-configuration-list/invoice-configuration-list.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [InvoiceConfigurationCreateComponent, InvoiceConfigurationListComponent],
  imports: [
    CommonModule,
    FormsModule,
    InvoiceConfigurationRoutingModule,
    VmsTableModule,
    SvmsHierarchyModule,
    SharedModule,
    NgSelectModule,
    NewSharedModule,
    LogsModule,
    NgbModule,
    I18NextModule,
  ],
})
export class InvoiceConfigurationModule { }
