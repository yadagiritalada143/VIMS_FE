import { Component, OnDestroy, OnInit } from '@angular/core';
import { TimesheetService } from '../timesheet.service';
import { AlertService } from '../../core/components/alert/alert.service';
import { ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { StorageService } from 'src/app/core/services/storage.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { TimesheetConstants, TimesheetStatus } from '../timesheet.enums';
import { Subscription } from 'rxjs';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-timesheet-reject',
  templateUrl: './timesheet-reject.component.html',
  styleUrls: ['./timesheet-reject.component.scss']
})
export class TimesheetRejectComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  timesheetReject = "hidden";
  timesheetId;
  public actionForm: UntypedFormGroup;
  currentAction;
  actionTitle;
  panelTitle;
  reasonList;
  userDetails;
  timesheetData;
  // approvalId;
  isSubmitted: boolean = false;
  logs: Log = undefined;

  constructor(
    private eventStream: EventStreamService,
    private timesheetService: TimesheetService,
    private alert: AlertService,
    private route: ActivatedRoute,
    private fb: UntypedFormBuilder,
    private storageService: StorageService,
    private resonCodesService: ReasonCodesService
  ) { }

  ngOnInit(): void {
    this.timesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
    this.timesheetId = this.route.snapshot.queryParams['timesheetId'] || this.timesheetData?.timesheet_uuid || this.timesheetData?.timesheet_id;
    this.userDetails = this.storageService.get('user');
    this.subscriptions.push(this.eventStream.on(Events.TIMESHEET_REJECT).subscribe((data) => {
      if (data.value) {
        this.logs = undefined;
        this.currentAction = data.action;
        if (this.currentAction?.toLowerCase() == TimesheetStatus.REJECTED) {
          this.actionTitle = 'Rejection';
          this.panelTitle = 'Reject Timesheet';
          this.timesheetReject = 'visible';
        }
      } else {
        this.timesheetReject = 'hidden';
      }
    }));
    this.actionForm = this.fb.group({
      reason: [null, Validators.required],
      notes: [null]
    });
    this.getReasonCodeActions();
    if (!this.userDetails.is_candidate && !this.userDetails.is_superuser) {
      this.getUserRole();
    }

    // Commented because this is handle by timesheet backend
    // if (this.timesheetId) {
    //   this.getApprovals();
    // }
  }
  sidebarClose() {
    this.timesheetReject = "hidden";
    this.actionForm.reset();
  }

  formatDate(date) {
    var d = date || new Date(),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();
    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;
    return [year, month, day].join('-');
  }

  actionTimesheet() {
    this.logs = undefined;
    let form = this.actionForm.value;
    const payload = {
      action: TimesheetStatus.REJECTED?.toUpperCase(),
      reason: form.reason,
      note: form.notes,
      // approval_chain_id: approvalId
    }
    if (this.actionForm.valid) {
      this.isSubmitted = true;
      this.subscriptions.push(this.timesheetService.updateTimesheetApprovalStatus(this.timesheetId, payload).subscribe(
        {
          next: (data: any) => {
            if (data) {
              this.alert.success(`Timesheet rejected successfully.`);
              this.eventStream.emit(
                new EmitEvent(Events.APPROVAL_ACTION, {
                  value: true
                }),
              );
              let timesheetData = this.storageService.get('timeSheetData');
              timesheetData.status = TimesheetStatus.REJECTED;
              this.storageService.set(TimesheetConstants.TIMESHEET, timesheetData, true);
              this.timesheetReject = 'hidden';
              this.timesheetData.status = TimesheetStatus.REJECTED;
              this.eventStream.emit(new EmitEvent(Events.TIMESHEET_REJECT, { show: true }));

            }
          }, error: (err) => {
            //if(err?.error?.error?.errors?.length>0 && err?.error?.error?.errors[0]?.message){
            //  this.alert.error(err?.error?.error?.errors[0]?.message);
            //} else if(err?.error?.error?.non_field_errors?.length){
            //  this.alert.error(err?.error?.error?.non_field_errors[0]);
            //}else if(err?.error?.error){
            //  this.alert.error(err?.error?.error);
            //}else {
            //  this.alert.error(errorHandler(err));
            //}
            this.showError(err);
            this.isSubmitted = false;
          }
        }
      ));
    } else {
      // this.alert.error('Please fill the required details.');
      this.logs = {
        type: LOG_TYPE.ERROR, heading: 'Please fill the required details.', messages: [], autoClose: true, isShown: true
      };

    }

  }

  getReasonCodeActions() {
    this.subscriptions.push(
      this.resonCodesService.getResoncodesFor('REJECT_TIMESHEET').subscribe(data => {
        this.reasonList = data.reason_codes;
      })
    )
    // this.subscriptions.push(this.timesheetService.getReasonCodeActions().subscribe(data =>{
    //   if(data){
    //     const reasonList = data.reason_code_actions;
    //     reasonList?.forEach(reason => {
    //       if(reason?.code === "REJECT_TIMESHEET"){
    //           this.getReasonCodes(reason?.id);
    //       }
    //     });
    //   }
    // }, (err) => {
    //   // this.alert.error(errorHandler(err));
    // }));
  }

  // getReasonCodes(reasonId){
  //   this.subscriptions.push(this.timesheetService.getReasonCodes(reasonId).subscribe(data =>{
  //     if(data){
  //       this.reasonList = data.reason_codes;
  //     }
  //   }, (err) => {
  //     // this.alert.error(errorHandler(err));
  //   }));
  // }
  getUserRole() {
    this.subscriptions.push(this.timesheetService.getUserRole().subscribe((data: any) => {
      if (data) {
        let userData = data.member;
        this.userDetails['role'] = userData.organization?.category.toLowerCase(),
          this.userDetails['supervisor_id'] = userData.supervisor_id;
      }
    }));
  }

  // getApprovals() {
  //   this.subscriptions.push(this.timesheetService.getApproval(this.timesheetId, TimesheetStatus.PENDING).subscribe((data: any) => {
  //     if (data && data?.approvers?.length > 0) {
  //       this.approvalId = data?.approvers[0]?.approval_chain_id;
  //     }
  //   }));
  // }
  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
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
