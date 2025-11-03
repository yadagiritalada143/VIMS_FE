import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TenureLimitRoutingModule } from './tenure-limit-routing.module';
import { TenureLimitCreateComponent } from './tenure-limit-create/tenure-limit-create.component';
import { TenureLimitListComponent } from './tenure-limit-list/tenure-limit-list.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { LogsModule } from 'src/app/library/logs/logs.module';
import { VmsTableModule } from '../../library/table/vms-table.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SvmsTableModule } from '../../library/svms-table/svms-table.module';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [
    TenureLimitCreateComponent,
    TenureLimitListComponent
  ],
  imports: [
    CommonModule,
    TenureLimitRoutingModule,
    SharedModule,
    NgSelectModule,
    LogsModule,
    VmsTableModule,
    FormsModule,
    ReactiveFormsModule,
    SvmsTableModule,
    I18NextModule,
  ],
})
export class TenureLimitModule { }
