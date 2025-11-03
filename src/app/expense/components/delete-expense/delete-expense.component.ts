import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs-compat/Observable';
import { map } from 'rxjs/internal/operators/map';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { ReasonCode } from '../../enums/expense.enums';
import { ExpenseModel } from '../../models/expense.model';
import { IReasonCodes } from '../../models/reasons.model';
import { ExpenseStatusService } from '../../services/expense-status.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-delete-expense',
  templateUrl: './delete-expense.component.html',
  styleUrls: ['./delete-expense.component.scss']
})
export class DeleteExpenseComponent implements OnInit, OnDestroy {
  @Input() data: ExpenseModel;
  @Output() closeModal = new EventEmitter();
  @Output() updateExpenseDetails = new EventEmitter();

  deleteExpense = "hidden";
  public deleteReasons$: Observable<any>;
  public deletionForm: UntypedFormGroup;
  public isLoading: boolean = false;
  private subscription: Subscription;
  logs: Log = undefined;
  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private reasonCodesService: ReasonCodesService,
    private expenseStatusService: ExpenseStatusService,
    private confirmationService: ConfirmationDialogService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.subscription = this.eventStream.on(Events.DELETE_EXPENSE).subscribe((data) => {
      if (data) {
        this.deleteExpense = "visible";
      } else {
        this.deleteExpense = "hidden";
        this.closeModal.emit();
      }
    });
    this.getDeleteReasons();
    this.createForm();
  }

  sidebarClose() {
    this.deleteExpense = "hidden";
    this.deletionForm.reset();
  }

  private createForm() {
    this.deletionForm = this.fb.group({
      delete_reason: [null, Validators.required],
      delete_notes: ['']
    });
  }

  private getDeleteReasons() {
    this.deleteReasons$ = this.reasonCodesService.getResoncodesFor(ReasonCode.DeleteExpense).pipe(
      map((data: IReasonCodes) => data.reason_codes)
    )
  }

  public delete() {
    this.confirmationService.confirm('', 'Are you sure you want to delete this Expense?', 'Yes', 'No').then(confirmed => {
      if (confirmed) {
        this.expenseStatusService.deleteExpense(this.data.expense_id, this.deletionForm.value).subscribe(() => {
          this.alertService.success('Successfully, deleted the Expense.');
          this.sidebarClose();
          this.updateExpenseDetails.emit();
        }, (err) => this.showError(err));
      }
    })
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }
}
