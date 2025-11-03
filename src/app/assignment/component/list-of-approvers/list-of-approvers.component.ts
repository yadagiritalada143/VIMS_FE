import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { AssignmentService } from '../../assignment.service';
import { ApprovalStatus } from 'src/app/shared/enums';
import { PendingItemTypes } from '../../enums/pending-item-types';

@Component({
  selector: 'app-list-of-approvers',
  templateUrl: './list-of-approvers.component.html',
  styleUrls: ['./list-of-approvers.component.scss'],
})
export class ListOfApproversComponent implements OnInit, OnDestroy {
  @Input() timezone:any;
  @Input() programId: string;
  @Input() additionalBudget: any;
  @Input() entityId: string;
  @Input() approveId: string;
  @Input() assignmentId: string;
  @Input() approversList$: Observable<any>;

  @Output() approverStatusChange = new EventEmitter();
  @Output() approverReject = new EventEmitter();

  public currentUserId: string;
  public isOpenReject = false;
  public readonly ApprovalStatus = ApprovalStatus;

  private subscrptions: Subscription[] = [];
  currentDateFormat: any;
  approvalChainId: any;

  constructor(
    private assignmentService: AssignmentService,
    private alertService: AlertService,
    private storageService: StorageService,
    private eventStream: EventStreamService,
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.storageService.get('account').id;
    this.approverStatusChange.emit();
    const dateformat = this.assignmentService.getDefaultDateFormat();
    this.currentDateFormat = `${dateformat} hh:mm:ss a z`;
  }

  public approveBudget(approval_chain_id: string) {
    this.subscrptions.push(this.assignmentService
      .approveAssignmentRequest(this.programId, this.assignmentId, PendingItemTypes.AdditionalBudget, false, approval_chain_id)
      .subscribe({
        next: (res) => {
          this.alertService.success('Request approved successfully');
          this.approverStatusChange.emit();
        },
        error: (err) => {
          this.alertService.error(err.message);
        }
      }
    ));
  }

  public rejectBudget(approval_chain_id: string) {
    this.isOpenReject = true;
    this.approvalChainId = approval_chain_id
    setTimeout( () => {
      this.eventStream.emit(new EmitEvent(Events.REJECT_BUDGET, true));
    });
  }

  public closeReject() {
    this.isOpenReject = false;
  }

  public rejectApprovalRequest({ value, type }) {
    value.approval_chain_id = this.approvalChainId;
    this.subscrptions.push(
      this.assignmentService
        .rejectAssignmentRequest(
          this.programId,
          this.assignmentId,
          value,
          type
        )
        .subscribe({
          next: () => {
            this.alertService.success('Request rejected successfully');
            this.approverReject.emit();
          },
          error: (err: any) => {
            this.alertService.error(err.message);
          }
        }
      ),
    );
  }

  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
}
