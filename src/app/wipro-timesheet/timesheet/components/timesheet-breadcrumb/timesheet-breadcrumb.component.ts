import { Component, Input, OnInit, Output, EventEmitter, OnDestroy, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { AlertService } from '../../../../core/components/alert/alert.service';
import { TimesheetService } from '../../../timesheet.service';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { TimesheetConstants, TimesheetStatus, TimesheetType } from '../../../timesheet.enums';
import { getDateFromString } from '../../../timesheet.utils';
import { Subscription } from 'rxjs';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';

@Component({
  selector: 'app-timesheet-breadcrumb',
  templateUrl: './timesheet-breadcrumb.component.html',
  styleUrls: ['./timesheet-breadcrumb.component.scss']
})
export class HourlyTimesheetBreadcrumbComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  @Input() isSubmitSheet;
  @Input() calendar;
  @Input() timeSheet;
  @Input() isTimesheetEnabled;
  isNeedCreate: boolean = false;
  isAuthorizedToCreate: boolean = false;
  is_assignment_closed: boolean = false;
  showSaveButton: boolean = true;
  @Output() onPrint = new EventEmitter();
  @Output() onClickedApprovalAction = new EventEmitter();
  public _config: any;
  currentProgram: any;
  // approvalChainId: any;
  @Input() set config(data) {
    if (data) {
      this._config = data;
    }
  };
  @Input() set is_need_create(isNeedCreate: boolean) {
    this.isNeedCreate = isNeedCreate;
    this.isAllowAction();
  };
  @Input() set isAssignmentClosed(isAssignmentClosed: boolean) {
    this.is_assignment_closed = isAssignmentClosed;
    this.isAllowAction();
  }
  @Output() action = new EventEmitter();
  timesheetData;
  userDetails;
  // showActionBtn:boolean = false;
  // approvalId;
  timesheetStatuses = TimesheetStatus;
  disableApprovalButton: boolean = false;
  timesheetId: string = undefined;
  @Output() onSave = new EventEmitter();
  @Input() disableButton: boolean = false;
  user_type: any;
  isLock = false;
  isDisabledButtons: any;
  buttonDropdown: boolean = false;
  @ViewChild('breadcrumbDropdownTrigger', {read: ElementRef, static: false}) breadcrumbDropdownTrigger : ElementRef;
  approvalOption: boolean = false;
  constructor(
    private eventStream: EventStreamService,
    private timesheetService: TimesheetService,
    private alert: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private storageService: StorageService, private datePipe: LocalDateFormatPipe,
    private confirmService: ConfirmationDialogService,
    private render : Renderer2
  ) {
    this.render.listen('window', 'click', (e: Event) => {
      if ((this.breadcrumbDropdownTrigger && this.breadcrumbDropdownTrigger.nativeElement.contains(e.target))) {
        this.buttonDropdown = true;
      } else {
        this.buttonDropdown = false;
      }
    });
   }

  ngOnInit(): void {
    this.initializeComponent();
  }
  private initializeComponent() {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.user_type = this.storageService.get('user_type')?.toLowerCase();
    this.timesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
    this.userDetails = this.storageService.get(StorageKeys.CURRENT_USER);
    this.timesheetId = this.route.snapshot.queryParams['timesheetId'] || this.timesheetData?.timesheet_uuid || this.timesheetData?.timesheet_id;
    if (this.timesheetId) {
      // this.getApprovals();
    }
    this.getUserRole();
    this.subscriptions.push(this.eventStream.on(Events.TIMESHEET_ACTION_FLYOUT).subscribe((data) => {
      if (data?.reloadCalendar) {
        this.isAllowAction();
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.TIMESHEET_REJECT).subscribe((data) => {
      if (data.show) {
        // this.showActionBtn = false;
        this.disableApprovalButton = false;
        this.router.navigate([`/timesheet/list/${TimesheetStatus.REJECTED}`]);
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.UPDATE_CURRENT_TIMESHEET_DETAILS).subscribe((data) => {
      this.timesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
      this.timesheetId = this.route?.snapshot?.queryParams['timesheetId'] || this.timesheetData?.timesheet_uuid || this.timesheetData?.timesheet_id;
      this.checkLayoutType();
      if (data?.timesheet) {
        // this.infoDetails= data.timesheetInfoDetails;
        this.timeSheet = data?.timesheet;
        this.isDisabledButtons = this.timeSheet?.data?.actions_allow?.attributes?.disabled?.is_allow;
        this.isAllowAction();
        //if (!this.timesheetData?.status) {
          this.timesheetData.status = this.timeSheet?.data?.status;
        //}
        /*  if(this.approvalId){
           if(this.timeSheet?.data?.timesheet_manager?.id == this.userDetails?.id && this.timesheetId && this.timeSheet?.data?.status?.toLowerCase() == TimesheetStatus.PENDING &&   this.approvalId == this.userDetails?.id){
             this.showActionBtn = true;
           }
         }else{
           this.getApprovals();
         }   */
      }
    }));
    this.checkLayoutType();
    // this.getAssignmentLockStatus();

  }

  // getAssignmentLockStatus(){
  //   this.timesheetService.getAssignmentLockStatus(this.timesheetData.assignment_id || this.timesheetData.assignment_uuid).subscribe((data:any) => {
  //     this.isLock = true;
  //     if(this?.isLock){
  //       this.showError(data?.message);
  //     }
  //   });
  // }

  print() {
    this.onPrint.emit({ isPrint: true });
  }
  checkLayoutType() {
    if (this.timesheetData?.meta_data?.layout?.duration === TimesheetType.MONTHLY) {
      this.showSaveButton = false;
    }
  }

  isAllowAction() {
    this.isAuthorizedToCreate = (this.timesheetService.isAuthorizedToCreate(this.isNeedCreate, this.timeSheet?.data?.actions_allow?.can_save) && !this.is_assignment_closed);
  }

  getFormattedTime(date) {
    date = date.split(' ');
    let formattedTime = '';
    if (date?.length > 1) {
      var onlyTime = date[1];
      var time = onlyTime?.split(':');
      if (time?.length > 1) {
        var allTime = time[0]?.concat(':', ...time[1]);
        formattedTime = this.getTime(allTime);
      }
    }
    return formattedTime;
  }

  getTime(time) {
    time = time?.toString()?.match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
    if (time?.length > 1) {
      time = time.slice(1);
      time[5] = +time[0] < 12 ? ' AM' : ' PM';
      time[0] = +time[0] % 12 || 12;
    } return time.join('');
  }

  getFormattedDate(date) {
    const formatted_date = getDateFromString(date);
    return this.datePipe.transform(formatted_date, '', '', '', true);
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
openApprovalOPtion(){
  if(this.timeSheet?.data?.actions_allow?.can_perform_workflow){
    this.approvalOption = true;
  } else{
    this.approveTimesheet();
  }
  

}
  approveTimesheet(approvalType?:any) {
    let is_forced_approval = false;
    if(approvalType == 'entire'){
      is_forced_approval= true
    }
    this.timesheetService.emitLogs(undefined);
    const payload = {
      action: TimesheetStatus.APPROVED?.toUpperCase(),
      reason: null,
      note: null,
      is_forced_approval:is_forced_approval
      // status: TimesheetStatus.APPROVED?.toUpperCase(),
      // status_reason: null,
      // status_note: null,
      // assignment_id: this.timesheetData.assignment_id || this.timesheetData.assignment_uuid,
      // approval_chain_id: approvalChainId
    }
    this.confirmService.confirm('', `Are you sure you want to approve the timesheet?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.disableApprovalButton = true;
          this.subscriptions.push(this.timesheetService.updateTimesheetApprovalStatus(this.timesheetId, payload).subscribe(
            {
              next: data => {
                this.disableApprovalButton = false;
                this.onClickedApprovalAction.emit(true);
                if (data) {
                  this.alert.success(`Timesheet approved successfully.`);
                  let timesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
                  // timesheetData.status = TimesheetStatus.APPROVED;
                  this.storageService.set(TimesheetConstants.TIMESHEET, timesheetData, true);
                  this.eventStream.emit(new EmitEvent(Events.TIMESHEET_REJECT, { value: false }));
                  // this.timesheetData.status = TimesheetStatus.APPROVED;
                  // this.showActionBtn = false;
                  this.initializeComponent();
                  this.eventStream.emit(
                    new EmitEvent(Events.APPROVAL_ACTION, {
                      value: true
                    }),
                  );
                  if (!this.currentProgram?.config?.multiple_approval_timesheet_expense) {
                    this.router.navigate([`/timesheet/list/${TimesheetStatus.APPROVED}`]);
                  }
                }
              }, error: (err) => {
                this.disableApprovalButton = false;
                this.showError(err);
                //if (err?.error?.error?.errors?.length > 0 && err?.error?.error?.errors[0]?.message) {
                //  this.alert.error(err?.error?.error?.errors[0]?.message);
                //} else if (err?.error?.error?.non_field_errors?.length) {
                //  this.alert.error(err?.error?.error?.non_field_errors[0]);
                //} else if (err?.error?.error) {
                //  this.alert.error(err?.error?.error);
                //} else {
                //  this.alert.error(errorHandler(err));
                //}
              }
            }
          ));
        }
      })
      .catch(() => {

      });
  }

  hideApprovalOption() {
    this.approvalOption = false;
  }

  // commented because of this is handle by timesheet backend
  // getApprovals() {
  //   this.subscriptions.push(this.timesheetService.getApproval(this.timesheetId, TimesheetStatus.PENDING).subscribe((data: any) => {
  //     if (data && data?.approvers?.length > 0 && data?.approvers[0]?.members?.length > 0) {
  //       this.approvalChainId = data?.approvers[0]?.approval_chain_id;
  //     }
  //   }));
  // }


  rejectTimesheet() {
    // this.approvalChainId = approvalChainId;
    this.eventStream.emit(new EmitEvent(Events.TIMESHEET_REJECT, { action: TimesheetStatus.REJECTED, value: true }));
  }

  timesheetActionButton(action) {
    this.eventStream.emit(new EmitEvent(Events.TIMESHEET_ACTION_FLYOUT, { showPanel: true, reloadCalendar: false, action: action }));
  }

  saveTimesheet() {
    this.onSave.emit({ submit: 0 });
  }

  submitTimesheet() {
    this.onSave.emit({ submit: 1 });
  }


  checkStatusMatch(status: string) {
    return (status?.toLowerCase() === this.timesheetData?.status?.toLowerCase());
  }

  getUserRole() {
    this.subscriptions.push(this.timesheetService.getUserRole().subscribe((data: any) => {
      if (data) {
        let userData = data.member;
        this.userDetails['role'] = userData.organization?.category.toLowerCase(),
          this.userDetails['supervisor_id'] = userData.supervisor_id;
      }
    }));
  }

  /* getApprovals(){    
    if(this.timesheetId && this.timesheetData?.status?.toLowerCase() == TimesheetStatus.PENDING){
      this.subscriptions.push(this.timesheetService.getApproval(this.timesheetId, TimesheetStatus.PENDING).subscribe(data => {
        if (data && data?.approvers?.length > 0 && data?.approvers[0]?.members?.length > 0) {
          this.approvalId = data?.approvers[0]?.members[0]?.id;
          if(this.timeSheet?.data?.timesheet_manager?.id == this.userDetails?.id && this.timesheetId && this.timeSheet?.data?.status?.toLowerCase() == TimesheetStatus?.PENDING &&  this.approvalId == this.userDetails?.id){
            this.showActionBtn = true;
          }
        }
      }));
    }    
  } */

  discardTimesheet() {
    this.timesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
    this.timesheetId = this.route.snapshot.queryParams['timesheetId'] || this.timesheetData?.timesheet_uuid || this.timesheetData?.timesheet_id;
    const program = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${program?.id}/timesheet/${this.timesheetId}/discard/hour`
    this.timesheetService.put(_url, '').subscribe(
      {
        next: (data: any) => {
          this.alert.success(data?.message);
          this.router.navigate(['timesheet/list/all']);
        }, error: (err) => {
          this.showError(err);
        }
      }
    )
  }

  isShowPrint() {
    // Changed based on V2M-17846
    return (this._config?.print?.is_allow && this._config?.print?.option[this.user_type]);
    
    // return (this._config?.print?.is_allow
    //   && ((this._config?.print?.option[this.user_type]) ||
    //     (this.user_type === UsersType?.SUPER_ORG?.toLowerCase() &&
    //       this._config?.print?.option[UsersType?.MSP?.toLowerCase()])
    //     && (this._config?.hour_type_calculation?.toLowerCase() == TimesheetWeeklyType?.MANUAL?.toLowerCase()
    //       || this._config?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType?.AUTOMATIC?.toLowerCase()
    //       || this._config?.timesheet_type ? this._config?.timesheet_type?.includes('days') : true)
    //     && this.timesheetData?.status === this.timesheetStatuses?.APPROVED))
  }
  // this is handled by backend so commented this
  // get hasOverrideApprovalPermission() {
  //   return this.timesheetService?.hasAdminOverridePermission();
  // }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  showError(err) {
    this.timesheetService.emitLogs(this.timesheetService.showErrorLog(err, (err?.status == 500 || err?.status == 400)));
  }
}
