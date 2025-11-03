import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs-compat/Observable';
import { map } from 'rxjs/internal/operators/map';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { ReasonCode } from '../../enums/expense.enums';
import { ExpenseModel } from '../../models/expense.model';
import { IReasonCodes } from '../../models/reasons.model';
import { ExpenseStatusService } from '../../services/expense-status.service';

@Component({
  selector: 'app-reject-expense',
  templateUrl: './reject-expense.component.html',
  styleUrls: ['./reject-expense.component.scss']
})

export class RejectExpenseComponent implements OnInit, OnDestroy {
  @Input() data: ExpenseModel;
  @Output() closeRejectModal = new EventEmitter();

  rejectExpense = "hidden";
  public rejectionReasons$: Observable<any>;
  public rejectionForm: UntypedFormGroup;
  public isLoadingReject: boolean = false;
  private subscription: Subscription;
  approval_chain_id: any;
  currentMemberId: any;

  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private reasonCodesService: ReasonCodesService,
    private expenseStatusService: ExpenseStatusService,
  ) { }


  ngOnInit(): void {
    this.subscription = this.eventStream.on(Events.REJECT_EXPENSE).subscribe((data:any) => {
      if (data) {
        this.approval_chain_id = data.approval_chain_id;
        this.currentMemberId = data.currentMemberId;
        this.rejectExpense = "visible";
      } else {
        this.rejectExpense = "hidden";
        this.closeRejectModal.emit();
      }
    });
    this.getRejectReasons();
    this.createForm();
  }

  sidebarClose() {
    this.rejectExpense = "hidden";
    this.rejectionForm.reset();
  }

  private createForm() {
    this.rejectionForm = this.fb.group({
      status_reason: [null, Validators.required],
      status_note: ['']
    });
  }

  private getRejectReasons() {
    this.rejectionReasons$ = this.reasonCodesService.getResoncodesFor(ReasonCode.RejectExpense).pipe(
      map((data: IReasonCodes) => data.reason_codes)
    )
  }

  public reject() {
    this.expenseStatusService.rejectExpense(this.data.expense_id, this.rejectionForm.value,this.approval_chain_id,this.currentMemberId);
    this.sidebarClose();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
