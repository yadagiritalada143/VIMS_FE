import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ExpenseConfigurationRoutingModule } from './expense-configuration-routing.module';
import { CreateNewComponent } from './create-new/create-new.component';
import { ListComponent } from './list/list.component';
import { ExpenseConfigurationComponent } from '../expense-configuration/expense-configuration.component';
import { SharedModule } from '../../../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TreeviewModule } from 'ngx-treeview';
import { SvmsTableModule } from 'src/app/library/svms-table/svms-table.module';
import { AddExpenseTypeComponent } from './add-expense-type/add-expense-type.component';
import { ServerErrorComponent } from './server-error/server-error.component';
import { LogsModule } from 'src/app/library/logs/logs.module';
import { ExpenseConfigurationListService } from 'src/app/program-setup/expense-configuration/pages/expense-configuration-list/expense-configuration-list.service';
import { I18NextModule } from 'angular-i18next';



@NgModule({
  declarations: [
    CreateNewComponent,
    ListComponent,
    ExpenseConfigurationComponent,
    AddExpenseTypeComponent,
    ServerErrorComponent
  ],
  imports: [
    CommonModule,
    ExpenseConfigurationRoutingModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    TreeviewModule,
    SvmsTableModule,
    LogsModule,
    I18NextModule,
  ],
  providers:[ExpenseConfigurationListService]
})
export class ExpenseConfigurationModule { }
