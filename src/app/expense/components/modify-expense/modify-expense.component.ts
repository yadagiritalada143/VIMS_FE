import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { Observable } from 'rxjs-compat/Observable';
import { map, mergeMap, takeUntil } from 'rxjs/operators';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { NavigationPaths, ReasonCode } from '../../enums/expense.enums';
import { ExpenseService } from '../../expense.service';
import { ExpenseModel } from '../../models/expense.model';
import { IReasonCodes } from '../../models/reasons.model';
import { ExpenseDetailService } from '../../pages/expense-detail/expense-detail.service';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-modify-expense',
  templateUrl: './modify-expense.component.html',
  styleUrls: ['./modify-expense.component.scss']
})
export class ModifyExpenseComponent implements OnInit, OnDestroy {
  @Input() data: ExpenseModel;
  @Output() closeModifyModal =  new EventEmitter();

  public modifyForm: UntypedFormGroup;
  public isLoadingModify: boolean = false;
  public sidebarVisibility = 'hidden';
  public modifyReasons$: Observable<any>;
  public destroy$: Subject<boolean> = new Subject<boolean>();
  private subscrptions: Subscription[] = [];
  logs: Log = undefined;
  constructor(
    private fb: UntypedFormBuilder,
    private eventStream: EventStreamService,
    private expenseService: ExpenseService,
    private expenseDetailService: ExpenseDetailService,
    private router: Router,
    private alertService: AlertService,
    private resonCodeService: ReasonCodesService
  ) { }

  ngOnInit(): void {
    this.subscrptions.push(this.eventStream.on(Events.MODIFY_EXPENSE).subscribe((data: boolean) => {
      if (data) {
        this.sidebarVisibility = 'visible';
      } else {
        this.sidebarVisibility = 'hidden';
        this.closeModifyModal.emit();
      }
    }));
    this.createForm();
    this.getModifyReasons();
  }

  public sidebarClose() {
    this.sidebarVisibility = 'hidden';
    this.modifyForm.reset();
  }

  public modify() {
    this.logs = undefined;
    this.isLoadingModify = true;
    this.subscrptions.push(this.expenseService.addModifyExpenseReason(this.data.expense_id, this.modifyForm.value)
      .pipe(
        mergeMap((res: any) => {
          if (res.status === 200) {
            this.sidebarClose();
            return this.expenseDetailService.modifyExpense(this.data.expense_id)
          }
        }),
        takeUntil(this.destroy$)
      ).subscribe({next:(res:any) => {
        this.isLoadingModify = false;
        if (res.data) {
          this.alertService.success('Expense modified successfully');
          const newExpenseId = res.data.expense_uuid;
          this.router.navigateByUrl(NavigationPaths.user.generalListItemDetails(newExpenseId));
          this.expenseDetailService.getExpenseDetailsById(newExpenseId, false);
        } else {
          this.showError(res.error.error.message);
        }
      },error: err => {
        this.isLoadingModify = false;
        this.showError(err);
      }}));
  }

  private createForm() {
    this.modifyForm = this.fb.group({
      modify_reason: [null, Validators.required],
      modify_notes: ['']
    });
  }

  private getModifyReasons() {
    this.modifyReasons$ = this.resonCodeService.getResoncodesFor(ReasonCode.ModifyExpense).pipe(
      map((data: IReasonCodes) => data.reason_codes)
    );
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }
  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
}
