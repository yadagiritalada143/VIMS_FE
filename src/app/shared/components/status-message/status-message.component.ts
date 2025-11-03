import { Component, Input, OnInit } from '@angular/core';
import { ApprovalStatus, ExpenseStatus, JobStatus, MtpStatus, StatusMessageTypes, TimesheetStatus } from '../../enums';
import { StatusMessageData } from '../../interfaces';

@Component({
  selector: 'app-status-message',
  templateUrl: './status-message.component.html',
  styleUrls: ['./status-message.component.scss']
})
export class StatusMessageComponent implements OnInit {
  @Input() data: StatusMessageData;
  @Input() type: StatusMessageTypes;
  @Input() simpleMessage?: string;
  @Input() customFormatted? = false;

  public statuses;

  public readonly MonthList =["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  constructor(
   
  ) { }

  ngOnInit(): void {
    switch (this.type) {
      case StatusMessageTypes.Expense: {
        this.statuses = { ...ApprovalStatus, ...ExpenseStatus };
        break;
      }
      case StatusMessageTypes.Timesheet: {
        this.statuses = { ...ApprovalStatus, ...TimesheetStatus };
        break;
      }
      case StatusMessageTypes.Job: {
        this.statuses = {...JobStatus}
        break;
      }
      case StatusMessageTypes.Mtp: {
        this.statuses = {...MtpStatus}
        break;
      }
      default: {
        this.statuses = { ...ApprovalStatus };
        break;
      }
    }
  }


  public getStatusText(status: string, isArchive?: string) {
    let text = '';
    switch (status?.toLowerCase()) {
      case this.statuses.approved: text = 'Approved'; break;
      case this.statuses.rejected: text = 'Rejected'; break;
      case this.statuses.pending: text = 'Submitted'; break;
      case this.statuses.withdrawn: text = 'Withdrawn'; break;
      case this.statuses.modified: text = (this.type === StatusMessageTypes.Expense && isArchive === '0')
        ? 'Approved' : 'Modified'; break;
      case this.statuses.deleted: text = 'Deleted'; break;
      case this.statuses.closed: text = 'Closed'; break;
      default: text = 'Last Updated';
    }
    return text;
  }

  public getStatusClass() {
    const status = this.data?.status?.toLowerCase();
    return status === this.statuses.approved || (status === this.statuses.modified &&
        (this.type !== StatusMessageTypes.Expense || (this.type === StatusMessageTypes.Expense && this.data?.is_archive === '1'))
      )
      ? 'alert_success'
      : status === this.statuses.rejected || status === this.statuses.deleted
        ? 'alert_error' : 'alert_pending';
  }

  public getActionName(status: string, isArchive?: string) {
    let text = '';
    switch (status?.toLowerCase()) {
      case this.statuses.approved: text = 'Approve'; break;
      case this.statuses.rejected: text = 'Reject'; break;
      case this.statuses.pending: text = 'Submit'; break;
      case this.statuses.withdrawn: text = 'Withdraw'; break;
      case this.statuses.modified: text = (this.type === StatusMessageTypes.Expense && isArchive === '0')
        ? 'Approve' : 'Modify'; break;
      case this.statuses.deleted: text = 'Delete'; break;
      case this.statuses.closed: text = 'Close'; break;
      default: text = 'Last Update';
    }
    return text;
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
      let month = this.MonthList[allDate[1] - 1];
      formattedDate = `${month} ${allDate[2]}, ${allDate[0]}`;
    }
    return formattedDate;
  }

  getFormattedTime(date) {
    date = date?.split(' ');
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

}
