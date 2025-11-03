import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// modules
import { ExpenseRoutingModule } from './expense-routing.module';
import { VmsTableModule } from 'src/app/library/smartTable/vms-table.module';
import { SvmsSidebarNgModule } from '../library/svms-sidebar-ng/svms-sidebar-ng.module';
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { TimesheetModule } from '../wipro-timesheet/timesheet.module';
import { SimpleTableModule } from '../library/simple-table/simple-table.module';

// pipes
import { DatePipe } from '@angular/common';

// components
import { ExpenseComponent } from './expense.component';
import { NoExpenseComponent } from './components/no-expense/no-expense.component';
import { AddExpenseComponent } from './components/add-expense/add-expense.component';
import { ExpenseAssignmentComponent } from './components/expense-assignment/expense-assignment.component';
import { AttachmentUploadComponent } from './components/attachment-upload/attachment-upload.component';
import { ExpenseHeaderComponent } from './components/expense-header/expense-header.component';
import { WithdrawExpenseComponent } from './components/expense-withdraw/expense-withdraw-component';
import { NewExpenseHeaderComponent } from './components/new-expense-header/new-expense-header.component';
import { ExpenseSingleDetailComponent } from './components/expense-single-detail/expense-single-detail.component';
import { RejectExpenseComponent } from './components/reject-expense/reject-expense.component';
import { ModifyExpenseComponent } from './components/modify-expense/modify-expense.component';
import { EditExpenseComponent } from './components/edit-expense/edit-expense.component';
import { AttachmentItemComponent } from './components/attachment-item/attachment-item.component';

// pages components
import { ExpensesListComponent } from './pages/expenses-list/expenses-list.component';
import { NewExpenseDetailsComponent } from './pages/new-expense-details/new-expense-details.component';
import { ExpenseDetailComponent } from './pages/expense-detail/expense-detail.component';
import { DeleteExpenseComponent } from './components/delete-expense/delete-expense.component';
import { LogsModule } from '../library/logs/logs.module';
import { CustomFieldsModule } from '../library/custom-fields/custom-fields.module';
import { MultiApprovalsModule } from '../multi-approvals/multi-approvals.module';
import { I18NextModule } from 'angular-i18next';

@NgModule({
    declarations: [
        ExpenseComponent,
        NoExpenseComponent,
        AddExpenseComponent,
        ExpensesListComponent,
        ExpenseAssignmentComponent,
        AttachmentUploadComponent,
        ExpenseHeaderComponent,
        ExpenseDetailComponent,
        WithdrawExpenseComponent,
        NewExpenseDetailsComponent,
        NewExpenseHeaderComponent,
        ExpenseSingleDetailComponent,
        RejectExpenseComponent,
        ModifyExpenseComponent,
        EditExpenseComponent,
        AttachmentItemComponent,
        DeleteExpenseComponent,
    ],
    imports: [
        CommonModule,
        ExpenseRoutingModule,
        SharedModule,
        ReactiveFormsModule,
        NgSelectModule,
        VmsTableModule,
        SvmsSidebarNgModule,
        NewSharedModule,
        TimesheetModule,
        SimpleTableModule,
        LogsModule,
        CustomFieldsModule,
        MultiApprovalsModule,
        I18NextModule
    ],
    providers: [DatePipe]
})

export class ExpenseModule { }
