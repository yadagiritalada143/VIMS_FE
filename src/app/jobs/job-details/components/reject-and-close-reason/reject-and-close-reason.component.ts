import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { JobDetailsService } from '../../job-details.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Router, ActivatedRoute } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';

@Component({
  selector: 'app-reject-and-close-reason',
  templateUrl: './reject-and-close-reason.component.html',
  styleUrls: ['./reject-and-close-reason.component.scss'],
})
export class RejectAndCloseReasonComponent implements OnInit {
  @Input() action: any;

  public closeJobForm: UntypedFormGroup;
  public candidateWithdrwanReason = {};
  private subscriptions = [];

  rejectAndClose = 'hidden';
  jobId: '';
  title: string = 'Close Reason';
  label: string = 'Close Reason';
  btnLabel: string = 'Confirm';
  currentProgram: any;
  reasonList: any = [];

  @Output() onRejectAndCloseJob = new EventEmitter();
  @Output() closeAction = new EventEmitter();
  @Input() jobData;
  isJobDistributed: boolean = false;
  jobDistributionCheck: boolean = false;
  isBtnDisabled: boolean = false;

  constructor(
    private fb: UntypedFormBuilder,
    private jobService: JobDetailsService,
    private alert: AlertService,
    private router: Router,
    private storageService: StorageService,
    private route: ActivatedRoute,
    public reasonCodesService: ReasonCodesService,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.jobId = this.route.snapshot.params['id'];
    this.action = this.route.snapshot.queryParams['action'];
    this.actionChanges(this.action);
    this.closeJobForm = this.fb.group({
      reason: [null, Validators.required],
      notes: [null],
      hidenotes:[true],
    });
    if (this.jobData?.status?.toLowerCase() == "hold") {
      this.jobDistributionCheck = true;
      this.checkJobDistribution();
    }
  }

  ngOnChanges() {
    this.actionChanges(this.action);
    this.closeJobForm?.get('hidenotes')?.setValue(true);
    if (!this.jobDistributionCheck && this.jobData?.status?.toLowerCase() == "hold") {
      this.jobDistributionCheck = true;
      this.checkJobDistribution();
    }
  }

  actionChanges(action): void {
    if (action == 'close') {
      this.title = 'Close Reason';
      this.label = 'Close Reason';
      this.getActionId('JOB_CLOSE');
    } else if (action == 'hold') {
      this.title = 'Hold Reason';
      this.label = 'Hold Reason';
    } else if (action == 'halted') {
      this.title = 'Halted Reason';
      this.label = 'Halted Reason';
    }
    if (action == 'close' || action == 'hold' || action == 'halted') {
      this.btnLabel = 'Confirm';
      this.rejectAndClose = 'visible';
    }
  }

  getActionId(reasonCodeName) {
    this.subscriptions.push(
      this.reasonCodesService.getResoncodesFor(reasonCodeName).subscribe(
        (data: any) => {
          this.reasonList = data?.reason_codes.sort((r1, r2) => r1.name.localeCompare(r2.name));
        },
        err => {
          this.alert.error('Unable to load the reasons list <br>' + err?.error?.error?.message);
        },
      ),
    );
  }

  sidebarClose() {
    this.closeJobForm.reset();
    this.rejectAndClose = 'hidden';
    this.router.navigate(['/jobs/details/job-details', this.jobId], { queryParams: {} });
    this.closeAction.emit('');
  }

  changeJobStatus() {
    let closeFormData = this.closeJobForm.value;
    if (this.action == 'close') {
      const payload = {
        status_reason: closeFormData?.reason?.name,
        reason_notes: closeFormData?.notes,
        status: 'closed',
        hide_notes_vendor: this.isValidStatus() ?  closeFormData?.hidenotes : null
      };
      this.isBtnDisabled = true;
      this.jobService.jobStatusUpdate(payload, this.jobId).subscribe({
        next: (data: any) => {
          if (data.message) {
            this.closeJobForm.reset();
            this.sidebarClose();
            this.alert.success('Job Closed Successfully');
            this.router.navigate(['/jobs/details/job-details', this.jobId], { queryParams: {} });
            this.onRejectAndCloseJob.emit(true);
            this.isBtnDisabled = false;
          }
        },
        error: err => {
          this.isBtnDisabled = false;
          this.alert.error(errorHandler(err));
        },
    });
    } else {
      let payload;
      if (this.action == 'halted') {
        payload = {
          status_reason: closeFormData?.reason?.name,
          status: 'halted',
        };
      } else if (this.action == 'hold') {
        payload = {
          status_reason: closeFormData?.reason?.name,
          status: 'hold',
        };
      }
      const url = `/job-manager/programs/${this.currentProgram.id}/jobs/${this.jobId}`;
      this.jobService.put(url, payload).subscribe({
        next: (data: any) => {
          if (data.message) {
            if (data.message) {
              this.closeJobForm.reset();
              this.sidebarClose();
              if (this.action == 'halted') {
                this.alert.success('Job Halted Successfully');
              } else {
                this.alert.success('Job Hold Successfully');
              }
              this.router.navigate(['/jobs/details/job-details', this.jobId], { queryParams: {} });
              this.onRejectAndCloseJob.emit(true);
            }
          }
        },
       error: err => {
          this.alert.error(errorHandler(err));
        },
    });
    }
  }

  checkJobDistribution() {
    this.loaderService.show()
    const url = `/job-manager/programs/${this.currentProgram?.id}/job_distribution?job__id=${this.jobId}&size=${10}&page=${1}`;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
        if (data?.results?.length > 0) {
          this.isJobDistributed = true;
        }
        this.loaderService.hide()
      },
      error: () => {
        this.loaderService.hide();
      }
    })
  }

  isValidStatus() {
    return this.isJobDistributed && this.jobData?.status?.toLowerCase() == "hold";
  }
}
