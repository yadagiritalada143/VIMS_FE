import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import {ExpenseModel} from '../../models/expense.model';
import {ExpenseWithdrawService} from './expense-withdraw.service';
import {FormHelperService} from '../../services/form-helper/form-helper.service';
import { Subscription } from 'rxjs';
import { Log } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-withdraw-expense',
  templateUrl: './expense-withdraw.component.html',
  styleUrls: ['./expense-withdraw.component.scss'],
})

export class WithdrawExpenseComponent implements OnInit, OnDestroy {
  withDrawExpenses = 'hidden';
  @Input() data: ExpenseModel;
  @Output() closeWithdrawModal =  new EventEmitter();
  logs: Log = undefined;

  private subscription: Subscription;

  constructor(
      private eventStream: EventStreamService,
      private expenseWithdrawService: ExpenseWithdrawService,
      private formHelperService: FormHelperService,
      ) {}

  ngOnInit(): void {
    this.subscription = this.eventStream.on(Events.WITHDRAW_EXPENSE).subscribe((data:any) => data ? this.sidebarOpen() : this.sidebarClose());
    this.expenseWithdrawService.init();
    this.eventStream.on(Events.SHOW_ERROR_SIDEBAR_EXPENSE_LOGS).subscribe((data:any) => {
      this.logs = data
    });
  }
  public get withDrawReasons() {
    return this.expenseWithdrawService.withDrawReasons$;
  }
  public get withdrawForm() {
    return this.expenseWithdrawService.withdrawForm;
  }

  public get isLoadingWithdraw() {
    return this.expenseWithdrawService.isLoadingWithdraw;
  }

  public sidebarClose(): void {
    this.withDrawExpenses = 'hidden';
    this.closeWithdrawModal.emit();
    this.withdrawForm.reset();
  }

  public sidebarOpen(): void {
    this.withDrawExpenses = 'visible';
  }

  public get isBlocked() {
    return this.expenseWithdrawService.withdrawForm.invalid;
  }

  public onSubmitForm() {
    if (this.isBlocked) {
      this.formHelperService.showErrors(this.withdrawForm);
      return;
    }
    this.expenseWithdrawService.submitWithdrawExpense(this.data.expense_id, this.withdrawForm.value);
  }

  ngOnDestroy() {
    this.expenseWithdrawService.unsubscribe();
    this.subscription.unsubscribe();
  }
}
