import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { PendingItemTypes } from '../../enums/pending-item-types';

@Component({
  selector: 'app-rejection-sidebar',
  templateUrl: './rejection-sidebar.component.html',
  styleUrls: ['./rejection-sidebar.component.scss'],
})
export class RejectionSidebarComponent implements OnInit, OnDestroy {
  @Output() closeRejectModal = new EventEmitter();
  @Output() rejectRequest = new EventEmitter();

  @Input() programId: string;
  @Input() assignmentId: string;
  @Input() title: string;
  @Input() requestType: PendingItemTypes;

  public rejectExpense = 'hidden';
  public rejectionForm: UntypedFormGroup;
  public rejectionReasons$: Observable<any>;
  rejectionReasons: any[] = []
  private subscrptions: Subscription[] = [];

  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private reasonCodesService: ReasonCodesService
  ) { }

  ngOnInit(): void {
    this.subscrptions.push(
      this.eventStream.on(Events.REJECT_BUDGET).subscribe(data => {
        if (data) {
          this.rejectExpense = 'visible';
        } else {
          this.rejectExpense = 'hidden';
          this.closeRejectModal.emit();
        }
      }),
    );
    this.getRejectReasons();
    this.createForm();
  }

  private createForm() {
    this.rejectionForm = this.fb.group({
      status_reason: [null, Validators.required],
      status_note: [''],
    });
  }

  private getRejectReasons() {
    this.rejectionReasons$ = this.reasonCodesService
      .getResoncodesFor(this.getRequestType(this.requestType))
      .subscribe((updateReason: any) => {
        this.rejectionReasons = updateReason?.reason_codes;
      });
  }

  getRequestType(requestType: PendingItemTypes) {
    let action: string;
    switch (requestType) {
      case PendingItemTypes.AdditionalBudget: {
        action = 'REJECT_ADDITIONAL_BUDGET'
        break;
      }
      case PendingItemTypes.ReviewAssignment: {
        action = 'REVIEW_ASSIGNMENT';
        break;
      }
      default: {
        action = 'REJECT_AMENDMENT';
        break;
      }
    }
    return action;
  }

  public sidebarClose() {
    this.rejectExpense = 'hidden';
    this.rejectionForm.reset();
    this.closeRejectModal.emit();
  }

  public reject() {
    let formValues = this.rejectionForm.value;
    if (this.rejectionReasons && this.rejectionReasons?.length > 0) {
      this.rejectionReasons?.forEach(element => {
        if (element?.id === formValues?.status_reason) {
          formValues.status_reason_txt = element?.name;
        }
      });
    }
    this.rejectRequest.emit({
      value: formValues,
      type: this.requestType
    });
    this.sidebarClose();
  }

  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
}
