import { Component, OnDestroy, OnInit } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { DatePipe } from '@angular/common';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { isEmptyObject, MonthList } from '../../../timesheet.utils';
import { DATE_FORMAT, TimesheetConstants, TimesheetGracePeriod, TimesheetRoutes, TimesheetStatus, TimesheetType, TimesheetWorkWeekDays, UsersType } from 'src/app/wipro-timesheet/timesheet.enums';
import { Subscription } from 'rxjs';
import { errorHandler } from 'src/app/shared/util/error-handler';
@Component({
  selector: 'app-monthly-timesheet-entry',
  templateUrl: './monthly-timesheet-entry.component.html',
  styleUrls: ['./monthly-timesheet-entry.component.scss']
})
export class MonthlyTimesheetEntryComponent implements OnInit, OnDestroy {

  wiproConfigurationData: any = {
    5: {
      work_week: { period: "monthly", start_day: "01", week_number: 0, week_start_day: "monday" }, total_working_days_in_week: 5, is_enable_daily_hour_limit: true, allowed_daily_hours: 9.5, is_enable_weekly_hour_limit: true, allowed_weekly_hours: 48,
      is_break_enable: true, is_break_include: true, is_allowed_break_limit: true, break_hour_limit: 1, half_day_fixed_hour: 5
    },
    6: {
      work_week: { period: "monthly", start_day: "01", week_number: 0, week_start_day: "monday" }, total_working_days_in_week: 6, is_enable_daily_hour_limit: true, allowed_daily_hours: 8, is_enable_weekly_hour_limit: true, allowed_weekly_hours: 48,
      is_break_enable: true, is_break_include: true, is_allowed_break_limit: true, break_hour_limit: 1, half_day_fixed_hour: 4
    }
  };
  workingWeekDays: any = [];
  holidayData: any = [];
  missingWeekOffIndexes: any = [];
  holidayName: string = undefined;
  leaveApplicationModal;
  selectedIndex: number = null;
  markAsLeave;
  leaveDuration;
  editLeaveModal;
  selectedWeekIndex: any;
  dataLoader: boolean = true;
  billingData: any = [];
  showCopyTimesheetButton: boolean = false;
  allowCopyPasteCheck: any = [];
  dateFormatEnum = DATE_FORMAT; 
  public timesheetStatus: string = undefined;
  public calendar: any = [];
  public timesheetArr: any = [];
  public readonly dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  public days: any = [];
  isSubmitted: boolean = false;
  isAllSubmitted: boolean = false;
  pickListData: any;
  locationData: any;
  timesheet: any = [];
  public weekData: any = [];
  programId: string = undefined;
  public monthDate: Date = undefined;
  public configuratorData: any = {};
  currentTimesheetData;
  earnLeaveBalance: number = 0;
  earned_leave: number = 0;
  timesheetInfoDetails;
  assignmentDetails: any;
  isshowHoliday: any;
  gridView = true;
  listView = false;
  _locationData: any = [];
  selectedLocation: string = undefined;
  noteDropdown = false;
  basicInfoLocationType: string = undefined;
  private accountDetails = this.storageService.get('account');
  private userDetails = this.storageService.get('user');
  isVendorWorker = false;
  showMarkWeekOffBtn: boolean = false;
  assignmentWorker: any = {};
  selectedWorkLocation: any;
  disableDropDown: any = { first: false, last: false };
  isAssignmentClosed: boolean = false;
  tooltipvisible: boolean = false;
  timesheetStatuses = TimesheetStatus;
  public isTimesheetEnabled: boolean;
  public isAuthorizedToCreate: boolean = false;
  selectedCustomData = {};
  customFields: any[] = [];
  isCustomFieldsValid: any;
  private subscriptions: Subscription[] = [];

  constructor(
    private storageService: StorageService,
    private timesheetService: TimesheetService,
    private router: Router,
    private route: ActivatedRoute,
    private alert: AlertService,
    private confirmService: ConfirmationDialogService,
    private datePipe: DatePipe, private eventStream: EventStreamService,
    private authorizationService: AuthorizationService

  ) { }

  ngOnInit(): void {
    this.initializeTimesheet();
    this.subscriptions.push(this.eventStream.on(Events.TIMESHEET_ACTION_FLYOUT).subscribe((data) => {
      if (data?.reloadCalendar) {
        this.initializeTimesheet();
      }
    }));
  }

  initializeTimesheet() {
    const program = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = program?.id;
    const timesheetId = this.route.snapshot.queryParams['timesheetId'];
    if (timesheetId) {
      this.storageService.set(TimesheetConstants.TIMESHEET, {
        timesheet_id: timesheetId,
        timesheet_uuid: timesheetId,
      }, true);
      this.getBasicInfo(timesheetId);
    } else {
      this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
      this.getTimesheetConfigurator();
      this.getAssignmentDetails();
      this.pickList();
      if (!this.programId) {
        this.alert.error("No Program found..")
      }
      if (this.currentTimesheetData?.timesheet_uuid) {
        this.timesheetStatus = this.currentTimesheetData.status?.toLowerCase();
      }
    }

    if (this.accountDetails?.role?.organization_category?.toLowerCase() == 'VENDOR'?.toLowerCase() || this.userDetails?.is_candidate) {
      this.isVendorWorker = true;
      this.showTooltip();
    }
  }

  showTooltip() {
    if (this.currentTimesheetData == undefined || !this.currentTimesheetData?.status) {
      this.tooltipvisible = true;
      setTimeout(() => {
        this.tooltipvisible = false;
      }, 7000)
    } else {
      this.tooltipvisible = false;
    }
  }

  getBasicInfo(timesheetId) {
    this.timesheetService.getBasicInfo(undefined, timesheetId, undefined, undefined).subscribe(
      {
        next: (data: any) => {
          if (data?.data) {
            //set the data to locastorage
            var response = data.data;
            const date = response?.start_date?.split("-");
            let display_value = '';
            if (date?.length === 3) {
              const start_date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0); //new Date(duration?.start_date+ " 00:00:00"); fixed for safari
              display_value = MonthList[start_date.getMonth()] + ' ' + start_date.getFullYear();
            }
            this.currentTimesheetData = {
              assignment_id: response.assignment_id,
              assignment_title: response.assignment_title,
              child_type: response.child_type,
              code: response.code,
              display_value: display_value,
              end_date: response.end_date,
              parent_type: response.parent_type,
              start_date: response.start_date,
              status: response.status,
              timesheet_code: response.code,
              timesheet_id: timesheetId,
              timesheet_uuid: timesheetId,
              user_id: response.worker.id
            }
            this.storageService.set(TimesheetConstants.TIMESHEET, this.currentTimesheetData, true);
            this.getTimesheetConfigurator();
            this.getAssignmentDetails();
            this.pickList();
            if (this.currentTimesheetData?.timesheet_uuid) {
              this.timesheetStatus = this.currentTimesheetData.status?.toLowerCase();
            }
          }
        }, error: (err) => {
          // this.alert.error(errorHandler(err));
          this.alert.error("Something went wrong");
        }
      }
    );
  }


  isAllowAction() {
    if (((this.checkForStatus(TimesheetStatus.WITHDRAWN) && this.timesheetInfoDetails?.is_need_create) || (this.checkForStatus(TimesheetStatus.REJECTED) && this.timesheetInfoDetails?.is_need_create) || this.checkForStatus(TimesheetStatus.DRAFT) || !this.currentTimesheetData?.status) && !this.isAssignmentClosed) {
      return true
    } else {
      return false
    }
  }

  openNotes() {
    this.noteDropdown = true;
  }

  showView(type) {
    if (type == 'list') {
      this.listView = true;
      this.gridView = false;
    }
    else if (type == 'grid') {
      this.listView = false;
      this.gridView = true;
    }
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

  getCurrentIndex(i, j) {
    return (7 * i + j);
  }
  validateTimesheetWeeklyType() {
    return this.configuratorData?.work_week?.period?.toLowerCase() === TimesheetType?.MONTHLY?.toLowerCase() && this.router?.url?.toLowerCase() === TimesheetRoutes?.MONTHLY_ENTRY_ROUTE?.toLowerCase();
  }

  getTimesheetConfigurator() {
    const _url = `/timesheet/programs/${this.programId}/config?assignment_uuid=${this.currentTimesheetData?.assignment_id}`; // temporary
    this.timesheetService.get(_url).subscribe(
      {
        next: (data: any) => {
         if (data) {
            // Show custom field data	
            if (data?.data?.custom) {
              this.selectedCustomData = data?.data?.custom;
            } else {
              this.selectedCustomData = {};
            }
            // End
          this.configuratorData = data?.data;
          if (this.validateTimesheetWeeklyType()) {
            this.getTimeSheetData();
            const value = this.getStartDayOfCalendar(this.configuratorData?.work_week?.week_start_day); // pass this from configurator
            this.setDaysArray(value);
            if (this.currentTimesheetData?.start_date) {
              const currentTimesheetDate = this.currentTimesheetData?.start_date?.split("-");
              if (currentTimesheetDate?.length === 3) {
                this.generateCalendarDays(parseInt(currentTimesheetDate[0]), parseInt(currentTimesheetDate[1]) - 1, value); // pass this from configurator
              }
              if (!this.currentTimesheetData?.timesheet_uuid) {
                this.getBilling();
              }
              this.checkIfAssignmentClosed();
            } else {
              this.alert.error("Please select valid timesheet");
              this.router.navigate(['/timesheet/list/all']);
            }
          } else {
            this.router.navigate(['/timesheet/list/all']);
          }
         }
        }, error: err => {
          this.getErrorMessage(err);
        }
      }
    )
  }

  setDaysArray(dayNumber: number) {
    for (let i = dayNumber; i <= 7; i++) {
      if (this.days.length < 7) {
        this.days.push(this.dayNames[i]);
        if (i == 6 && this.days.length < 7) {
          i = -1;
        }
      }
    }
  }

  getStartDayOfCalendar(work_week) {
    work_week = work_week?.toLowerCase();
    let value = undefined;
    switch (work_week) {
      case "sunday":
        value = 0;
        break;
      case "monday":
        value = 1;
        break;
      case "tuesday":
        value = 2;
        break;
      case "wednesday":
        value = 3;
        break;
      case "thursday":
        value = 4;
        break;
      case "friday":
        value = 5;
        break;
      case "saturday":
        value = 6;
        break;
      default:
        value = 0;
        break;
    }
    return value;
  }

  markLeave() {
    this.markAsLeave = !this.markAsLeave;
  }

  durationUpdate() {
    this.leaveDuration = true;
  }

  openApplicationModal(allowOpen, i, j, date, dayTimeEntry) {
    if (allowOpen && this.hideFutureDayEdit(date) && (this.editViewCheck(dayTimeEntry) || this.isAllowAction())) {
      this.leaveApplicationModal = i;
      this.selectedWeekIndex = j;
    }
    this.closeMoreOption(0);
  }

  cancelApplication(data) {
    this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
    this.leaveApplicationModal = '';
    this.selectedWeekIndex = '';
    if (data?.reloadCalendar) {
      this.reloadCalendar();
    }
    if (data?.close) {
      this.getTimeSheetData();
      // this.getBilling();
    }
  }

  reloadCalendar() {
    if (this.currentTimesheetData?.start_date) {
      const value = this.getStartDayOfCalendar(this.configuratorData?.work_week?.week_start_day); // pass this from configurator
      const currentTimesheetDate = this.currentTimesheetData?.start_date?.split("-");
      if (currentTimesheetDate?.length === 3) {
        this.generateCalendarDays(parseInt(currentTimesheetDate[0]), parseInt(currentTimesheetDate[1]) - 1, value); // pass this from configurator
      }
    }
  }

  editLeave() {
    this.editLeaveModal = true;
  }

  generateCalendarDays(year: number, month: number, dayNumber: number): void {
    // we reset our calendar
    this.calendar = [];
    let monthDate = new Date(year, month, 1, 0, 0, 0, 0);
    // let monthDate = new Date(`${year}-${month+1}-01 00:00:00`);//new Date(year, month, 1, 0, 0, 0, 0); //fixed for safari
    // set the display month for UI
    this.monthDate = monthDate;
    let startingDateOfCalendar = this.getStartDateForCalendar(monthDate, dayNumber, true);
    let dateToAdd = startingDateOfCalendar;
    const currentMonth = this.monthDate;//new Date(this.monthDate);
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1, 0, 0, 0, 0);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 0, 0, 0, 0);
    // const work_week = this.configuratorData.work_week;
    const work_week_end_day = TimesheetWorkWeekDays[this.configuratorData?.work_week?.week_start_day];
    let day = this.getStartDayOfCalendar(work_week_end_day) || 0;
    /* if (work_week) {
     const days = work_week.split("-");
     const display_value = days?.length > 1 ? days[1] : '';
     day = this.getStartDayOfCalendar(display_value);
   }  */
    for (var i = 0; i < 42; i++) {
      const dayTimesheet = new CalendarDate(new Date(dateToAdd));
      this.calendar.push(dayTimesheet);
      if (dateToAdd >= lastDay && dateToAdd.getDay() === day) {
        break;
      }
      dateToAdd = new Date(dateToAdd.setDate(dateToAdd.getDate() + 1));
    }
    let start_date = firstDay;
    if (this.currentTimesheetData?.start_date) {
      let date = this.currentTimesheetData?.start_date?.split("-");
      if (date?.length === 3) {
        start_date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0);// new Date( this.currentTimesheetData?.start_date); //fixed for safari
      }
    }
    let end_date = lastDay;
    if (this.currentTimesheetData?.end_date) {
      let date = this.currentTimesheetData?.end_date?.split("-");
      if (date?.length === 3) {
        end_date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0);//new Date( this.currentTimesheetData?.end_date); /fixed for safari
      }
    }

    this.calendar.forEach(date => {
      const disableDate = date?.date < start_date || date?.date > end_date;
      date.disableDate = disableDate;
    });
    this.setWorkingDaysPerWeek([]);

    this.getLogData(this.formatDateInRequiredFormat(this.calendar[0].date, "yyyy-MM-dd"), this.formatDateInRequiredFormat(this.calendar[this.calendar?.length - 1].date, "yyyy-MM-dd"));
    // this.getLogData(this.datePipe.transform((this.calendar[0].date), "yyyy-MM-dd"), this.datePipe.transform((this.calendar[this.calendar?.length - 1].date), "yyyy-MM-dd"));
  }

  getStartDateForCalendar(selectedDate: Date, dayNumber: number, newCalendar) {
    // for the day we selected let's get the previous month last day
    let selected = new Date(selectedDate);
    let lastDayOfPreviousMonth = new Date(selected);//selectedDate;
    if (selected.getDay() !== dayNumber && newCalendar) {
      lastDayOfPreviousMonth = new Date(selected.setDate(0));
    }
    // start by setting the starting date of the calendar same as the last day of previous month
    let startingDateOfCalendar: Date = lastDayOfPreviousMonth;
    // but since we actually want to find the last Monday of previous month
    // we will start going back in days intil we encounter our last Monday of previous month
    if (startingDateOfCalendar.getDay() != dayNumber) {
      do {
        startingDateOfCalendar = new Date(startingDateOfCalendar.setDate(startingDateOfCalendar.getDate() - 1));
      } while (startingDateOfCalendar.getDay() != dayNumber);
    }
    return startingDateOfCalendar;
  }

  getBilling() {
    let billingData = [];
    if (this.currentTimesheetData?.timesheet_uuid) {
      let _url = `/timesheet/programs/${this.programId}/timesheet/${this.currentTimesheetData?.timesheet_uuid}/weekly/working/data`;
      this.timesheetService.get(_url).subscribe(
        (data: any) => {
          let billingInfo = data?.data;
          for (var i = 0; i < this.calendar?.length; i++) {
            if (i % 7 == 0) {
              const index = i / 7;
              const start = this.calendar[i].date;
              const end = this.calendar[i + 6].date;
              const calendarStartDateFormatted = this.formatDate(start);
              const calendarEndDateFormatted = this.formatDate(end);
              const startDate = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate(), 0, 0, 0, 0);//new Date(calendarStartDateFormatted+" 00:00:00"); //fixed for safari
              const endDate = new Date(end.getFullYear(), end.getMonth() + 1, end.getDate(), 0, 0, 0, 0);//new Date(calendarEndDateFormatted+" 00:00:00"); //fixed for safari
              for (let j = 0; j <= billingInfo.length; j++) {
                let start_date = new Date(billingInfo[j]?.start_date);
                let end_date = new Date(billingInfo[j]?.end_date);
                const billingStartDate = new Date(start_date.getFullYear(), start_date.getMonth() + 1, start_date.getDate(), 0, 0, 0, 0);//new Date(billingInfo[j]?.start_date+" 00:00:00"); //fixed for safari
                const billingEndDate = new Date(end_date.getFullYear(), end_date.getMonth() + 1, end_date.getDate(), 0, 0, 0, 0);// new Date(billingInfo[j]?.end_date+" 00:00:00"); //fixed for safari
                if (calendarStartDateFormatted === billingInfo[j]?.start_date || calendarEndDateFormatted === billingInfo[j]?.end_date ||
                  (startDate < billingStartDate && billingEndDate < endDate)) {
                  billingData[index] = billingInfo[j];
                }
              }

            }
          }
        });
    } else {
      for (var i = 0; i < this.calendar?.length; i++) {
        if (i % 7 == 0) {
          const start = this.calendar[i].date;
          const end = this.calendar[i + 6].date;//new Date(calendarEndDateFormatted);
          const calendarStartDateFormatted = this.formatDate(start);
          const calendarEndDateFormatted = this.formatDate(end);
          billingData.push({
            billing_days: "0",
            billing_hours: "0.00",
            end_date: calendarEndDateFormatted,
            start_date: calendarStartDateFormatted
          })

        }
      }
    }
    this.billingData = billingData;
    this.eventStream.emit(new EmitEvent(Events.UPDATE_BILLING_AND_WORKING_DAYS_DETAILS, { billingData: this.billingData }));
  }

  checkForStatus(status) {
    return (this.currentTimesheetData?.status?.toLowerCase() === status?.toLowerCase());
  }

  getEarnedLeaveCount() {
    if (this.earnLeaveBalance > 0 && this.earned_leave >= 0) {
      return this.earnLeaveBalance - this.earned_leave;
    } else return this.earnLeaveBalance;
  }

  getEarnLeaveCount(data) {
    this.earnLeaveBalance = data;
  }

  setWorkingDaysPerWeek(working_days) {
    this.workingWeekDays = [];
    for (let i = 0; i < this.calendar?.length; i++) {
      if (i % 7 == 0) {
        const startDate = this.calendar[i];
        const endDate = this.calendar[i + 6];
        const index = i / 7;
        if (!startDate?.disableDate || !endDate?.disableDate) {
          this.workingWeekDays[index] = working_days[index] || this.configuratorData.total_working_days_in_week;//add saved date or default date
        } else {
          let valueUpdated = true;
          for (var j = 0; j < 6; j++) {
            if (!this.calendar[i + j]?.disableDate) {
              this.workingWeekDays[index] = working_days[index] || this.configuratorData.total_working_days_in_week;//add saved date or default date
              valueUpdated = false;
            }
          }
          if (valueUpdated) {
            this.workingWeekDays[index] = undefined;
          }
        }
      }
    }

    this.eventStream.emit(new EmitEvent(Events.UPDATE_BILLING_AND_WORKING_DAYS_DETAILS, { workingWeekDays: this.workingWeekDays }));
  }

  workingDaysPerWeekChanged(oldValue, value, index) {
    if (oldValue == value) {
      return;
    }
    let timesheetId = this.currentTimesheetData?.timesheet_uuid;
    let timesheetData = [];
    let showConfirmBox = false;
    if (this.timesheetStatus?.toLowerCase() === TimesheetStatus.REJECTED || this.timesheetStatus?.toLowerCase() === TimesheetStatus.WITHDRAWN) {
      timesheetId = undefined;
      const startIndex = index * 7;
      const endIndex = startIndex + 6;
      const startDate = this.calendar[startIndex]?.date;
      const endDate = this.calendar[endIndex]?.date;
      timesheetData = JSON.parse(JSON.stringify(this.timesheet));
      this.timesheet.forEach((data, index) => {
        var date = data.date?.split("-");
        if (date?.length === 3) {
          var timesheetDate = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0);
          if (startDate <= timesheetDate && timesheetDate <= endDate) {
            if (data?.leave_type || data?.check_in) {
              showConfirmBox = true;
            }
            timesheetData[index] = {
              "date": data.date,
              "type": null,
              "day_status": null,
              "leave_type": null,
              "leave_status": null,
              "overnight": false,
              "check_in": null,
              "check_out": null,
              "check_in_date": null,//data.date,
              "check_out_date": null,//data.date,
              "breaks": []
            };
          }
        }
      });
    } else {
      const startIndex = index * 7;
      for (let i = 0; i < 7; i++) {
        if (!this.calendar[startIndex + i]?.disableDate) {
          if (this.calendar[startIndex + i]?.timesheet?.leave_type || this.calendar[startIndex + i]?.timesheet?.check_in) {
            showConfirmBox = true;
          }
          timesheetData.push({
            "date": this.calendar[startIndex + i]?.timesheet?.date || this.formatDateInRequiredFormat(this.calendar[startIndex + i]?.date, "yyyy-MM-dd"),//this.datePipe.transform((this.calendar[startIndex+i]?.date), "yyyy-MM-dd"),
            "type": null,
            "day_status": null,
            "leave_type": null,
            "leave_status": null,
            "overnight": false,
            "check_in": null,
            "check_out": null,
            "check_in_date": null, //this.calendar[startIndex+i]?.timesheet?.date || this.datePipe.transform((this.calendar[startIndex+i]?.date), "yyyy-MM-dd"),
            "check_out_date": null,//this.calendar[startIndex+i]?.timesheet?.date || this.datePipe.transform((this.calendar[startIndex+i]?.date), "yyyy-MM-dd"),
            "breaks": []
          });
        }
      }
    }
    if (timesheetData?.length > 0 && showConfirmBox) {
      this.workingWeekDays[index] = value;
      this.confirmService.confirm('', `This will delete entry for current week. Are you sure you want to continue?`,
        'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            this.upsertTimesheetEntries(timesheetId, timesheetData, false);
            this.eventStream.emit(new EmitEvent(Events.UPDATE_BILLING_AND_WORKING_DAYS_DETAILS, { workingWeekDays: this.workingWeekDays }));
          } else {
            this.workingWeekDays[index] = oldValue;
          }
        })
        .catch(() => {
          this.workingWeekDays[index] = oldValue;
        });

    } else {
      this.workingWeekDays[index] = value;
      this.eventStream.emit(new EmitEvent(Events.UPDATE_BILLING_AND_WORKING_DAYS_DETAILS, { workingWeekDays: this.workingWeekDays }));
      this.upsertTimesheetEntries(timesheetId, timesheetData, false);
    }

  }

  upsertTimesheetEntries(timesheetId, timesheetData, reloadCalendar) {
    let customFieldData;
    if(this.isCustomFieldsValid || (this.customFields?.length > 0 && (!this.isAuthorizedToCreate || this.isAssignmentClosed || !this.isTimesheetEnabled))){
      customFieldData.custom = this.customFields.filter(ele => ele?.values).map(element => {
        return {
          key: element?.slug,
          value: element.values
        }
      });
    }
    let payload: any = {
      assignment_uuid: this.currentTimesheetData?.assignment_id,
      user_uuid: this.currentTimesheetData?.user_id,
      parent_type: this.currentTimesheetData?.parent_type,
      child_type: this.currentTimesheetData?.child_type,
      worker_type: "worker",
      location_type: this.assignmentDetails?.location_type,
      start_date: this.currentTimesheetData?.start_date,
      end_date: this.currentTimesheetData?.end_date,
      custom: customFieldData,
      is_submit: 0,
      working_days: this.getWorkingDays(),
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
      this.createDayTimesheet(payload, reloadCalendar);
    }

  }
  getWorkingDays() {
    let working_days = [];
    this.workingWeekDays.forEach(days => {
      if (days) {
        working_days.push(days);
      }
    });
    return working_days;
  }

  getTimeSheetData() {
    if (this.currentTimesheetData?.timesheet_uuid) {
      this.timesheetService.getTimesheetDetails(this.currentTimesheetData?.timesheet_uuid).subscribe(
        (data: any) => {
          if (data?.data) {
            this.currentTimesheetData.status = data.data?.status?.toLowerCase();
            this.showTooltip();
            this.timesheetStatus = data.data?.status?.toLowerCase();
            this.currentTimesheetData.code = data.data?.code;
            this.storageService.set(TimesheetConstants.TIMESHEET, this.currentTimesheetData, true);
            const timesheet = data?.data?.timesheet_logs?.data[0]?.data;
            this.timesheet = timesheet;
            this.timesheetInfoDetails = data.data;
            this.checkForAssignmentDurationChange();
            this.eventStream.emit(new EmitEvent(Events.UPDATE_CURRENT_TIMESHEET_DETAILS, { updateTimesheet: true, timesheet: this.timesheet, timesheetInfoDetails: this.timesheetInfoDetails }));
            if (data?.data?.working_days?.length > 0) {
              let workingdays = data?.data?.working_days || [];
              let working_days = [];
              for (let i = 0; i < this.calendar?.length; i++) {
                if (i % 7 == 0) {
                  const startDate = this.calendar[i];
                  const endDate = this.calendar[i + 6];
                  const index = i / 7;
                  if (!startDate?.disableDate || !endDate?.disableDate) {
                    const value = workingdays?.shift();
                    working_days[index] = value;
                  } else {
                    let valueUpdated = true;
                    for (var j = 0; j < 6; j++) {
                      if (!this.calendar[i + j]?.disableDate) {
                        const value = workingdays?.shift();
                        working_days[index] = value;
                        valueUpdated = false;
                        break;
                      }
                    }
                    if (valueUpdated) {
                      working_days[index] = undefined;
                    }
                  }
                }
                this.workingWeekDays = working_days;
                this.eventStream.emit(new EmitEvent(Events.UPDATE_BILLING_AND_WORKING_DAYS_DETAILS, { workingWeekDays: this.workingWeekDays }));
              }
            } else {
              let workingdays = data?.data?.working_days || [];
              let working_days = [];
              for (let i = 0; i < this.calendar?.length; i++) {
                if (i % 7 == 0) {
                  const startDate = this.calendar[i];
                  const endDate = this.calendar[i + 6];
                  const index = i / 7;
                  if (startDate?.disableDate && endDate?.disableDate) {
                    working_days[index] = undefined;
                  }
                }
              }
              working_days = [...working_days, ...workingdays];
              this.setWorkingDaysPerWeek(working_days);
            }
            if (this.timesheetInfoDetails?.leave) {
              this.earned_leave = this.timesheetInfoDetails?.leave?.leave_details?.earned_leave || 0;
            }
            this.timesheetArr = [];
            this.selectedWorkLocation = this.timesheetInfoDetails?.location_type || this.basicInfoLocationType;
            this.setClientHoliday();
            timesheet.forEach(date => {
              if (date.check_in || date.leave_type) {
                this.timesheetArr.push(date);
              }
            });
            this.calendar?.forEach((c) => {
              timesheet?.forEach(t => {
                if (this.formatDate(c?.date) === t?.date) {
                  c.timesheet = t;
                }
              });
            });
          }

          this.dataLoader = false;
          this.eventStream.emit(new EmitEvent(Events.UPDATE_CURRENT_TIMESHEET_DETAILS, { updateCalendar: true, calendar: this.calendar, days: this.days }));
          this.matchHoliday();
          this.getBilling();
          this.isTimesheetSubmitted(false);
          if (this.isVendorWorker && this.isAllowAction()) {
            this.setCopyTimesheet();
          }

        })
    } else {
      this.dataLoader = false;
    }
  }

  checkForAssignmentDurationChange() {
    if (this.timesheetInfoDetails?.new_end_date && this.timesheetInfoDetails?.end_date != this.timesheetInfoDetails.new_end_date) {
      this.confirmService.confirm('', `Hey! Your Assignment has been updated. Do you want to proceed with new timesheet entry?`,
        'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            this.currentTimesheetData.end_date = this.timesheetInfoDetails.new_end_date;
            this.reloadCalendar();
            let timesheetData = [];
            const startDate = this.getDate(this.currentTimesheetData?.start_date);
            const endDate = this.getDate(this.currentTimesheetData.end_date);
            this.timesheet?.forEach(sheet => {
              let timesheetDate = this.getDate(sheet?.date);
              if (startDate <= timesheetDate && timesheetDate <= endDate) {
                timesheetData.push(sheet);
              }
            });
            let timesheet_id = this.currentTimesheetData?.timesheet_uuid || this.currentTimesheetData?.timesheet_id;
            if (this.timesheetStatus?.toLowerCase() === 'rejected' || this.timesheetStatus?.toLowerCase() === 'withdrawn') {
              timesheet_id = undefined;
              this.upsertTimesheetEntries(timesheet_id, timesheetData, true);
            }
          }
        })
        .catch(() => {
          this.alert.error("Some issue happening opening the confirm popup for duration change");
        });
    }
  }

  getDate(date: string) {
    const dateArray = date?.split("-");
    if (dateArray?.length === 3) {
      return new Date(parseInt(dateArray[0]), parseInt(dateArray[1]) - 1, parseInt(dateArray[2]), 0, 0, 0, 0);
    } else {
      return new Date(date);
    }
  }

  setCopyTimesheet() {
    let startDate = undefined;
    let endDate = undefined;
    this.showCopyTimesheetButton = false;
    let filledDataCount = 0;
    let endIndex = 0;
    let startIndex = 0;
    let i: number = 0;
    this.calendar?.forEach((c, index) => {
      if (index % 7 == 0 || this.calendar.length - 1 === index) {
        if (startDate && endDate && this.calendar.length - 1 !== index) {
          if (filledDataCount == 7) {
            this.showCopyTimesheetButton = true;
          }
          this.allowCopyPasteCheck[i] = {
            allowCopy: filledDataCount === 7 ? true : false,
            allowPaste: this.calendar[startIndex]?.disableDate || this.calendar[endIndex]?.disableDate || !this.hideFutureDayEdit(this.calendar[endIndex]?.date) ? false : true
          };
          filledDataCount = 0;
        }
        i = index / 7;
        startIndex = index;
        startDate = this.calendar[index]?.date;
        endIndex = index + 7;
        if (endIndex >= this.calendar?.length) {
          endIndex = this.calendar.length - 1;
          endDate = new Date(this.calendar[endIndex]?.date);
          endDate = new Date(endDate.setDate(endDate.getDate() + 1));
        } else {
          endDate = this.calendar[endIndex]?.date;
        }
      }
      const calendarDate = c?.date;
      if (startDate <= calendarDate && calendarDate < endDate && (c?.timesheet?.check_in || c?.timesheet?.leave_type)) {
        filledDataCount += 1;
      }
      if (startDate && endDate && this.calendar.length - 1 === index) {
        if (filledDataCount == 7) {
          this.showCopyTimesheetButton = true;
        }
        i = parseInt("" + i);
        this.allowCopyPasteCheck[i] = {
          allowCopy: filledDataCount === 7 ? true : false,
          allowPaste: this.calendar[startIndex]?.disableDate || this.calendar[endIndex]?.disableDate || !this.hideFutureDayEdit(this.calendar[endIndex]?.date) ? false : true
        };
        filledDataCount = 0;
      }
    });
    this.eventStream.emit(new EmitEvent(Events.UPDATE_BILLING_AND_WORKING_DAYS_DETAILS, { showCopyTimesheetOption: this.showCopyTimesheetButton, allowCopyPasteCheck: this.allowCopyPasteCheck, holidayName: this.holidayName }));
  }


  hideFutureDayEdit(date) {
    return date <= new Date();
  }

  getLogData(start_date, end_date) {
    this.timesheetService.getLogData(this.currentTimesheetData?.user_id, this.currentTimesheetData?.assignment_id, start_date, end_date, 1).subscribe((data: any) => {
      if (data?.data) {
        const logData = data.data.logs;
        const date = new Date(this.currentTimesheetData?.start_date);
        const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 0, 0, 0, 0);
        this.calendar.forEach(calendar => {
          if (calendar.disableDate) {
            const selectedDate = this.formatDateInRequiredFormat(calendar?.date, "yyyy-MM-dd");//this.datePipe.transform((calendar?.date), "yyyy-MM-dd");
            if (logData[selectedDate]) {
              calendar.timesheet = logData[selectedDate];
              if (calendar?.date < start && (calendar?.timesheet?.check_in || calendar?.timesheet?.leave_type)) {
                this.disableDropDown.first = true;
              }
              if (calendar?.date > end && (calendar?.timesheet?.check_in || calendar?.timesheet?.leave_type)) {
                this.disableDropDown.last = true;
              }
            }
          }
        });
        const working_days = data?.data?.working_days || [];
        if (!this.currentTimesheetData?.timesheet_uuid) {
          this.setWorkingDaysPerWeek(working_days);
        }
        this.eventStream.emit(new EmitEvent(Events.UPDATE_CURRENT_TIMESHEET_DETAILS, { updateCalendar: true, calendar: this.calendar, days: this.days }));
      }
    });
  }

  formatDateInRequiredFormat(inputDate, format) {
    if (typeof (inputDate) === "object") {
      return this.datePipe.transform((new Date(inputDate)), format);
    } else if (typeof (inputDate) === "string") {
      let date: any = inputDate?.split("-");
      if (date?.length === 3) {
        date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0);
      }
      return this.datePipe.transform(date, format);
    }
    return inputDate;
  }

  matchHoliday() {
    this.calendar?.forEach(c => {
      this.holidayData?.forEach(t => {
        if (this.formatDate(c?.date) === t?.date && !c.disableDate) {
          c.holiday = t;
          if (!t.is_time_entry_allowed) {
            c.active = false;
          }
          // if (!this.configuratorData?.holiday?.is_allow_entry) {
          //   c.disableDate = true;
          // }
        }
      });
    });
  }

  getWeekForMarkOff(day) {
    let allowUpdate = false;
    let count = 0;
    let startIndex = 0;
    let endIndex = 7;
    let weekData = [];
    let week: any = undefined;
    this.weekData = [];
    let allowedWeekOff: number = 1;
    this.showMarkWeekOffBtn = true;
    let configuration = this.getConfiguratorData(0);
    if (configuration?.total_working_days_in_week) {
      // let value:number= ( 7 - parseInt(this.configuratorData?.total_working_days_in_week)); //temporary
      // this.showMarkWeekOffBtn= true; //new
      let value: number = (7 - parseInt(configuration?.total_working_days_in_week));
      if (Number.isInteger(value)) {
        allowedWeekOff = value;
      }
    }
    const dayNumber = this.getStartDayOfCalendar(day);
    this.calendar.forEach((calendar, index) => {
      if (calendar.date) {
        let startingDateOfCalendar = this.calendar[startIndex]?.date;
        let lastDayOfWeek = this.calendar[endIndex]?.date;
        const calendarDate = calendar.date;//new Date(calendar.date);
        if (startingDateOfCalendar <= calendarDate && calendarDate < lastDayOfWeek) {
          if (calendar?.timesheet?.leave_type === "weekly_off") {
            count += 1;
          }
        }

        if (calendar?.date?.getDay() === dayNumber && !calendar.disableDate) {
          const selectedDate = this.formatDateInRequiredFormat(calendar?.date, "yyyy-MM-dd");//this.datePipe.transform((calendar?.date), "yyyy-MM-dd");
          week = {
            date: selectedDate,
            breaks: [],
            type: null,
            day_status: "absent",
            leave_type: "weekly_off",
            leave_status: "full_day",
            overnight: false,
            check_in: null,
            check_out: null,
            notes: null,
            document: null,
            displayDate: calendar?.date?.getDate(),
            // disableDate: disableDate,
            selected: calendar?.timesheet?.leave_type === 'weekly_off' ? true : false
          }
          //  if(!disableDate){ //temporary
          //   this.showMarkWeekOffBtn= true;
          // }
          //  weekData.push(week);
        }
        if ((index != 0 && index % 7 === 0) || this.calendar.length - 1 === index) {
          const configIndex = startIndex / 7;
          let configuration = this.getConfiguratorData(configIndex);
          if (configuration?.total_working_days_in_week) {
            this.showMarkWeekOffBtn = true; //new
            let value: number = (7 - parseInt(configuration?.total_working_days_in_week));
            if (Number.isInteger(value)) {
              allowedWeekOff = value;
            }
          }
          if (!allowUpdate) {
            startIndex = endIndex;
            endIndex += 7;
          }
          if (endIndex >= this.calendar?.length) {
            endIndex = this.calendar.length - 1;
            allowUpdate = true;
          }
          if (week) {
            if (count >= allowedWeekOff) { //configurator 
              week.disableDate = true;
            }
            weekData.push(week);
            week = undefined;
          }
          count = 0;
        }

      }
    })
    this.weekData = weekData;
  }

  checkForWeeklyOff(day) {
    // set the display month for UI        
    const dayNumber = this.getStartDayOfCalendar(day);
    const weekData = [];
    this.weekData = [];
    this.showMarkWeekOffBtn = false;
    this.calendar.forEach((cal, i) => {
      if (i % 7 == 0) {
        let selectedDate = this.calendar[i]?.date; //cal.date
        let allowedWeekOff: number = 1;
        const configuration = this.getConfiguratorData(i / 7);
        if (configuration?.total_working_days_in_week) {
          let value: number = (7 - parseInt(configuration?.total_working_days_in_week));
          if (Number.isInteger(value)) {
            allowedWeekOff = value;
          }
        }
        let isWeekOffTaken: boolean = false;
        let startingDateOfCalendar = selectedDate; //this.getStartDateForCalendar(selectedDate, dayNumber, false);
        let lastDayOfWeek = new Date(startingDateOfCalendar);
        lastDayOfWeek = new Date(lastDayOfWeek.setDate(startingDateOfCalendar.getDate() + 7));
        let count = 0;
        let week: any = {};
        this.calendar?.forEach(calendar => {
          if (calendar?.date) {
            const calendarDate = new Date(calendar.date);
            if (startingDateOfCalendar <= calendarDate && calendarDate < lastDayOfWeek) {
              if (calendar?.date?.getDay() === dayNumber) {//&& !calendar.disableDate
                const selectedDate = this.formatDateInRequiredFormat(calendar?.date, "yyyy-MM-dd");//this.datePipe.transform((calendar?.date), "yyyy-MM-dd");
                week = {
                  date: selectedDate,
                  calendarDate: calendar?.date,
                  breaks: [],
                  type: null,
                  day_status: "absent",
                  leave_type: "weekly_off",
                  leave_status: "full_day",
                  overnight: false,
                  check_in: null,
                  check_out: null,
                  notes: null,
                  document: null,
                  displayDate: calendar?.date?.getDate(),
                  // disableDate: disableDate,
                  hide: calendar.disableDate,
                  selected: calendar?.timesheet?.leave_type === 'weekly_off' ? true : false
                }
                if (calendar?.timesheet?.leave_type === "weekly_off") {
                  isWeekOffTaken = true;
                }
              }
              if (calendar?.timesheet?.leave_type === "weekly_off") {
                count += 1;
              }
            }
          }
        });

        if (count >= allowedWeekOff || !this.hideFutureDayEdit(week?.calendarDate)) { //configurator
          week.disableDate = true;
        } else {
          week.disableDate = isWeekOffTaken;
        }

        if (!week.hide) {
          if (!week?.disableDate) {
            this.showMarkWeekOffBtn = true
          }
          weekData.push(week);
        }
      }

    });
    this.weekData = weekData;
  }

  getConfiguratorData(index) {
    if (index != undefined && this.workingWeekDays.length >= index && this.wiproConfigurationData[this.workingWeekDays[index]]) {
      return this.wiproConfigurationData[this.workingWeekDays[index]];
    } else {
      return this.configuratorData;
    }
  }

  markWeekOff(day) {
    let customFieldData;
    if(this.isCustomFieldsValid || (this.customFields?.length > 0 && (!this.isAuthorizedToCreate || this.isAssignmentClosed || !this.isTimesheetEnabled))){
      customFieldData.custom = this.customFields.filter(ele => ele?.values).map(element => {
        return {
          key: element?.slug,
          value: element.values
        }
      });
    }
    let timesheetData = [];
    let selectedDates = [];
    if (this.weekData?.length > 0) {
      this.weekData.forEach(element => {
        if (element?.selected && !element?.disableDate) {
          timesheetData.push(element);
          selectedDates.push(element?.date);
        }
      });

    }
    if (timesheetData?.length > 0) {
      let timesheetId = this.currentTimesheetData?.timesheet_uuid;
      if (this.timesheetStatus?.toLowerCase() === TimesheetStatus.REJECTED || this.timesheetStatus?.toLowerCase() === TimesheetStatus.WITHDRAWN) {
        timesheetId = undefined;
        this.timesheet?.forEach((timesheet) => {
          if (!selectedDates?.includes(timesheet?.date)) {
            timesheetData.push(timesheet);
          }
        });
      }
      let payload: any = {
        assignment_uuid: this.currentTimesheetData?.assignment_id,
        user_uuid: this.currentTimesheetData?.user_id,
        parent_type: this.currentTimesheetData?.parent_type,
        child_type: this.currentTimesheetData?.child_type,
        worker_type: "worker",
        location_type: this.assignmentDetails?.location_type,
        start_date: this.currentTimesheetData?.start_date,
        end_date: this.currentTimesheetData?.end_date,
        working_days: this.getWorkingDays(),
        is_submit: 0,
        custom: customFieldData,
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
        this.createDayTimesheet(payload, false);
      }
    } else {
      this.alert.error("Please select at least 1 day to mark week off");
    }

  }

  updateDayTimesheet(payload) {
    payload['timesheet_uuid'] = this.currentTimesheetData?.timesheet_uuid || this.currentTimesheetData?.timesheet_id;
    this.timesheetService.updateDayTimesheet(payload).subscribe(
      {
        next: data => {
          if (data) {
            this.alert.success('Timesheet updated successfully');
            this.cancelApplication({ close: true });
            this.closeMoreOption(0);
          }
        }, error: (err) => {
          this.getErrorMessage(err);
        }
      }
    );
  }

  createDayTimesheet(payload, reloadCalendar) {
    this.timesheetService.createDayTimesheet(payload).subscribe(
      {
        next: (data: any) => {
          if (data) {
            this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
            this.currentTimesheetData.timesheet_uuid = data?.data.timesheet_id;
            this.currentTimesheetData.timesheet_id = data?.data.timesheet_id;
            this.storageService.set(TimesheetConstants.TIMESHEET, this.currentTimesheetData, true);
            this.alert.success('Timesheet created successfully');
            this.cancelApplication({ close: true, reloadCalendar: reloadCalendar });
            this.closeMoreOption(0);
          }
        }, error: (err) => {
          this.getErrorMessage(err);
        }
      }
    );
  }

  getErrorMessage(err) {
    if (err?.error?.error?.errors?.length > 0 && err?.error?.error?.errors[0]?.message) {
      this.alert.error(err?.error?.error?.errors[0]?.message);
    } else if (err?.error?.errors[0]?.message) {
      this.alert.error(err?.error?.errors[0]?.message);
    } else {
      this.alert.error(errorHandler(err));
    }
  }
  formatDate(date) {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();
    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;
    return [year, month, day].join('-');
  }

  pickList() {
    let _url = `/configurator/programs/${this.programId}/picklists`;
    this.timesheetService.get(_url).subscribe(
      (data: any) => {
        this.pickListData = data?.picklists;
        this.pickListData?.forEach(p => {
          if (p?.name.includes('wipro')) {
            this.getLocation(p?.id);
          }
        });
      });
  }

  getLocation(id) {
    let _url = `/configurator/programs/${this.programId}/picklists/${id}/items`;
    this.timesheetService.get(_url).subscribe(
      (data: any) => {
        this.locationData = data?.picklist_items;
      });
  }

  getAssignmentDetails() {
    let _url = `/assignment/programs/${this.programId}/assignment/${this.currentTimesheetData?.assignment_id}?is_assignment_show=timesheet`;
    this.timesheetService.get(_url).subscribe(
      (data: any) => {
        this.assignmentDetails = data?.data?.assignments;
        if(!this.currentTimesheetData?.status || this.currentTimesheetData?.status?.toLowerCase() === TimesheetStatus.MISSING){
        this.selectedCustomData = this.timesheetService?.populateCustomFields(this.assignmentDetails?.custom, this.selectedCustomData);
        }
        this.selectedWorkLocation = this.timesheetInfoDetails?.location_type || this.basicInfoLocationType;
        this.setClientHoliday();
        this.checkIfAssignmentClosed();
        this.assignmentWorker = { 'location_type': this.assignmentDetails?.assignment.work_location_type, 'worker_type': this.assignmentDetails?.worker.source_type };
        this.getHoliday(this.assignmentDetails?.assignment?.work_location?.id);
      });
  }

  setClientHoliday() {
    if (this.selectedWorkLocation?.toLowerCase()?.includes('wipro')) {
      this.holidayName = "Wipro Holiday";
    } else {
      this.holidayName = "Client Holiday";
    }
    this.eventStream.emit(new EmitEvent(Events.UPDATE_BILLING_AND_WORKING_DAYS_DETAILS, { holidayName: this.holidayName }));
  }

  getHoliday(id) {
    this.currentTimesheetData.hierarchy_id = this.assignmentDetails?.assignment?.hierarchy?.id;
    this.timesheetService.getHolidayList(id,this.currentTimesheetData).subscribe(
      (data: any) => {
        data?.holiday_calendars?.forEach(h => {
          this.holidayData = this.holidayData?.concat(h?.holidays);
       });
        this.matchHoliday();
      });
  }

  showHoliday(e) {
    if (e) {
      this.assignmentWorker.location_type = e;
      if (e?.includes('Wipro')) {
        this.isshowHoliday = true;
      } else {
        this.isshowHoliday = false;
      }
      this.setClientHoliday();
    }
  }

  getDay(day) {

    if (day === 'Saturdasy' || day === 'Sundays') {
      return false
    } else {
      return true;
    }
  }

  editViewCheck(data) {
    if (data && (data?.check_in || data?.check_out || data?.day_status || data?.leave_status || data?.leave_type)) {
      return true;
    } else {
      return false
    }
  }

  calculateHours(data) {
    if (data?.check_in && data?.check_out) {
      return this.calculateDifference(this.format(data?.check_in_date || data?.date), this.format(data?.check_out_date || data?.date), data?.check_in, data?.check_out);
    }
  }

  format(input) {
    const date = new Date(input);
    return (date?.getMonth() + 1) + "/" + date?.getDate() + "/" + date?.getFullYear() + " ";
  }

  hasWhiteSpace(s) {
    return s.indexOf(' ') >= 0;
  }

  calculateDifference(start_date, end_date, start_time, end_time) {
    let _first = this.hasWhiteSpace(start_time) ? start_time : start_time?.replace(/am/ig, ' am').replace(/pm/ig, ' pm');
    let _second = this.hasWhiteSpace(end_time) ? end_time : end_time?.replace(/am/ig, ' am').replace(/pm/ig, ' pm');
    let timeStart: any = new Date(start_date + _first);
    let timeEnd: any = new Date(end_date + _second);
    let diff = (timeEnd - timeStart) / 60000;
    let minutes = diff % 60;
    let hours = (diff - minutes) / 60;
    let fs;
    let ss;
    if (minutes < 10) { ss = '0'.concat(JSON.stringify(minutes)) } else { ss = minutes }
    if (hours < 10) { fs = '0'.concat(JSON.stringify(hours)) } else { fs = hours }
    return fs + ':' + ss + ' H';
  }

  //for respective month, whether the data is filled or not (to show red unfilled)
  isNotSubmit(data) {
    if (data.holiday && this.isshowHoliday) {
      return false;
    } else {
      let foundIndex = this.timesheetArr.findIndex(sheet => {
        return sheet?.date == this.formatDate(data?.date)
      });
      return !(foundIndex >= 0);
    }

  }

  isDataSubmitted(data) {
    if (data.holiday && this.isshowHoliday) {
      return true;
    } else {
      let foundIndex = this.timesheetArr.findIndex(sheet => {
        return sheet?.date == this.formatDate(data?.date)
      });
      return (foundIndex >= 0)
    }
  }

  getAllowedWeekOff(configIndex): number {
    let configuration = this.getConfiguratorData(configIndex);
    if (configuration?.total_working_days_in_week) {
      this.showMarkWeekOffBtn = true; //new
      let value: number = (7 - parseInt(configuration?.total_working_days_in_week));
      if (Number.isInteger(value)) {
        return value;
      }
    }
    return 0;
  }
  // whether all the days are submitted or not
  isTimesheetSubmitted(showAlert) {
    let isAllSubmitted = true;
    this.missingWeekOffIndexes = [];
    if (this.timesheetArr) {
      let count = 0;
      let allowedWeekOff: number = 1;
      let weekOffCount: number = 0;
      for (let i = 0; i < this.calendar?.length; i++) {
        if (i == 0) {
          allowedWeekOff = this.getAllowedWeekOff(0);
        }
        if ((i != 0 && i % 7 === 0) || this.calendar.length - 1 === i) {   //(i != 0 && i % 7 ===  0) 
          if ((i != 0 && i % 7 === 0) && this.calendar.length - 1 !== i) {
            if (count === 7) {
              if (weekOffCount != allowedWeekOff) {
                this.missingWeekOffIndexes.push(Math.round(i / 7) - 1);
              }
            }
            weekOffCount = 0;
            allowedWeekOff = 1;
            count = 0;
          }
          const configIndex = Math.floor(i / 7);
          allowedWeekOff = this.getAllowedWeekOff(configIndex);
        }

        if (this.calendar[i]?.timesheet?.leave_type || this.calendar[i]?.timesheet?.check_in) {
          if (this.calendar[i]?.timesheet?.leave_type === "weekly_off") {
            weekOffCount += 1;
          }
          count += 1;
        }
        if (this.calendar.length - 1 === i) {
          if (count === 7) {
            if (weekOffCount != allowedWeekOff) {
              this.missingWeekOffIndexes.push(Math.round(i / 7) - 1);
            }
          }
          weekOffCount = 0;
          allowedWeekOff = 1;
          count = 0;
        }
        var isSubmit = this.isDataSubmitted(this.calendar[i]);
        var data = this.calendar[i];
        if (!isSubmit && !data.disableDate) {
          isAllSubmitted = false;
        }
      }
      if (!isAllSubmitted && showAlert) {
        this.alert.error("Please enter values for the days marked in red.");
      } else if (this.earnLeaveBalance < this.earned_leave) {
        isAllSubmitted = false;
        if (showAlert) {
          this.alert.error("You have applied more earned leave than remaining.");
        }
      } else if (this.missingWeekOffIndexes?.length > 0) {
        isAllSubmitted = false;
        if (showAlert) {
          let weekText = 'in ';
          this.missingWeekOffIndexes.forEach((weekoff, index) => {
            weekText = `${weekText} week ${weekoff + 1}`;
            if (index < this.missingWeekOffIndexes.length - 1) {
              weekText = `${weekText} and `;
            }
          });
          this.alert.error(`Please add week offs ${weekText}`);
        }
      }
      this.isAllSubmitted = isAllSubmitted;
    }
  }

  onSubmit(event) {
    this.isTimesheetSubmitted(true);
    this.isSubmitted = true;
  }

  timeStringToFloat(time) {
    // time="8:45";
    var hoursMinutes = time.split(/[.:]/);
    var hours = parseInt(hoursMinutes[0], 10);
    var minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
    return hours + minutes / 60;
  }

  floatToTimeString(time) {
    var hoursMinutes = time?.split(/[.:]/);
    if (hoursMinutes?.length == 2) {
      var hours = parseInt(hoursMinutes[0], 10);
      var minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
      return (hours + minutes / 60).toFixed(2);
    } else {
      return '';
    }
  }

  getValue(index, key) {
    const configData = this.getConfiguratorData(index);
    return parseFloat(this.numberStringTotime(configData[key]));
  }

  numberStringTotime(number) {
    let sign = (number >= 0) ? 1 : -1;
    number = number * sign;
    let hour = Math.floor(number);
    let decpart = number - hour;
    let min = 1 / 60;
    decpart = min * Math.round(decpart / min);
    let minute = Math.floor(decpart * 60) + '';
    if (minute.length < 2) {
      minute = '0' + minute;
    }
    sign = Number(sign == 1 ? '' : '-');
    return sign + hour + '.' + minute;
  }

  openMoreOption(day: string, index: number) {
    // this.getWeekForMarkOff(day);
    this.checkForWeeklyOff(day);
    this.selectedIndex = index;
  }

  closeMoreOption(index: number) {
    this.selectedIndex = null;
  }

  getLocationType(location) {
    this.basicInfoLocationType = location;
    if (!this.selectedWorkLocation) {
      this.selectedWorkLocation = location;
      this.setClientHoliday();
    }
  }

  checkIfAssignmentClosed() {
    if (this.isVendorWorker == true && this.assignmentDetails?.assignment?.status?.toLowerCase() === 'closed' && !isEmptyObject(this.configuratorData)) {
      const grace_period = this.accountDetails?.role?.organization_category?.toLowerCase() == UsersType.VENDOR?.toLowerCase() ? this.configuratorData?.vendor_grace_period : this.configuratorData?.worker_grace_period;
      let allowedDateToEditAssignment = this.addDays(this.assignmentDetails?.assignment?.end_date, parseInt(grace_period));
      if (this.assignmentDetails?.assignment?.temporary_access?.length > 0) {
        const temporary_access = this.assignmentDetails.assignment.temporary_access.filter(temp_access => { return temp_access.module_type === "timesheet" });
        if (temporary_access?.length > 0) {
          if (temporary_access[0].module_action?.submit?.is_allow) {
            let userCategory = this.accountDetails?.role?.organization_category?.toLowerCase();
            if (userCategory?.toLowerCase() === UsersType.CANDIDATE.toLowerCase()) {
              userCategory = UsersType.WORKER?.toLowerCase();
            }
            const option = temporary_access[0].module_action?.submit.option?.filter(option => { return option?.user_type?.toLowerCase() === userCategory });
            if (option?.length > 0 && option[0].is_allow) {
              const grace_type = option[0].type?.toLowerCase();
              if (grace_type === TimesheetGracePeriod.HOUR?.toLowerCase()) {
                let effective_date = temporary_access[0].effective_date?.replaceAll("-", "/"); // to work in safari, replaced - with /
                effective_date += this.assignmentDetails?.assignment?.timezone ? " " + this.assignmentDetails?.assignment?.timezone?.toUpperCase() : "";
                allowedDateToEditAssignment = new Date(effective_date);
                const hours = allowedDateToEditAssignment?.getHours() + parseInt(option[0].period || 0);
                if (new Date().getTime() > allowedDateToEditAssignment?.setHours(hours)) {
                  // changed due to V2M-28948
                  this.isAssignmentClosed = this.timesheetInfoDetails?.actions_allow?.can_save ? false : true;
                }
                return;
              } else {
                const effective_date = temporary_access[0].effective_date?.split(" ");
                if (effective_date?.length > 0) {
                  const grace_period = option[0].type?.toLowerCase() == TimesheetGracePeriod.MONTH.toLowerCase() ? (option[0].period * 30) : option[0].type?.toLowerCase() == TimesheetGracePeriod?.WEEK.toLowerCase() ? (option[0].period * 7) : option[0].period;
                  allowedDateToEditAssignment = this.addDays(effective_date[0], parseInt(grace_period));
                }
              }
            }
          }
        }
      }
      //if todays date is less then equal to alloweddate
      if (new Date().setHours(0, 0, 0, 0) > allowedDateToEditAssignment.setHours(0, 0, 0, 0)) {
        this.isAssignmentClosed = this.timesheetInfoDetails?.actions_allow?.can_save ? false : true;
      }
    }
  } 

  addDays(dateString: string, noOfDays: number = 0) {
    const date = dateString?.split("-");
    if (date?.length === 3) {
      const new_Date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0); //new Date(duration?.start_date+ " 00:00:00"); fixed for safari
      new_Date.setDate(new_Date.getDate() + noOfDays);
      return new_Date;
    }
    return null;
  }

  openAssignmentDetailPanel(event) {
    if (this.authorizationService.authorize("view_assignment")) {
      this.eventStream.emit(new EmitEvent(Events.VIEW_ASSIGNMENT_TIMESHEET, { value: true, assignment: this.assignmentDetails }));
    }
  }
  setCustomFieldsFormValid(event) {
    this.isCustomFieldsValid = event;
  }
  customFieldUpdated(event) {
    this.customFields = event;
    this.customFields.filter(ele => ele?.values).map(element => {
      return {
        key: element?.slug,
        value: element.values
      }
    }); 
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}

export class CalendarDate {
  public date: Date;
  public title: string;
  public isPastDate: boolean;
  public isToday: boolean;
  public timesheet: any;

  public getDateString() {
    return this.date.toISOString().split("T")[0]
  }

  constructor(d: Date) {
    this.date = d;
    this.isPastDate = d.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
    this.isToday = d.setHours(0, 0, 0, 0) == new Date().setHours(0, 0, 0, 0);
  }


}