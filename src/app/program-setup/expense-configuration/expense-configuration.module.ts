import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseConfigurationRoutingModule } from './expense-configuration-routing.module';
import { VmsTableModule } from 'src/app/library/table/vms-table.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { FormRendererModule } from 'src/app/library/form-renderer/form-renderer.module';
import { SvmsHierarchyModule } from 'src/app/library/hierarchy/hierarchy.module';

import { ExpenseConfigurationListComponent } from './pages/expense-configuration-list/expense-configuration-list.component';
import {ExpenseConfigurationItemDetailsComponent} from './pages/expense-configuration-item-details/expense-configuration-item-details.component';
import {ExpenseConfigurationComponent} from './pages/expense-configuration.component';
import { ExpenseToggleComponent } from './components/expense-toggle/expense-toggle.component';
import { ExpenseConfigurationFormComponent } from './components/expense-configuration-form/expense-configuration-form.component';
import { PeriodSelectComponent } from './components/period-select/period-select.component';
import { AddExpenseTypeComponent } from './components/add-expense-type/add-expense-type.component';
import {ExpenseConfigurationListExpenseTypeComponent} from './components/expense-configuration-list-expense-type/expense-configuration-list-expense-type.component';
import {ServerErrorComponent} from './components/server-error/server-error.component';
import { ExpenseHistoryDetailsComponent } from './components/expense-history-details/expense-history-details.component';
import { HistoryChangesRowComponent } from './components/history-changes-row/history-changes-row.component';
import {TimelineHistoryComponent} from './components/timeline-history/timeline-history.component';
import {NgxSkeletonLoaderModule} from 'ngx-skeleton-loader';
import {PaginatorComponent} from './components/paginator/paginator.component';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { SelectHierarchyComponent } from './components/select-hierarchy/select-hierarchy.component';
import { LogsModule } from 'src/app/library/logs/logs.module';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [
    ExpenseConfigurationComponent,
    ExpenseConfigurationListComponent,
    ExpenseConfigurationItemDetailsComponent,
    ExpenseToggleComponent,
    ExpenseConfigurationFormComponent,
    PeriodSelectComponent,
    ExpenseConfigurationListExpenseTypeComponent,
    AddExpenseTypeComponent,
    ServerErrorComponent,
    ExpenseHistoryDetailsComponent,
    HistoryChangesRowComponent,
    TimelineHistoryComponent,
    PaginatorComponent,
    SelectHierarchyComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ExpenseConfigurationRoutingModule,
    VmsTableModule,
    SharedModule,
    NgSelectModule,
    ReactiveFormsModule,
    NgxSkeletonLoaderModule,
    FormRendererModule,
    SvmsHierarchyModule,
    NgxSkeletonLoaderModule,
    NewSharedModule,
    LogsModule,
    I18NextModule,
  ],
})
export class ExpenseConfigurationModule { }
