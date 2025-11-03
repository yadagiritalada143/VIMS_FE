import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StorageService } from 'src/app/core/services/storage.service';
import { AccuracyConfigEnum } from 'src/app/shared/enums';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { TimesheetConstants, TimesheetType } from 'src/app/wipro-timesheet/timesheet.enums';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';

@Component({
  selector: 'app-hourly-print-component',
  templateUrl: './hourly-print-component.component.html',
  styleUrls: ['./hourly-print-component.component.scss']
})
export class HourlyPrintComponentComponent implements OnInit {
  public timeSheet: any = {};
  public timesheetData: any;
  public basicDetails: any;
  private assignmentId: any;
  private timesheetId: any;
  public assignmentName: any;
  public _formData: any;
  public _weekDates: any;
  public billing_data: any;
  currency: string = undefined;
  accuracyConfig = AccuracyConfigEnum;
  @Input() set timeSheetData(data) {
    if (data) {
      this.timeSheet = data;
      this.timeSheetInfo();
    }
  }
  @Input() set formData(data) {
    if (data) {
      this._formData = data;
    }
  };
  @Input() set weekDates(data) {
    if (data) {
      this._weekDates = data;
    }
  };
  @Input() set billingData(data) {
    if (data) {
      this.setBillData(data);
    }
  }
  getDateFromString = getDateFromString;
  constructor(public storageservice: StorageService,
    private datePipe: LocalDateFormatPipe,
    public timesheetService: TimesheetService,
    public route: ActivatedRoute
  ) { }

  ngOnInit(): void {

  }

  setBillData(data) {
    if (data?.bill_data?.length > 0) {
      this.currency = data?.currency?.toUpperCase();
      this.billing_data = data?.bill_data;
    } else {
      this.billing_data = undefined;
    }
  }

  timeSheetInfo() {
    const timesheetData = this.storageservice.get(TimesheetConstants.TIMESHEET);
    const timesheetId = this.route.snapshot.queryParams['timesheetId'];
    if (timesheetData?.assignment_id || timesheetId) {
      this.assignmentId = timesheetData.assignment_id;
      this.timesheetId = timesheetId || timesheetData.timesheet_uuid || timesheetData.id || timesheetData.timesheet_id;
      this.getBasicInfo();
    }
  }

  getBasicInfo() {
    const start_date = this.timeSheet?.start_date;
    const end_date = this.timeSheet?.end_date;
    this.timesheetService.getBasicInfo(this.assignmentId, this.timesheetId, start_date, end_date).subscribe((data: any) => {
      if (data) {
        this.basicDetails = data?.data;
        this.showAssignmentId();
      }
    })
  }

  showAssignmentId() {
    let assignmentName = this.basicDetails?.assignment_title ? this.basicDetails?.assignment_title : this.timesheetData?.assignment_title;
    if (assignmentName) {
      assignmentName += ' ' + this.basicDetails?.assignment_code ? '(' + this.basicDetails?.assignment_code + ')' : this.timesheetData?.assignment_code ? '(' + this.timesheetData?.assignment_code + ')' : '';
      this.assignmentName = assignmentName;
    } else {
      this.assignmentName = '';
    }
  }


  getFormattedDate(date) {
    const formatted_date = getDateFromString(date);
    return this.datePipe.transform(formatted_date);
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

  timesheetType() {
    let currentTimesheetData = this.storageservice.get(TimesheetConstants.TIMESHEET);
    if (currentTimesheetData?.meta_data?.layout?.type === TimesheetType?.DAY) {
      return 'Day'
    } else {
      return 'Hr'
    }
  }

}
