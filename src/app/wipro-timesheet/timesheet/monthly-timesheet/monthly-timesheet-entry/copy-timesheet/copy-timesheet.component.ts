import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { StorageService } from 'src/app/core/services/storage.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { DatePipe } from '@angular/common';
import { ClonerService } from 'src/app/core/services/cloner.service';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { TimesheetConstants, TimesheetStatus } from 'src/app/wipro-timesheet/timesheet.enums';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-copy-timesheet-monthly',
  templateUrl: './copy-timesheet.component.html',
  styleUrls: ['./copy-timesheet.component.scss']
})

export class CopyMonthlyTimesheetComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  copyModal: boolean = false;
  currentTimesheetData: any = undefined;
  isSubmitted: boolean = false;
  timesheetId: string = undefined;
  calendar: any = [];
  workingWeekDays: any = [];
  billingData: any = [];
  days: any = [];
  showCopyTimesheetButton: boolean = false;
  allowCopyPasteCheck: any = [];
  copyIndex: number = undefined;
  pasteIndexes: any = [];
  saveActive = false;
  holidayName: string = undefined;
  @Output() onClose = new EventEmitter();

  constructor(
    private datePipe: DatePipe,
    private alert: AlertService,
    private storageService: StorageService,
    private eventStream: EventStreamService,
    private timesheetService: TimesheetService,
    private clonerService: ClonerService) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.UPDATE_CURRENT_TIMESHEET_DETAILS).subscribe((data: any) => {
      this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
      this.timesheetId = this.currentTimesheetData?.timesheet_uuid || this.currentTimesheetData?.timesheet_id;
      if (data?.updateCalendar && data?.calendar != undefined) {
        this.calendar = data.calendar;
      }
      if (data?.updateCalendar && data?.days != undefined) {
        this.days = data.days;
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.UPDATE_BILLING_AND_WORKING_DAYS_DETAILS).subscribe((data: any) => {
      if (data) {
        if (data.workingWeekDays) {
          this.workingWeekDays = data.workingWeekDays;
        }
        if (data.billingData) {
          this.billingData = data.billingData;
        }
        if (data.showCopyTimesheetOption != undefined) {
          this.showCopyTimesheetButton = data?.showCopyTimesheetOption;
        }
        if (data.allowCopyPasteCheck) {
          this.allowCopyPasteCheck = data?.allowCopyPasteCheck;
          this.isSubmitted = false;
        }
        if (data.holidayName) {
          this.holidayName = data.holidayName;
        }
      }
    }));
  }

  copyTimesheetModal() {
    this.copyModal = true;
  }

  closeCopyTimesheet() {
    this.copyModal = false;
    this.resetData();
  }

  copyData(index) {
    if (this.copyIndex === index) {
      this.pasteIndexes = [];
      this.copyIndex = undefined;
      return;
    }
    if (index >= 0) {
      this.copyIndex = index;
    }
  }

  pasteData(index) {
    if (index >= 0 && !this.pasteIndexes.includes(index) && this.copyIndex != undefined) {
      this.pasteIndexes?.push(index);
    }
  }

  checkIfSelected(index) {
    return this.pasteIndexes?.includes(index);
  }

  undoData(index) {
    if (index >= 0 && this.pasteIndexes.includes(index)) {
      this.pasteIndexes.forEach((item, i) => {
        if (item === index) {
          this.pasteIndexes.splice(i, 1);
        }
      });
    }
  }

  updateTimesheet() {
    let workingWeekDays = this.clonerService.deepClone(this.workingWeekDays);
    let timesheetId = this.timesheetId;
    let timesheetData = [];
    let entries = [];
    this.pasteIndexes?.forEach(data => {
      if (data >= 0) {
        // let startIndex= this.getCurrentIndex(data, 0);
        // let copyIndex= this.getCurrentIndex(this.copyIndex, 0);
        for (let i = 0; i <= 6; i++) {
          let startIndex = this.getCurrentIndex(data, i);
          let copyIndex = this.getCurrentIndex(this.copyIndex, i);
          let copyFrom = this.calendar[copyIndex]?.timesheet;
          const selectedDate = this.datePipe.transform((new Date(this.calendar[startIndex].date)), "yyyy-MM-dd");
          let nextDate: any = this.addDaysToDateString(selectedDate, 1);
          if (nextDate) {
            nextDate = this.datePipe.transform((new Date(nextDate)), "yyyy-MM-dd");
          }
          let timesheet = {
            date: selectedDate,
            breaks: [],
            type: null,
            day_status: copyFrom.day_status,
            leave_type: copyFrom.leave_type,
            leave_status: copyFrom.leave_status,
            overnight: copyFrom.check_in_date === copyFrom.check_out_date ? false : true,
            check_in: copyFrom.check_in,
            check_out: copyFrom.check_out,
            check_in_date: copyFrom.check_in_date === copyFrom.date ? selectedDate : nextDate,
            check_out_date: copyFrom.check_out_date === copyFrom.date ? selectedDate : nextDate,
            notes: copyFrom.notes,
            document: null //copyFrom.document
          };
          if (copyFrom.breaks?.length > 0) {
            const breaks = copyFrom.breaks[0];
            timesheet.breaks = [{
              break_out: breaks?.break_out,
              break_in: breaks?.break_in,
              break_out_date: breaks?.break_out_date && breaks?.break_out_date !== copyFrom.date ? nextDate : selectedDate,//this.datePipe.transform((new Date(form.break_in_date)), "yyyy-MM-dd"),
              break_in_date: breaks?.break_in_date && breaks?.break_in_date !== copyFrom.date ? nextDate : selectedDate,
            }];
          }
          entries.push(timesheet?.date);
          timesheetData.push(timesheet);
          //change working week days array as well
          workingWeekDays[data] = this.workingWeekDays[this.copyIndex];
        }
      }
    });
    if (timesheetData?.length > 0) {
      if (this.currentTimesheetData?.status?.toLowerCase() === TimesheetStatus.REJECTED || this.currentTimesheetData?.status?.toLowerCase() === TimesheetStatus.WITHDRAWN) {
        timesheetId = undefined;
        this.calendar?.forEach(calendar => {
          if (!calendar.disableDate && !entries.includes(calendar?.timesheet?.date)) {
            timesheetData.push(calendar?.timesheet);
          }
        });
      }
      let payload: any = {
        assignment_uuid: this.currentTimesheetData?.assignment_id,
        user_uuid: this.currentTimesheetData?.user_id,
        parent_type: this.currentTimesheetData?.parent_type,
        child_type: this.currentTimesheetData?.child_type,
        worker_type: "worker",
        // location_type: this.assignmentDetails?.location_type,
        start_date: this.currentTimesheetData?.start_date,
        end_date: this.currentTimesheetData?.end_date,
        working_days: this.getWorkingDays(workingWeekDays),
        is_submit: 0,
        timesheet_logs: {
          data: [{
            project_type: null,
            project_id: null,
            project_title: null,
            data: timesheetData
          }]
        }
      }
      if (timesheetId) {
        this.updateDayTimesheet(payload);
      } else {
        this.createDayTimesheet(payload);
      }
    }
  }

  getWorkingDays(workingWeekDays) {
    let working_days = [];
    workingWeekDays.forEach(days => {
      if (days) {
        working_days.push(days);
      }
    });
    return working_days;
  }

  updateDayTimesheet(payload) {
    this.isSubmitted = true;
    payload['timesheet_uuid'] = this.currentTimesheetData?.timesheet_uuid || this.currentTimesheetData?.timesheet_id;
    this.subscriptions.push(this.timesheetService.updateDayTimesheet(payload).subscribe(
      {
        next: (data: any) => {
          if (data) {
            this.resetData();
            this.alert.success('Timesheet updated successfully');
            this.onClose.emit({ close: true });
            // this.isSubmitted = false;
          }
        }, error: (err) => {
          if (err?.error?.error?.errors?.length > 0 && err?.error?.error?.errors[0]?.message) {
            this.alert.error(err?.error?.error?.errors[0]?.message);
          } else {
            this.alert.error(errorHandler(err));
          }
          this.isSubmitted = false;
        }
      }
    ));
  }

  createDayTimesheet(payload) {
    this.isSubmitted = true;
    this.subscriptions.push(this.timesheetService.createDayTimesheet(payload).subscribe(
      {
        next: (data: any) => {
          if (data) {
            this.resetData();
            this.currentTimesheetData.timesheet_uuid = data?.data.timesheet_id;
            this.currentTimesheetData.timesheet_id = data?.data.timesheet_id;
            this.storageService.set(TimesheetConstants.TIMESHEET, this.currentTimesheetData, true);
            this.timesheetId = data?.data?.timesheet_id;
            this.alert.success('Timesheet created successfully');
            this.onClose.emit({ close: true });
            // this.isSubmitted = false;
          }
        }, error: (err) => {
          if (err?.error?.error?.errors?.length > 0 && err?.error?.error?.errors[0]?.message) {
            this.alert.error(err?.error?.error?.errors[0]?.message);
          } else {
            this.alert.error(errorHandler(err));
          }
          this.isSubmitted = false;
        }
      }
    ));
  }
  addDaysToDateString(dateString: string, noOfDays: number = 0) {
    const date = dateString?.split("-");
    if (date?.length === 3) {
      const new_Date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0); //new Date(duration?.start_date+ " 00:00:00"); fixed for safari
      new_Date.setDate(new_Date.getDate() + noOfDays);
      return new_Date;
    }
    return null;
  }

  getCurrentIndex(i, j) {
    return (7 * i + j);
  }

  resetData() {
    this.copyIndex = undefined;
    this.pasteIndexes = [];
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
