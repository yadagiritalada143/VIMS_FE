import { Injectable } from '@angular/core';
import { StorageKeys, StorageService } from '../../../core/services/storage.service';
import { Observable, Subject, throwError } from 'rxjs';
import { IExpenseType, IProgram } from '../../interfaces/expense.interfaces';
import { HttpService } from '../../../core/services/http.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { map } from 'rxjs/internal/operators/map';
import { takeUntil } from 'rxjs/operators';
import { AlertService } from '../../../core/components/alert/alert.service';
import { IWithDraw, IWithDrawResponse } from '../../models/expense-withdraw.model';
import { ReasonCode } from '../../enums/expense.enums';
import { IReasonCodes } from '../../models/reasons.model';
import { EmitEvent, Events, EventStreamService } from '../../../core/services/event-stream.service';
import { ExpenseDetailService } from '../../pages/expense-detail/expense-detail.service';
import { ExpenseService } from '../../expense.service';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';


@Injectable({
  providedIn: 'root',
})
export class ExpenseWithdrawService {
  private readonly currentProgram: IProgram;
  public destroy$: Subject<boolean> = new Subject<boolean>();
  public withdrawForm: UntypedFormGroup;
  public withDrawReasons$: Observable<any>;
  public isLoadingWithdraw = false;
  public expenseType: IExpenseType;

  constructor(
    public http: HttpService,
    private storageService: StorageService,
    private formBuilder: UntypedFormBuilder,
    private alertService: AlertService,
    private expenseDetailService: ExpenseDetailService,
    private expenseService: ExpenseService,
    private eventStream: EventStreamService,
    private resonCodeService: ReasonCodesService,
  ) {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  }
  public init() {
    this.getExpenseType();
    this.withDrawReasons$ = this.resonCodeService
      .getResoncodesFor(ReasonCode.WithdrawExpense)
      .pipe(map((data: IReasonCodes) => data.reason_codes));
    this.withdrawForm = this.formBuilder.group({
      withdraw_reason: [null, Validators.required],
      withdraw_notes: [''],
    });
  }

  public getExpenseType(): void {
    this.expenseService.expenseType$.pipe(takeUntil(this.destroy$)).subscribe(type => {
      this.expenseType = type;
    });
  }
  public submitWithdrawExpense(expenseId: string, data: IWithDraw) {
    this.isLoadingWithdraw = true;
    this.http
      .post(`/expense/programs/${this.currentProgram.id}/withdraw-expense/${expenseId}`, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({next:
        (res: IWithDrawResponse) => {
          if (res.status === 200) {
            this.eventStream.emit(new EmitEvent(Events.WITHDRAW_EXPENSE, false));
            this.isLoadingWithdraw = false;
            this.expenseDetailService.getExpenseDetailsById(expenseId, false);
            this.alertService.success(
              this.expenseType.name.charAt(0).toUpperCase() + this.expenseType.name.slice(1) + ' withdrawn successfully',
            );
          }
        },error:
        error => {
          this.isLoadingWithdraw = false;
          this.showError(error);
          return throwError(error);
        },
  });
  }
  showError(err) {
    window.scrollTo(0, 0);
    let logs:Log = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        logs.messages.push(msg?.message);
      }
    });
    this.eventStream.emit(new EmitEvent(Events.SHOW_ERROR_SIDEBAR_EXPENSE_LOGS, logs));
  }

  public unsubscribe() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
