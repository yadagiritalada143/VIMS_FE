import { Component, OnInit, Input, OnChanges, Output, EventEmitter, OnDestroy } from '@angular/core';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms'
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service'
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
@Component({
  selector: 'app-opt-out-reason',
  templateUrl: './opt-out-reason.component.html',
  styleUrls: ['./opt-out-reason.component.scss']
})
export class OptOutReasonComponent implements OnInit, OnChanges, OnDestroy {
  private subscriptions = [];
  public closeSidebar = true;
  @Input() set _closeSidebar(data) {
    if (data) {
      this.closeSidebar = data;
      this.sidebarClose();
    }
  }
  @Output() optOutJob = new EventEmitter();
  optOutReasonList: any = [];
  optOutreason = "hidden";
  optOutForm: UntypedFormGroup;
  jobId: any;
  optOutData: any = [

  ];
  picklistId: any;
  currentProgram: any;
  logs: Log= undefined;
  constructor(
    private eventStream: EventStreamService,
    public fb: UntypedFormBuilder,
    public JobDetailsService: JobDetailsService,
    public alert: AlertService,
    public storageService: StorageService,
    public reasonCodesService: ReasonCodesService
  ) { }
  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.optOutForm = this.fb.group({
      reason: [null, Validators.required],
      notes: [null],
    })
    this.subscriptions.push(this.eventStream.on(Events.OPT_OUT_REASON).subscribe((data) => {
      if (data) {
        this.jobId = data.jobId;
        if (data) {
          this.optOutreason = "visible";
        }
        else {
          this.optOutreason = "hidden";
        }
      }

    }));
    this.eventStream.on(Events.SHOW_JOB_OPT_IN_OUT_LOGS).subscribe((data)=>{
          this.logs=data
    });
    this.getActionId();
  }
  getActionId() {
    // this.subscriptions.push(this.JobDetailsService.getOptoutAction(programID).subscribe(data => {
    //   if (data) {
    //     let actionId;
    //     data?.reason_code_actions?.forEach(m => {
    //       if (m.code === 'JOB_OPT_OUT') {
    //         actionId = m.id;
    //       }
    //     });
    //     if (actionId) {
    //       this.getPickListData(actionId);
    //     }
    //   }
    // }, (err) => {
    //   this.alert.error(errorHandler(err));
    // }));
    this.subscriptions.push(
      this.reasonCodesService.getResoncodesFor('JOB_OPT_OUT').subscribe(data => {
        this.optOutReasonList = data?.reason_codes.sort((r1, r2) => r1.name.localeCompare(r2.name));
      })
    )
  }

  // getPickListData(actionId) {
  //   const programID = this.currentProgram?.id;
  //   this.subscriptions.push(this.JobDetailsService.getOptOutReason(programID, actionId).subscribe(data => {
  //     if (data) {
  //       this.optOutReasonList = data.reason_codes;
  //     }
  //   }, (err) => {

  //     this.alert.error(errorHandler(err));
  //   }));
  // }

  optOutPickList() {
    this.logs=undefined;
    if (this.optOutForm.valid) {
      let rejectCandidate = this.optOutForm.value;
      const payload = {
        opt_option: "opt_out",
        reason: rejectCandidate?.reason,
        notes: rejectCandidate?.notes || '',
      }
      this.optOutJob.emit(payload)
    } else {
      // this.alert.error('Please select reason for opt-Out')
      this.showError('Please select reason for opt-Out');
    }
  }

  ngOnChanges() {
    if (this.closeSidebar) {
      this.optOutForm?.reset();
      this.sidebarClose();
    }
  }

  sidebarClose() {
    this.optOutForm?.reset();
    this.optOutreason = "hidden";
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
  showError(err){
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo:{trace_id: err?.error?.trace_id } 
    };
      err?.error?.error?.errors?.forEach(msg => {      
        if (msg?.message) {      
          this.logs.messages.push(msg?.message);
        }
      });
  }
}
