import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { AlertService } from '../../../../core/components/alert/alert.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Log } from 'src/app/library/logs/logs.model';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';

@Component({
  selector: 'app-approval-notes-history',
  templateUrl: './approval-notes-history.component.html',
  styleUrls: ['./approval-notes-history.component.scss'],
})
export class ApprovalNotesHistoryComponent implements OnInit, OnChanges {
  @Input() visiblity = 'hidden';
  @Input() approvalFor: any;
  @Input() jobDetail: any;
  @Input() approvalWorkflow: any;
  @Input() approvalId: any;
  @Input() isView = false;
  @Input() approvalHistory: any = [];
  @Input() superAdminEdit = false;
  @Input() isProgramAdmin: boolean = false;
  @Input() approvalChainId: string;
  @Input() isOfferApproval: boolean = false;
  @Input() isReassignedUser = false;
  @Input() sidebarTitle: string;
  @Output() onSubmit = new EventEmitter();
  @Output() onClose = new EventEmitter();

  public approval_reason: any;
  public approval_notes: any;
  public logs: Log = undefined;
  public rejectReasons = [];

  constructor(private alert: AlertService, private eventStreamService: EventStreamService, public reasonCodesService: ReasonCodesService) {}

  ngOnInit(): void {
    this.eventStreamService.on(Events.SHOW_OFFER_REJECT_LOGS).subscribe(data => {
      this.logs = data;
    });
    this.eventStreamService.on(Events.SHOW_JOB_REJECT_LOGS).subscribe(data => {
      this.logs = data;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.approvalFor?.currentValue && changes?.approvalFor?.currentValue === 'rejected') {
      this.getActionCodes(this.isOfferApproval ? 'REJECT_OFFER' : 'REJECT_JOB');
    }
  }

  sidebarClose() {
    this.approval_notes = '';
    this.approval_reason = null;
    this.visiblity = 'hidden';
    this.logs = undefined;
    this.onClose.emit();
  }

  submit() {
    this.logs = undefined;
    this.onSubmit.emit({
      approval_reason: this.approval_reason,
      approval_notes: this.approval_notes,
      approval_for: this.approvalFor,
      approval_id: this.approvalId,
      superAdminEdit: this.superAdminEdit,
      is_program_admin: this.isProgramAdmin,
      approval_chain_id: this.approvalChainId,
      is_reassigned_user: this.isReassignedUser
    });
    // this.sidebarClose();
    if (this.isOfferApproval) {
      if (this.approvalFor == 'approved') {
        this.alert.success('Offer is approved successfully');
      } else {
        this.alert.success('Offer is rejected successfully');
      }
      return;
    }

    if (this.approvalFor == 'approved') {
      this.alert.success('Job is approved successfully');
    } else {
      this.alert.success('Job is rejected successfully');
    }
  }

  getActionCodes(reasonCodeName: string) {
    if (!this.rejectReasons?.length) {
      this.reasonCodesService.getResoncodesFor(reasonCodeName).subscribe(
        data => {
          this.rejectReasons = data?.reason_codes.sort((r1, r2) => r1?.name?.localeCompare(r2?.name));
        },
        err => {
          this.alert.error('Unable to load the reasons list <br>' + err?.error?.error?.message);
        },
      );
    }
  }
}
