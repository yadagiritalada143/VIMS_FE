import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { JobDetailsService } from '../../job-details.service';
import { errorHandler } from '../../../../shared/util/error-handler';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ApprovalStatus } from './../../../../shared/enums';
import { Validators, UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';

@Component({
  selector: 'app-pending-approval-request',
  templateUrl: './pending-approval-request.component.html',
  styleUrls: ['./pending-approval-request.component.scss']
})
export class PendingApprovalRequestComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  @Output() reloadPage = new EventEmitter();
  approveForm: UntypedFormGroup;
  submittedA = false;
  rejectForm: UntypedFormGroup;
  submittedR = false;
  approvalSidebar = "hidden";
  jobData;
  approvalWorkflowList: any = [];
  user: any;
  isShowAction: boolean = false;
  isStatus: boolean = false;
  rejectReason: boolean = false;
  approveReason: boolean = false;
  reason: any = {};
  approvedStatusEnum: any = ApprovalStatus;
  index: any;
  requiredReason: boolean = false;
  public jobByStatus: any = [];
  public entity_id: any;
  public approval_id: any;

  constructor(
    private fb: UntypedFormBuilder,
    private eventStream: EventStreamService,
    private jobService: JobDetailsService,
    private alertService: AlertService) { }

  get approveFormControl() {
    return this.approveForm.controls;
  }
  get rejectFormControl() {
    return this.rejectForm.controls;
  }
  ngOnInit(): void {
    this.approveForm = this.fb.group({
      reason_1: [''],
      reason_2: ['']
    });
    this.rejectForm = this.fb.group({
      reason_1: ['', Validators.required],
      reason_2: ['', [Validators.required]]
    });

    this.rejectReason = false;
    this.approveReason = false;
    this.index = undefined
    this.user = JSON.parse(localStorage.getItem('user'));
    this.subscriptions.push(this.eventStream.on(Events.PENDING_APPROVAL_REQUEST).subscribe( (data) => {
      if (data.value) {
        this.approvalSidebar = 'visible';
        this.jobData = data.data; 
        if (this.user?.id && this.jobData?.id) {
          this.getJobByStatus();
        }

      } else {
        this.approvalSidebar = 'hidden';
      }
    }));

  }

  getJobByStatus() {
    if (this.user.id) {
      this.subscriptions.push(this.jobService.getJobsBy(`${this.user?.id}`, `${this.jobData?.id}`).subscribe({
        next: (data: any) => {
        if (data.data) {
          this.jobByStatus = data.data;
          this.approval_id = this.jobByStatus[0]?.id;
          this.entity_id = this.jobByStatus[0]?.approval_entity?.id;
          if (this.entity_id) {
            this.getApproverByEntity();
          }
        }
      }, 
      error: (err) => {
        this.alertService.error(errorHandler(err));
      }}));
    }
  }
  getApproverByEntity() {
    if (this.entity_id) {
      this.subscriptions.push(this.jobService.getByEntityID(`${this.entity_id}`).subscribe({
        next: (data: any) => {
        if (data) {
          this.approvalWorkflowList = data;
          function compare(a, b) {
            const A = a.sequence_number;
            const B = b.sequence_number;
            let comparison = 0;
            if (A > B) {
              comparison = 1;
            } else if (A < B) {
              comparison = -1;
            }
            return comparison;
          }
          this.approvalWorkflowList?.approvals.sort(compare);
          this.approvalWorkflowList.approvals.map((m, i) => {
            if (m.approver.id == this.user.id && m.status == ApprovalStatus.pending) {
              if (i == 0) {
                this.isShowAction = true;
              } else {
                if (this.approvalWorkflowList.approvals[i - 1].status == 'approved') {
                  this.isShowAction = true;
                } else {
                  this.isShowAction = false;
                }
              }
            }
          })
        }
      },
      error: (err) => {
        this.alertService.error(errorHandler(err));
      }}));
    }
  }
  openReason(status, i) {
    if (status == ApprovalStatus.approved) {
      this.approveReason = true;
      this.index = i;
    } else if (status == ApprovalStatus.rejected) {
      this.rejectReason = true;
      this.index = i;
    }
  }

  approvedStatus(status) {
    let payLoad;
    this.submittedA = true;
    // if (this.rejectForm.valid) {
    if (status == ApprovalStatus.approved) {
      payLoad = {
        status: ApprovalStatus.approved,
        reason_1: this.approveForm.value.reason_1,
        reason_2: this.approveForm.value.reason_2
      }
      if (this.approval_id) {
        this.subscriptions.push(this.jobService.updateStatus(`${this.approval_id}`, payLoad).subscribe({
          next: (data:any) => {
          this.alertService.success('You have successfully approved the job.');
          this.submittedA = false;
          this.sidebarClose();
          this.approveForm.reset();
          this.approveReason = false;
          this.index = undefined
          this.reloadPage.emit(true);
        }, 
        error: (err) => {
          this.alertService.error(errorHandler(err));
        }}));
      }
    }
    // }  
  }
  rejectStatus(status) {
    let payLoad;
    this.submittedR = true;
    if (this.rejectForm.valid) {
      if (status == ApprovalStatus.rejected) {
        payLoad = {
          status: ApprovalStatus.rejected,
          reason_1: this.rejectForm.value.reason_1,
          reason_2: this.rejectForm.value.reason_2
        }
        if (this.approval_id) {
          this.subscriptions.push(this.jobService.updateStatus(`${this.approval_id}`, payLoad).subscribe({
            next: (data:any) => {
            this.alertService.warn('You have rejected this job.');
            this.sidebarClose();
            this.submittedR = false;
            this.rejectForm.reset();
            this.rejectReason = false;
            this.index = undefined
            this.reloadPage.emit(true);
          },
          error: (err) => {
            this.alertService.error(errorHandler(err));
          }}));
        }
      }
    } else {
      this.alertService.error('Reason is must for reject');
    }

  }
  sidebarClose() {
    this.approvalSidebar = 'hidden';
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
