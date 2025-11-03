import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import {
  EventStreamService,
  Events,
  EmitEvent,
} from 'src/app/core/services/event-stream.service';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { JobDetailsService } from '../../job-details.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ActivatedRoute } from '@angular/router';
import {
  StorageKeys,
  StorageService,
} from 'src/app/core/services/storage.service';
import { Subscription } from 'rxjs';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model';
@Component({
  selector: 'app-approve-rehire-candidate',
  templateUrl: './approve-rehire-candidate.component.html',
  styleUrls: ['./approve-rehire-candidate.component.scss']
})
export class ApproveRehireCandidateComponent implements OnInit , OnDestroy {
  private subscriptions: Subscription[] = [];
  withdrawSidebar = 'hidden';
  candidateId: '';
  jobId: '';
  public withdrawForm: UntypedFormGroup;
  title: string = 'Rehire Reject Reason';
  label: string = 'Rehire Reject Reason';
  btnLabel: string = 'Submit';
  isRejectCandidate: boolean = false;
  currentProgram: any;
  acceptCandidate:boolean=false;
  programId:'';
  loading: boolean = false;
  rejectReasons = [];
  @Input() submissionId:any;
  @Output() onWithdrawnCandidate = new EventEmitter();
  @Output() getCandidateData = new EventEmitter();
  @Output() onActionSuccess = new EventEmitter();
  optPickListData: any = [];
  withdrawOffer;
  logs: Log= undefined;
  approvalChainId:any;
  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private jobService: JobDetailsService,
    private alert: AlertService,
    private ActivatedRoute: ActivatedRoute,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private reasonCodesService: ReasonCodesService
  ) { }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.jobId = this.route.snapshot.params['id'];
    this.withdrawForm = this.fb.group({
      reason: [null,Validators.required],
      notes: [null, ''],
    });

    this.subscriptions.push(this.eventStream.on(Events.REHIRE_APPROVE).subscribe((data) => {
      if (data.value) {
        this.title = 'Approve Rehire Check';
        this.acceptCandidate=true;
        this.btnLabel = 'approve';
        this.programId=data?.progId;
        this.withdrawSidebar = 'visible';
        this.candidateId = data?.candidateId;
        this.submissionId=data?.subId;
        this.jobId = data?.jobId ? data?.jobId : this.ActivatedRoute.snapshot.params['id'];
        this.withdrawForm.controls.reason.setValidators([]);
        this.withdrawForm.controls.reason.setErrors(null);
        this.approvalChainId = data?.approval_chain_id;
        // this.withdrawForm.controls.reason.setErrors(null);
      } else {
        this.withdrawSidebar = 'hidden';
        this.withdrawForm.controls.reason.setValidators([Validators.required]);
      }
    }));


    this.subscriptions.push(this.eventStream.on(Events.REHIRE_REJECT).subscribe((data) => {
      if (data.value) {
        this.title = 'Reject Rehire Check';
        this.label = 'Reason for Rejection';
        this.btnLabel = 'Submit';
        this.withdrawSidebar = 'visible';
        this.programId=data?.progId;
        this.isRejectCandidate = true;
        this.candidateId = data?.candidateId;
        this.submissionId=data?.subId;
        this.jobId = data?.jobId ? data?.jobId : this.ActivatedRoute.snapshot.params['id'];
        this.reasonCodesService.getResoncodesFor('REHIRE_REJECT_CANDIDATE').subscribe({
          next: (data: any) => {
            this.rejectReasons = data.reason_codes;
          }, error: (res)=> {
            this.showError(res);
          }
        });
        this.updateValidators(this.withdrawForm);
        this.approvalChainId = data?.approval_chain_id;
      } else {
        this.withdrawSidebar = 'hidden';
      }
    }));

  }
  sidebarClose() {
    this.withdrawForm.reset();
    this.isRejectCandidate = false;
    this.withdrawSidebar = 'hidden';
    this.acceptCandidate=false;
    this.logs=undefined;
  }

  withdrawCandidate() {
    this.loading = true;
    this.logs=undefined;
    if (this.isRejectCandidate)
        {
        let rejectCandidate = this.withdrawForm.value;
        // PUT /approval/programs/<PROGRAM_ID>/<ENTITY_REF>/<ENTITY_ID>/approval-request
        let payload={
          status: "REJECTED",
          status_reason: rejectCandidate.reason,
          status_note:rejectCandidate.notes,
          is_forced_approval: true,
          workflow_action: "DEFAULT",
          approval_chain_id: this.approvalChainId
        }
        let url1=`/approval/programs/${ this.programId}/SUBMISSIONS/${this.submissionId}/approval-request`;
        this.subscriptions.push(this.jobService.put(url1,payload).subscribe({
          next: (data: any) => {
              this.getCandidateData.emit(true);
              this.withdrawForm.reset();
              this.sidebarClose();
              this.alert.success('Rehire Candidate rejected successfully');
              this.loading=false;
              this.onActionSuccess.emit({ action: 'Reject_candidate' });
              this.eventStream.emit(new EmitEvent(Events.RELOAD_REHIRECANDIDATE_DETAIL, true));
          },
          error: (err) => {
            this.loading = false;
            // this.alert.error(errorHandler(err));
            this.showError(err);
          }}
        ));
      }
    else if (this.acceptCandidate) {
      const approveCandidate = this.withdrawForm.value
      const payload = {
        status: "APPROVED",
        is_forced_approval: false,
        workflow_action: "DEFAULT",
        approval_chain_id: this.approvalChainId,
        status_note:approveCandidate.notes,
      };
      let url1=`/approval/programs/${ this.programId}/SUBMISSIONS/${this.submissionId}/approval-request`;
      this.subscriptions.push(this.jobService.put(url1,payload).subscribe({
       next: (data: any) => {
            this.getCandidateData.emit(true);
            this.withdrawForm.reset();
            this.sidebarClose();
            this.alert.success('Rehire Candidate Approved');
            this.loading = false;
            this.eventStream.emit(new EmitEvent(Events.RELOAD_REHIRECANDIDATE_DETAIL, true));
        },
        error: (err) => {
          this.loading = false;
          // this.alert.error(errorHandler(err));
          this.showError(err);
        }}
      ));
    }
  }
  public updateValidators(form: UntypedFormGroup) {
    for (const key in form.controls) {
      if (key === 'reason') {
        form.get(key).setValidators([Validators.required]);
      }
      form.get(key).updateValueAndValidity();
    }
  }

  showError(err) {
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

}

