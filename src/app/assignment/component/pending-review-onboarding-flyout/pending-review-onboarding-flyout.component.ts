import { Component, OnInit, Input, OnDestroy, OnChanges ,SimpleChanges } from '@angular/core';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AssignmentService } from '../../assignment.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Subscription } from 'rxjs';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
@Component({
  selector: 'app-pending-review-onboarding-flyout',
  templateUrl: './pending-review-onboarding-flyout.component.html',
  styleUrls: ['./pending-review-onboarding-flyout.component.scss']
})
export class PendingReviewOnboardingFlyoutComponent implements OnInit, OnDestroy , OnChanges {
  private subscriptions: Subscription[] = [];
  sidebarVisibility = 'hidden';
  candidateId: '';
  public onboardingForm: UntypedFormGroup;
  title: string = 'Withdrawal Reason';
  label: string = 'Withdrawal Reason';
  btnLabel: string = 'Withdraw';
  currentProgram: any;
  loading: boolean = false;
  optPickListData: any = [];
  logs: Log = undefined;
  uploadJD = {};
  onBoardingReview: any;
  newUploadfileArr = [];
  assignmentId;
  taskCompleted : any;
  @Input() tasksCompleted ;
  isValidFileSize: boolean = true;
  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private assignmentService: AssignmentService,
    private alert: AlertService,
    private storageService: StorageService,
    private reasonCodesService: ReasonCodesService
  ) { }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.onboardingForm = this.fb.group({
      reason: [null, Validators.required],
      notes: [null, '']
    });
    this.subscriptions.push(this.eventStream.on(Events.REVIEW_ONBOARDING).subscribe((data) => {
      if (data.value) {
        this.title = 'Onboarding Review';
        this.label = this.taskCompleted ?  `Onboarding Review Reason` : `Onboarding Override Reason`;
        this.btnLabel = 'Submit';
        this.sidebarVisibility = 'visible';
        this.onBoardingReview = true;
        this.updateValidators(this.onboardingForm);
        this.candidateId = data?.candId;
        this.assignmentId = data?.assignmentId;
        this.reasonCodesService.getResoncodesFor(this.taskCompleted ?'ONBOARDING_REVIEW_REASON' : 'ONBOARDING_OVERRIDE_REASON').subscribe(a => {
          this.optPickListData = a?.reason_codes;
        });
      } else {
        this.sidebarVisibility = 'hidden';
      }
    }));
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.taskCompleted = changes?.tasksCompleted?.currentValue;
  } 

  uploadFiles(event) {
    let filedata = [];
    if (event) {
      event.forEach(element => {
        filedata.push({
          filename: element?.name,
          raw: element?.raw,
          ext: element?.ext,
          size: element?.size?.toString(),
          type: "ONBOARDING_REVIEW_DOCUMENT",
        })
      });
      if (filedata) {
        Object.assign(this.uploadJD, { files: filedata });
      }
    }
  }

  sidebarClose() {
    this.onboardingForm.reset();
    this.sidebarVisibility = 'hidden';
    this.onBoardingReview = false;
    this.logs = undefined;
    this.newUploadfileArr = [];
    this.loading = false;
  }

  submit() {
    this.loading = true;
    this.logs = undefined;
    if (this.onBoardingReview) {
      let onboardingData = this.onboardingForm.value;
      let dateTime = new Date();
      const payload = {
        status: "REVIEWED",
        status_reason: onboardingData.reason,
        status_note: onboardingData.notes,
        final_files_dict: this.uploadJD,
        time: dateTime.getTime(),
      }
      let url = `/submission-manager/programs/${this.currentProgram?.id}/assignments/${this.assignmentId}/candidates/${this.candidateId}/onboardingreview`;
      this.subscriptions.push(this.assignmentService.put(url, payload).subscribe({
        next: (res) => {
          this.sidebarClose();
          this.alert.success("Onboarding Reviewed Successfully.");
          this.eventStream.emit(new EmitEvent(Events.RELOAD_ONBOARDING, true));
        },
        error: (err) => {
          this.showError(err);
          this.loading = false;
        }
      }
      ))
    };
  }

  public updateValidators(form: UntypedFormGroup) {
    for (const key in form.controls) {
      if (key === 'reason') {
        form.get(key).setValidators([Validators.required]);
      }
      form.get(key).updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  showError(err) {
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.message ?? err?.error?.error?.message ?? (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }
  isValidFile($event) {
    this.isValidFileSize = $event;
  }
}

