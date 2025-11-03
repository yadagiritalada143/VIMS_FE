import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from 'src/app/core/services/storage.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { MonthList } from '../../../timesheet.utils';
import { TimesheetConstants, TimesheetStatus } from 'src/app/wipro-timesheet/timesheet.enums';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-monthly-timesheet-breadcrumb',
  templateUrl: './monthly-timesheet-breadcrumb.component.html',
  styleUrls: ['./monthly-timesheet-breadcrumb.component.scss']
})
export class MonthlyTimesheetBreadcrumbComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  @Input() isSubmitSheet;
  @Input() infoDetails;
  @Input() calendar;
  @Input() working_days;
  timesheetData;
  userDetails;
  showActionBtn: boolean = false;
  status;
  // approvalId;
  disableSubmit: boolean = false;
  disableWithdraw: boolean = false;
  disableApprovalButton: boolean = false;
  disableModifyButton: boolean = false;
  timesheetId: string = undefined;
  timesheetStatuses = TimesheetStatus;
  @Output() onSubmit = new EventEmitter();

  constructor(
    private eventStream: EventStreamService,
    private timesheetService: TimesheetService,
    private alert: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private storageService: StorageService,
    private confirmService: ConfirmationDialogService,
  ) { }

  ngOnInit(): void {
    this.timesheetData = this.storageService.get('timeSheetData');
    this.userDetails = this.storageService.get('user');
    this.timesheetId = this.route.snapshot.queryParams['timesheetId'] || this.timesheetData?.timesheet_uuid || this.timesheetData?.timesheet_id;
    // if (this.timesheetId) {
    //   this.getApprovals();
    // }
    this.getUserRole();
    this.subscriptions.push(this.eventStream.on(Events.TIMESHEET_REJECT).subscribe((data: any) => {
      if (data.show) {
        this.showActionBtn = false;
        this.disableApprovalButton = false;
        this.router.navigate([`/timesheet/list/${TimesheetStatus.REJECTED}`]);
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.UPDATE_CURRENT_TIMESHEET_DETAILS).subscribe((data: any) => {
      this.timesheetData = this.storageService.get('timeSheetData');
      if (data?.timesheetInfoDetails) {
        this.infoDetails = data.timesheetInfoDetails;
        // if (this.approvalId) {
        //   if (this.infoDetails?.timesheet_manager?.id == this.userDetails?.id && this.timesheetId && this.infoDetails?.status?.toLowerCase() == TimesheetStatus.PENDING && this.approvalId) {
        //     this.showActionBtn = true;
        //   }
        // } else {
        //   this.getApprovals();
        // }

      }
    }));
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
    date = date?.split(' ');
    let onlyDate = date?.length > 0 ? date[0] : "";
    let allDate = onlyDate?.split('-');
    let formattedDate = '';
    if (allDate?.length === 3) {
      let month = MonthList[allDate[1] - 1];
      formattedDate = `${month} ${allDate[2]}, ${allDate[0]}`;
    }
    return formattedDate;
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
  approveTimesheet() {
    const payload = {
      action: TimesheetStatus.APPROVED?.toUpperCase(),
      reason: null,
      note: null,
      // approval_chain_id: approvalChainId
    }
    // if (this.approvalId) {
      this.confirmService.confirm('', `Are you sure you want to approve the timesheet?`,
        'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            this.disableApprovalButton = true;
            this.subscriptions.push(this.timesheetService.updateTimesheetApprovalStatus(this.timesheetId, payload).subscribe(
              {
                next: data => {
                  this.disableApprovalButton = false;
                  if (data) {
                    this.alert.success(`Timesheet approved successfully.`);
                    let timesheetData = this.storageService.get('timeSheetData');
                    timesheetData.status = TimesheetStatus.APPROVED;
                    this.storageService.set('timeSheetData', timesheetData, true);
                    this.eventStream.emit(new EmitEvent(Events.TIMESHEET_REJECT, { value: false }));
                    this.timesheetData.status = TimesheetStatus.APPROVED;
                    this.showActionBtn = false;
                    this.router.navigate([`/timesheet/list/${TimesheetStatus.APPROVED}`]);
                  }
                }, error: (err) => {
                  this.disableApprovalButton = false;
                  if (err?.error?.error?.errors?.length > 0 && err?.error?.error?.errors[0]?.message) {
                    this.alert.error(err?.error?.error?.errors[0]?.message);
                  } else if (err?.error?.error?.non_field_errors?.length) {
                    this.alert.error(err?.error?.error?.non_field_errors[0]);
                  } else if (err?.error?.error) {
                    this.alert.error(err?.error?.error);
                  } else {
                    this.alert.error(errorHandler(err));
                  }
                }
              }
            ));
          }
        })
        .catch(() => {

        });
    // } else {
    //   this.alert.error('No Pending approvals for this user');
    // }
  }

  rejectTimesheet() {
    this.eventStream.emit(new EmitEvent(Events.TIMESHEET_REJECT, { action: TimesheetStatus.REJECTED, value: true }));
  }

  submitTimesheet() {
    this.onSubmit.emit({ close: true });
    if (this.isSubmitSheet) {
      this.confirmService.confirm('', `Are you sure you want to submit the timesheet?`,
        'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            this.disableSubmit = true;
            let timesheetData = [];
            this.calendar?.forEach(calendar => {
              if (calendar?.holiday && !calendar?.timesheet?.check_in && !calendar?.timesheet?.leave_type) {
                timesheetData.push({
                  breaks: [],
                  check_in: null,
                  check_out: null,
                  date: calendar?.timesheet?.date,
                  day_status: "absent",
                  leave_status: "full_day",
                  leave_type: "client_holiday",
                  notes: null,
                  overnight: false,
                  type: null
                })
              } else if (!calendar.disableDate) {
                timesheetData.push(calendar?.timesheet);
              }
            });
            let payload: any = {
              assignment_uuid: this.timesheetData?.assignment_id,
              user_uuid: this.timesheetData?.user_id,
              parent_type: this.timesheetData?.parent_type,
              child_type: this.timesheetData?.child_type,
              timesheet_uuid: this.timesheetData?.timesheet_uuid || this.timesheetData?.timesheet_id,
              worker_type: "worker",
              location_type: this.timesheetData?.location_type,
              start_date: this.timesheetData?.start_date,
              end_date: this.timesheetData?.end_date,
              working_days: this.working_days,
              is_submit: 1,
              timesheet_logs: {
                data: [{
                  project_type: null,
                  project_id: null,
                  project_title: null,
                  data: timesheetData
                }]
              }
            }
            this.updateDayTimesheet(payload);

          }
        })
        .catch(() => {
          this.disableSubmit = false;
        });
    }
  }

  updateDayTimesheet(payload) {
    this.subscriptions.push(this.timesheetService.updateDayTimesheet(payload).subscribe(
      {
        next: data => {
          this.disableSubmit = false;
          if (data) {
            this.alert.success('Timesheet submitted successfully');
            let timesheetData = this.storageService.get('timeSheetData');
            timesheetData.status = TimesheetStatus.PENDING;
            this.storageService.set('timeSheetData', timesheetData, true);
            this.timesheetData = timesheetData;
            if (timesheetData?.timesheet_manager?.id == this.userDetails?.id && timesheetData?.timesheet_uuid && timesheetData?.status?.toLowerCase() == 'pending') {
              this.showActionBtn = true;
            }
            this.router.navigate([`/timesheet/list/${TimesheetStatus.PENDING}`]);
          }
        }, error: (err) => {
          this.disableSubmit = false;
          if (err?.error?.error?.errors?.length > 0 && err?.error?.error?.errors[0]?.message) {
            this.alert.error(err?.error?.error?.errors[0]?.message);
          } else {
            this.alert.error("Some error occured while saving timesheet");
          }
        }
      }
    ));
  }
  checkStatusMatch(status: string) {
    return (status?.toLowerCase() === this.timesheetData?.status?.toLowerCase());
  }

  withdrawTimesheet() {
    const timesheet = this.storageService.get(TimesheetConstants.TIMESHEET);
    this.confirmService.confirm('', `Are you sure you want to withdraw the timesheet?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.disableWithdraw = true;
          this.subscriptions.push(this.timesheetService.withdrawTimesheet(timesheet?.timesheet_uuid, {}).subscribe(
            {
              next: data => {
                if (data) {
                  this.disableWithdraw = false;
                  this.alert.success('Timesheet withdrawn successfully');
                  this.router.navigate([`/timesheet/list/${TimesheetStatus.WITHDRAWN}`]);

                }
              }, error: (err) => {
                this.disableWithdraw = false;
                if (err?.error?.error?.errors?.length > 0 && err?.error?.error?.errors[0]?.message) {
                  this.alert.error(err?.error?.error?.errors[0]?.message);
                } else if (err?.error?.error?.non_field_errors?.length) {
                  this.alert.error(err?.error?.error?.non_field_errors[0]);
                } else {
                  this.alert.error(errorHandler(err));
                }
              }
            }
          ));
        }
      })
      .catch(() => {

      });
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
// Commented this because this is handle by timesheet backend
  // getApprovals() {
  //   this.subscriptions.push(this.timesheetService.getApproval(this.timesheetId, TimesheetStatus.PENDING).subscribe((data: any) => {
  //     if (data && data?.approvers?.length > 0 && data?.approvers[0]?.members?.length > 0) {
  //       // this.approvalId = data?.data[0]?.id;
  //       // if (this.infoDetails?.timesheet_manager?.id == this.userDetails?.id && this.timesheetId && this.infoDetails?.status?.toLowerCase() == 'pending' && this.approvalId) {
  //       // this.approvalId = data?.approvers[0]?.members[0]?.id;
  //       this.approvalId = data?.approvers[0]?.approval_chain_id;
  //       if (this.infoDetails?.timesheet_manager?.id == this.userDetails?.id && this.timesheetId && this.infoDetails?.status?.toLowerCase() == TimesheetStatus?.PENDING && this.approvalId == this.userDetails?.id) {
  //         this.showActionBtn = true;
  //       }
  //     }
  //   }));
  // }

  get hasOverrideApprovalPermission() {
    return this.timesheetService?.hasAdminOverridePermission();
  }

  modifyTimesheet() {
    this.eventStream.emit(new EmitEvent(Events.TIMESHEET_ACTION_FLYOUT, { showPanel: true, reloadCalendar: false, action: 'MODIFY_TIMESHEET' }));
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
