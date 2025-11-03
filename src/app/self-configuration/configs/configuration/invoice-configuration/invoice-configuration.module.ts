import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InvoiceConfigurationRoutingModule } from './invoice-configuration-routing.module';
import { InvoiceConfigurationComponent } from './invoice-configuration.component';
import { ListComponent } from './list/list.component';
import { SharedModule } from '../../../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TreeviewModule } from 'ngx-treeview';
import { SvmsTableModule } from 'src/app/library/svms-table/svms-table.module';
import { InvoiceConfigurationCreateComponent } from './invoice-configuration-create/invoice-configuration-create.component';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { LogsModule } from 'src/app/library/logs/logs.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { I18NextModule } from 'angular-i18next';


@NgModule({
  declarations: [
    InvoiceConfigurationComponent,
    ListComponent,
    InvoiceConfigurationCreateComponent
  ],
  imports: [
    CommonModule,
    InvoiceConfigurationRoutingModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    TreeviewModule,
    SvmsTableModule,
    NgSelectModule,
    NewSharedModule,
    LogsModule,
    NgbModule,
    I18NextModule,
  ],
})
export class InvoiceConfigurationModule { }
