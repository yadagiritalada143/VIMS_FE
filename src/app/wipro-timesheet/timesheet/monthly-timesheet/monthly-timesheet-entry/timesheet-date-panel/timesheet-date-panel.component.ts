import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { ClonerService } from 'src/app/core/services/cloner.service';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { TimesheetConstants, TimesheetStatus } from 'src/app/wipro-timesheet/timesheet.enums';
import { Subscription } from 'rxjs';
import { isEmptyObject } from 'src/app/wipro-timesheet/timesheet.utils';
@Component({
  selector: 'app-monthly-timesheet-date-panel',
  templateUrl: './timesheet-date-panel.component.html',
  styleUrls: ['./timesheet-date-panel.component.scss']
})
export class MonthlyTimesheetDatePanelComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  public holidayName: string = "Client Holiday";
  @Input() selectedDate;
  @Input() selectedTimeSheet;
  @Input() configuration;
  @Input() selectedWeekIndex;
  @Input() timesheetData;
  @Input() timesheetStatus;
  @Input() assignmentDetails;
  @Input() infoDetails;
  @Input() currentIndex;
  @Input() set selectedWorkLocation(data) {
    if (data?.toLowerCase()?.includes('wipro')) {
      this.holidayName = "Wipro Holiday";
    } else {
      this.holidayName = "Client Holiday";
    }
  };
  @Input() leaveCount;
  @Input() calendar;
  @Input() working_days;
  showTime: string = '';
  markAsLeave: boolean = false;
  leaveDuration;
  editTimesheetModal;
  disabledField: any;
  public breakLimit: any;
  document: any;
  @Output() onClose = new EventEmitter();
  public timesheetForm: UntypedFormGroup;
  submitted: boolean = false;
  timesheetId: string = undefined;
  timeDifference: any = undefined;
  warningMessage: string = undefined;
  timeInOutTimeError: string = undefined;
  breakInOutTimeError: string = undefined;
  timeFormatRegex: string = "^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$";
  isbreakEnabled: boolean = false;
  currentTimesheetData;
  disableWeekOff: boolean = false;
  private accountDetails = this.storageService.get('account');
  private userDetails = this.storageService.get('user');
  isVendorWorker = false;
  markLWP: string = undefined;
  isSubmitted: boolean = false;
  oldDetailsForselectedCalendar: any = undefined;
  confirmBox = false;
  checkInDatePickerOptions: any = undefined;
  checkOutDatePickerOptions: any = undefined;
  breakInDatePickerOptions: any = undefined;
  breakOutDatePickerOptions: any = undefined;
  dayValue: number = (1000 * 60 * 60 * 24);
  timesheetStatuses = TimesheetStatus;
  constructor(
    private fb: UntypedFormBuilder,
    private timesheetService: TimesheetService,
    private alert: AlertService,
    private datePipe: DatePipe,
    private storageService: StorageService,
    private eventStream: EventStreamService,
    private clonerService: ClonerService
  ) { }

  get timesheet() { return this.timesheetForm.controls; }

  ngOnInit(): void {
    this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
    this.timesheetId = this.currentTimesheetData?.timesheet_uuid || this.currentTimesheetData?.timesheet_id;
    this.editViewCheck(this.selectedTimeSheet?.timesheet)
    if (this.selectedTimeSheet?.timesheet?.leave_status) {
      this.markAsLeave = true;
    }
    const selectedDate = this.formatDateInRequiredFormat(this.selectedDate, "yyyy-MM-dd");
    this.timesheetForm = this.fb.group({
      check_in_date: [selectedDate, [Validators.required]],
      check_in: [null, [Validators.required, Validators.pattern(this.timeFormatRegex)]],
      check_out_date: [selectedDate, [Validators.required]],
      check_out: [null, [Validators.required, Validators.pattern(this.timeFormatRegex)]],
      timeDifference: [null],
      break_in_date: [selectedDate],
      break_out_date: [selectedDate],
      breakIn: ['', [Validators.pattern(this.timeFormatRegex)]],
      breakOut: ['', [Validators.pattern(this.timeFormatRegex)]],
      leaveType: [null, ''],
      leaveStatus: [null, ''],
      notes: [null, ''],
      document: [null, ''],
    });
    if (this.selectedTimeSheet) {
      this.checkInDatePickerOptions = { enabledDateRanges: [{ start: new Date(this.selectedDate), end: new Date(this.selectedDate?.getTime() + this.dayValue) }] };
      this.checkOutDatePickerOptions = { enabledDateRanges: [{ start: new Date(this.selectedDate), end: new Date(this.selectedDate?.getTime() + this.dayValue) }] };
      this.breakInDatePickerOptions = { enabledDateRanges: [{ start: new Date(this.selectedDate), end: new Date(this.selectedDate) }] };
      this.breakOutDatePickerOptions = { enabledDateRanges: [{ start: new Date(this.selectedDate), end: new Date(this.selectedDate) }] };
      if (this.selectedTimeSheet?.timesheet && !this.selectedTimeSheet?.timesheet?.breaks) {
        this.selectedTimeSheet.timesheet.breaks = new Array();
      }
      if (this.selectedTimeSheet?.timesheet?.check_in || this.selectedTimeSheet?.timesheet?.leave_type) {
        this.timesheetForm.patchValue({
          check_in: this.selectedTimeSheet?.timesheet?.check_in,
          check_out: this.selectedTimeSheet?.timesheet?.check_out,
          check_in_date: this.selectedTimeSheet?.timesheet?.check_in_date || selectedDate,
          check_out_date: this.selectedTimeSheet?.timesheet?.check_out_date || selectedDate,
          breakIn: this.selectedTimeSheet?.timesheet?.breaks[0]?.break_out,
          breakOut: this.selectedTimeSheet?.timesheet?.breaks[0]?.break_in,
          break_in_date: this.selectedTimeSheet?.timesheet?.breaks[0]?.break_out_date || selectedDate,
          break_out_date: this.selectedTimeSheet?.timesheet?.breaks[0]?.break_in_date || selectedDate,
          leaveType: this.selectedTimeSheet?.timesheet?.leave_type,
          leaveStatus: this.selectedTimeSheet?.timesheet?.leave_status,
          notes: this.selectedTimeSheet?.timesheet?.notes,
          document: this.selectedTimeSheet?.timesheet?.document
        });
        if (this.selectedDate && this.timesheetForm?.value?.check_out_date) {
          this.breakInDatePickerOptions = { enabledDateRanges: [{ start: new Date(this.selectedDate), end: new Date(this.timesheetForm?.value?.check_out_date) }] };
          this.breakOutDatePickerOptions = { enabledDateRanges: [{ start: new Date(this.selectedDate), end: new Date(this.timesheetForm?.value?.check_out_date) }] };
        }
      }
      if (this.selectedTimeSheet?.timesheet?.document) {
        this.document = this.selectedTimeSheet?.timesheet?.document;
      }
      if (this.selectedTimeSheet?.timesheet?.leave_type) {
        this.durationUpdate(this.timesheetForm.value.leaveType)
      }
      this.validationChecks(undefined);
      this.checkForWeeklyOff();
    } else {
      this.checkInDatePickerOptions = { enabledDateRanges: [{ start: new Date(this.selectedDate), end: new Date(this.selectedDate?.getTime() + this.dayValue) }] };
      this.checkOutDatePickerOptions = { enabledDateRanges: [{ start: new Date(this.selectedDate), end: new Date(this.selectedDate?.getTime() + this.dayValue) }] };
      this.breakInDatePickerOptions = { enabledDateRanges: [{ start: new Date(this.selectedDate), end: new Date(this.selectedDate) }] };
      this.breakOutDatePickerOptions = { enabledDateRanges: [{ start: new Date(this.selectedDate), end: new Date(this.selectedDate) }] };
    }
    this.isbreakEnabled = this.configuration?.is_break_enable;
    this.subscriptions.push(this.eventStream.on(Events.UPDATE_CURRENT_TIMESHEET_DETAILS).subscribe((data) => {
      this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
      this.timesheetId = this.currentTimesheetData?.timesheet_uuid || this.currentTimesheetData?.timesheet_id;
      if (data?.updateTimesheet && data?.timesheet != undefined) {
        this.timesheetData = data.timesheet;
      }
      if (data?.updateCalendar && data?.calendar != undefined) {
        this.calendar = data.calendar;
      }
      this.timesheetStatus = this.currentTimesheetData?.status?.toLowerCase();
    }));
    if (this.accountDetails?.role?.organization_category?.toLowerCase() == 'VENDOR'.toLowerCase() || this.userDetails?.is_candidate) {
      this.isVendorWorker = true;
    }
    this.onValueChanges();
  }

  checkCheckInOutValidation(index) {
    if (index > 0 && index + 1 < this.calendar.length) {
      let checkInDate = this.timesheetForm.get('check_in_date')?.value;
      if (checkInDate) {
        checkInDate = this.formatDateInRequiredFormat(checkInDate, "yyyy-MM-dd");//this.datePipe.transform((new Date(checkInDate)), "yyyy-MM-dd");
      }
      let checkOutDate = this.timesheetForm.get('check_out_date')?.value;
      if (checkOutDate) {
        checkOutDate = this.formatDateInRequiredFormat(checkOutDate, "yyyy-MM-dd");//this.datePipe.transform((new Date(checkOutDate)), "yyyy-MM-dd");
      }
      const previousDayData = this.calendar[index - 1];
      const nextDayData = this.calendar[index + 1];
      if (previousDayData?.timesheet?.check_out && checkInDate === previousDayData.timesheet.check_out_date) {
        //checkout
        const checkInValue = this.timesheetForm.get('check_in').value;
        const timeDifference = this.calculateTimeDifference(previousDayData.timesheet.check_out, checkInValue, this.format(previousDayData.timesheet.check_out_date), this.format(checkInDate));
        this.setError((timeDifference?.hours < 0 || timeDifference?.minutes < 0), this.timesheetForm.get('check_in'), "previous_day_check_in_validation", "This time is already considered in previous day");
      }
      if (nextDayData?.timesheet?.check_in && checkOutDate === nextDayData.timesheet.check_in_date) {
        //check in
        const checkOutValue = this.timesheetForm.get('check_out').value;
        const checkOutDate = this.timesheetForm.get('check_out_date').value;
        const timeDifference = this.calculateTimeDifference(checkOutValue, nextDayData.timesheet.check_in, this.format(checkOutDate), this.format(nextDayData.timesheet.check_in_date));
        this.setError((timeDifference?.hours < 0 || timeDifference?.minutes < 0), this.timesheetForm.get('check_out'), "next_day_check_in_validation", "This time is already considered in next day");
      }
    }
  }

  onValueChanges(): void {
    this.subscriptions.push(this.timesheetForm?.get('check_in_date')?.valueChanges.subscribe(val => {
      this.breakInDatePickerOptions = this.clonerService.deepClone(this.checkOutDatePickerOptions);
      this.breakOutDatePickerOptions = this.clonerService.deepClone(this.checkOutDatePickerOptions);
      if (this.timesheetForm.get('check_in')?.value) {
        this.checkTimeFormat('check_in');
      }
      this.validateBreakTime();
    }));
    this.subscriptions.push(this.timesheetForm?.get('check_out_date')?.valueChanges.subscribe(val => {
      this.breakInDatePickerOptions = this.clonerService.deepClone(this.checkOutDatePickerOptions);
      this.breakOutDatePickerOptions = this.clonerService.deepClone(this.checkOutDatePickerOptions);
      if (this.timesheetForm.get('check_out')?.value) {
        this.checkTimeFormat('check_out');
      }
      this.validateBreakTime();
    }));
    this.subscriptions.push(this.timesheetForm?.get('break_in_date')?.valueChanges.subscribe(val => {
      if (this.timesheetForm.get('breakIn')?.value) {
        this.checkTimeFormat('breakIn');
      }
    }));
    this.subscriptions.push(this.timesheetForm?.get('break_out_date')?.valueChanges.subscribe(val => {
      if (this.timesheetForm.get('breakOut')?.value) {
        this.checkTimeFormat('breakOut');
      }
    }));
  }
  get controls() {
    return this.timesheetForm.controls;
  }

  checkForStatus(status) {
    return (this.timesheetStatus?.toLowerCase() === status);
  }
  //check char codes for time inputs
  checkTimePattern(event) {
    if (event) {
      let allowedkeys = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 32, 65, 77, 80, 97, 109, 112];
      if (allowedkeys.includes(event.charCode)) {

      } else {
        event.preventDefault();
        return false;
      }
    }
  }
  // uppercase time inputs and add space for time in/out, break in/out
  checkTimeFormat(controlName) {
    if (controlName == 'check_in') {
      let check_in = this.timesheetForm.get('check_in');
      check_in.setValue(check_in?.value?.toUpperCase());
      if (check_in?.value?.slice(check_in?.value?.length - 3) !== ' AM' && check_in?.value.slice(check_in?.value?.length - 3) !== ' PM') {
        check_in.setValue(check_in?.value?.trim().replace(/.{2}$/, ' $&'));
      }
      if (check_in?.value) {
        check_in.setValue(this.formatTime(check_in.value));
      }
      this.validationChecks(controlName);
    } else if (controlName == 'check_out') {
      let check_out = this.timesheetForm.get('check_out');
      check_out.setValue(check_out?.value?.toUpperCase());
      if (check_out?.value?.slice(check_out?.value?.length - 3) !== ' AM' && check_out?.value.slice(check_out?.value?.length - 3) !== ' PM') {
        check_out.setValue(check_out?.value?.trim().replace(/.{2}$/, ' $&'));
      }
      if (check_out?.value) {
        check_out.setValue(this.formatTime(check_out.value));
      }
      this.validationChecks(controlName);
    } else if (controlName == 'breakIn') {
      let breakIn = this.timesheetForm.get('breakIn');
      breakIn.setValue(breakIn?.value?.toUpperCase());
      if (breakIn?.value.slice(breakIn?.value?.length - 3) !== ' AM' && breakIn?.value.slice(breakIn?.value?.length - 3) !== ' PM') {
        breakIn.setValue(breakIn?.value?.trim().replace(/.{2}$/, ' $&'));
      }
      if (breakIn?.value) {
        breakIn.setValue(this.formatTime(breakIn.value));
      }
      this.validateBreakTime();
    } else if (controlName == 'breakOut') {
      let breakOut = this.timesheetForm.get('breakOut');
      breakOut.setValue(breakOut?.value?.toUpperCase());
      if (breakOut?.value.slice(breakOut?.value?.length - 3) !== ' AM' && breakOut?.value.slice(breakOut?.value?.length - 3) !== ' PM') {
        breakOut.setValue(breakOut?.value?.trim().replace(/.{2}$/, ' $&'));
      }
      if (breakOut?.value) {
        breakOut.setValue(this.formatTime(breakOut.value));
      }
      this.validateBreakTime();
    }
    this.checkBreakTimeLimit(this.timesheetForm.get('breakIn')?.value, this.timesheetForm.get('breakOut')?.value);
  }

  formatTime(str) {
    let numberArray = str?.split(":");
    if (numberArray?.length > 1) {
      const hours = parseInt(numberArray[0]);
      const value = hours < 10 ? "0" + hours + ":" + numberArray[1] : str;
      return (!value?.includes("undefined")) ? value : str;
    } else {
      return str;
    }
  }

  validationChecks(controlName) {
    const check_in = this.timesheetForm.get('check_in');
    const check_out = this.timesheetForm.get('check_out');
    if (check_in?.value && !this.timesheetForm.controls.check_in?.errors?.pattern) {
      this.checkCheckInOutValidation(this.currentIndex);
    } else if (check_out?.value && !this.timesheetForm.controls.check_out?.errors?.pattern) {
      this.checkCheckInOutValidation(this.currentIndex);
    }
    if (check_in?.value && !this.timesheetForm.controls.check_in?.errors?.pattern &&
      check_out?.value && !this.timesheetForm.controls.check_out?.errors?.pattern) {
      const check_in_date = this.timesheetForm.get('check_in_date')?.value || this.selectedDate;
      const check_out_date = this.timesheetForm.get('check_out_date')?.value || this.selectedDate;
      this.timeDifference = this.calculateTimeDifference(check_in?.value, check_out?.value, this.format(check_in_date), this.format(check_out_date));
      if (check_in.value == check_out.value) {
        this.setError(true, this.timesheetForm.get('check_in'), "Check_in_time_greater_check_out_error", "Time In cannot be same as Time Out");
      } else if (this.timeDifference.hours < 0 || this.timeDifference.minutes < 0) {
        this.setError(true, this.timesheetForm.get('check_in'), "Check_in_time_greater_check_out_error", "Time In cannot be greater than Time Out");
      } else {
        this.setError(false, this.timesheetForm.get('check_in'), "Check_in_time_greater_check_out_error", "Time In cannot be greater than Time Out");
        this.checkForWarning();
      }
      if (this.timeDifference) {
        const calculatedDifference = this.timeStringToFloat(this.timeDifference?.hours + ":" + this.timeDifference?.minutes)
        const allowed_daily_hours = parseFloat(this.configuration?.allowed_daily_hours);
        if (calculatedDifference > allowed_daily_hours) {
          this.setError(true, this.timesheetForm.get('check_out'), "Check_out_time_check_in_error", `Time difference cannot exceeds more than ${allowed_daily_hours} hours`);
          return;
        } else {
          this.setError(false, this.timesheetForm.get('check_out'), "Check_out_time_check_in_error", "");
          this.getTimeInOutError();
        }
      }
    } else {
      this.getTimeInOutError();
    }
  }

  setSelectedTime(data, formControlName) {
    if (data && formControlName) {
      this.timesheetForm.get(formControlName).setValue(data);
    }
    if (formControlName == 'breakIn' || formControlName == 'breakOut') {
      this.validateBreakTime();
      // this.checkTimeFormat(formControlName);
      this.checkForWarning();
      // this.getBreakInOutError();
    } else if (formControlName == 'check_in' || formControlName == 'check_out') {
      this.validationChecks(formControlName);
    }
    this.checkBreakTimeLimit(this.timesheetForm.get('breakIn')?.value, this.timesheetForm.get('breakOut')?.value);
    this.showTime = '';
  }

  check(event) {
    event.preventDefault();
    this.showTime = '';
  }

  checkForWarning() {
    if (this.timeDifference?.minutes != undefined && this.configuration) {
      const calculatedDifference = this.timeStringToFloat(this.timeDifference.hours + ":" + this.timeDifference.minutes)
      const half_day_fixed_hour = parseFloat(this.configuration.half_day_fixed_hour);
      const allowed_daily_hours = parseFloat(this.configuration.allowed_daily_hours);
      if (calculatedDifference != undefined) {
        if (!this.markAsLeave) {
          if (half_day_fixed_hour != undefined && calculatedDifference >= 0 && calculatedDifference < half_day_fixed_hour) {
            this.markLWP = 'full_day';
            this.warningMessage = "Hours entered do not qualify for half-day. This will be marked as unpaid leave.";
          } else if (half_day_fixed_hour != undefined && allowed_daily_hours != undefined && calculatedDifference >= 0 && calculatedDifference < allowed_daily_hours && calculatedDifference >= half_day_fixed_hour) {
            this.markLWP = 'half_day';
            this.warningMessage = "This will be paid as half-day. Please select other half option or it will be marked as LWP.";
          } else {
            this.markLWP = undefined;
            this.warningMessage = undefined;
          }
          if (half_day_fixed_hour != undefined && calculatedDifference >= 5) { //WIP-948 half_day_fixed_hour
            this.setBreakInOutTimeValidation([Validators.required, Validators.pattern(this.timeFormatRegex)]);
            this.getBreakInOutError();
          } else {
            this.setBreakInOutTimeValidation([Validators.pattern(this.timeFormatRegex)]);
            this.getBreakInOutError();
          }
        } else {
          const leaveStatus: any = this.timesheetForm.get('leaveStatus').value;
          if (calculatedDifference < half_day_fixed_hour && leaveStatus == 'half_day') {
            this.setError(true, this.timesheetForm.get('check_out'), "Check_out_time_check_in_half_day_error", `Duration should be minimum ${half_day_fixed_hour} hours to take half day leave`);
          } else if (calculatedDifference > allowed_daily_hours && leaveStatus == 'half_day') {
            this.setError(true, this.timesheetForm.get('check_out'), "Check_out_time_check_in_half_day_error", `Duration should not be more than ${allowed_daily_hours} hours to take half day leave`);
          } else {
            this.setError(false, this.timesheetForm.get('check_out'), "Check_out_time_check_in_half_day_error", ``);
          }
          if (half_day_fixed_hour != undefined && calculatedDifference >= 5 && !this.disabledField) {//WIP-948 half_day_fixed_hour
            this.setBreakInOutTimeValidation([Validators.required, Validators.pattern(this.timeFormatRegex)]);
            this.getBreakInOutError();
          } else {
            this.setBreakInOutTimeValidation([Validators.pattern(this.timeFormatRegex)]);
          }
          this.warningMessage = undefined;
        }
      }
    }
  }

  getTimeInOutError() {
    let error = "";
    const timeInError = this.timesheetForm.get('check_in')?.errors;
    if (timeInError) {
      error = this.getPropertyValue(timeInError);
      if (typeof error === "string") {
        this.timeInOutTimeError = error;
      } else {
        if (timeInError.required) {
          this.timeInOutTimeError = "Time In is required"
        } else if (timeInError.pattern) {
          this.timeInOutTimeError = "Please provide the time in HH:MM AM/PM";
        } else {
          this.timeInOutTimeError = undefined;
        }
      }
    } else {
      const timeOutError = this.timesheetForm.get('check_out')?.errors;
      if (timeOutError) {
        error = this.getPropertyValue(timeOutError);
        if (typeof error === "string") {
          this.timeInOutTimeError = error;
        } else {
          if (timeOutError.required) {
            this.timeInOutTimeError = "Time Out is required";
          } else if (timeOutError.pattern) {
            this.timeInOutTimeError = "Please provide the time in HH:MM AM/PM";
          } else {
            this.timeInOutTimeError = undefined;
          }
        }
      }
    }
    return this.timeInOutTimeError;
  }

  getBreakInOutError() {
    let error = "";
    const breakInError = this.timesheetForm.get('breakIn')?.errors;
    if (breakInError) {
      error = this.getPropertyValue(breakInError);
      if (typeof error === "string") {
        this.breakInOutTimeError = error;
      } else {
        if (breakInError.required) {
          this.breakInOutTimeError = "Break time out is required"
        } else if (breakInError.pattern) {
          this.breakInOutTimeError = "Please provide the time in HH:MM AM/PM";
        } else {
          this.breakInOutTimeError = undefined;
        }
      }
    } else {
      const breakOutError = this.timesheetForm.get('breakOut')?.errors;
      if (breakOutError) {
        error = this.getPropertyValue(breakOutError);
        if (typeof error === "string") {
          this.breakInOutTimeError = error;
        } else {
          if (breakOutError.required) {
            this.breakInOutTimeError = "Break Time In is required";
          } else if (breakOutError.pattern) {
            this.breakInOutTimeError = "Please provide the time in HH:MM AM/PM";
          } else {
            this.breakInOutTimeError = undefined;
          }
        }
      }
    }
    return this.breakInOutTimeError;
  }

  getPropertyValue(data) {
    if (data && typeof data == "object") {
      return data[Object.keys(data)[0]];
    } else {
      return "";
    }
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

  editViewCheck(data) {
    if (data && (data?.check_in || data?.check_out || data?.day_status || data?.leave_status || data?.leave_type)) {
      this.editTimesheetModal = true;
    } else {
      this.editTimesheetModal = false;
      document.body.classList.add("no-pointer");

    }
  }

  durationUpdate(event) {
    this.leaveDuration = event;
    const leaveStatus: any = this.timesheetForm.get('leaveStatus').value;
    let leaveTypeControl = this.timesheetForm.get('leaveType');
    if (this.markAsLeave) {
      leaveTypeControl.setValidators([Validators.required]);
      leaveTypeControl.updateValueAndValidity();
    } else {
      leaveTypeControl.setValidators(null);
      leaveTypeControl.updateValueAndValidity();
    }
    if (leaveStatus == undefined) {
      this.timesheetForm.get('leaveStatus').setValue("full_day");
      let timeInControl = this.timesheetForm.get('check_in');
      let timeOutControl = this.timesheetForm.get('check_out');
      if (event === "earned_leave" || event === "leave") {
        timeInControl.setValidators(null);
        timeOutControl.setValidators(null);
      } else {
        timeInControl.setValidators([Validators.required, Validators.pattern(this.timeFormatRegex)]);
        timeOutControl.setValidators([Validators.required, Validators.pattern(this.timeFormatRegex)]);
      }
      timeInControl.updateValueAndValidity();
      timeOutControl.updateValueAndValidity();
    } else {
      if (leaveTypeControl.value === "client_holiday" || leaveTypeControl.value === "weekly_off") {
        this.timesheetForm.get('leaveStatus').setValue("full_day");
      }
    }
    this.validateType();
  }

  checkForWeeklyOff() {
    // set the display month for UI
    let allowedWeekOff: number = 1;
    if (this.configuration?.total_working_days_in_week) {
      let value: number = (7 - parseInt(this.configuration?.total_working_days_in_week));
      if (Number.isInteger(value)) {
        allowedWeekOff = value;
      }
    }
    this.disableWeekOff = false;
    const dayNumber = this.getStartDayOfCalendar(this.configuration?.work_week?.week_start_day);
    let startingDateOfCalendar = this.getStartDateForCalendar(this.selectedDate, dayNumber);
    let lastDayOfWeek = new Date(startingDateOfCalendar);
    lastDayOfWeek = new Date(lastDayOfWeek.setDate(startingDateOfCalendar.getDate() + 7));
    let count = 0;
    let daysCount = 0;
    let daysToAdd = [];
    this.oldDetailsForselectedCalendar = undefined;
    this.calendar?.forEach(calendar => {
      if (calendar?.date) {
        const calendarDate = new Date(calendar.date);
        if (startingDateOfCalendar <= calendarDate && calendarDate < lastDayOfWeek) {
          if (calendar?.timesheet?.leave_type || calendar?.timesheet?.check_in) {
            if (!calendar?.disableDate && this.selectedDate.setHours(0, 0, 0, 0) == calendarDate.setHours(0, 0, 0, 0)) {
              this.oldDetailsForselectedCalendar = calendar;
            }
            daysCount += 1;
          } else {
            if (!calendar?.disableDate && this.selectedDate.setHours(0, 0, 0, 0) != calendarDate.setHours(0, 0, 0, 0)) {
              daysToAdd.push(calendar);
            }

          }
          if (calendar?.timesheet?.leave_type === "weekly_off" && this.selectedDate.setHours(0, 0, 0, 0) != calendarDate.setHours(0, 0, 0, 0)) {
            count += 1;
          }
        }
      }
    })
    if (count >= allowedWeekOff) { //configurator
      this.disableWeekOff = true;
    }
    return { daysCount, count, allowedWeekOff, daysToAdd };
  }

  downloadAttachment(doc) {
    const payload = {
      key: doc.key,
      filename: doc.filename
    }
    this.subscriptions.push(this.timesheetService.downloadAttachment(payload).subscribe(
      {
        next: (data: any) => {
          if (data) {
            this.alert.success('Downloaded successfully');
            var link = document.createElement('a');
            link.href = data?.data?.url;
            link.download = doc.filename;
            link.dispatchEvent(new MouseEvent('click'));
            //this.cancelApplication({close: true});
          }
        }, error: (err) => {
          if (err?.error?.error?.errors?.length > 0 && err?.error?.error?.errors[0]?.message) {
            this.alert.error(err?.error?.error?.errors[0]?.message);
          } else {
            this.alert.error("Some error occured while downloading attachment");
          }
        }
      }
    ));
  }

  setShowTimeValue(value) {
    this.showTime = value;
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

  getStartDateForCalendar(selectedDate: Date, dayNumber: number) {
    // for the day we selected let's get the previous month last day
    // let lastDayOfPreviousMonth = new Date(selectedDate.setDate(0)); - old code
    let selected = new Date(selectedDate);
    let lastDayOfPreviousMonth = new Date(selected);
    let startingDateOfCalendar: Date = lastDayOfPreviousMonth;
    if (startingDateOfCalendar.getDay() != dayNumber) {
      do {
        startingDateOfCalendar = new Date(startingDateOfCalendar.setDate(startingDateOfCalendar.getDate() - 1));
      } while (startingDateOfCalendar.getDay() != dayNumber);
    }
    return startingDateOfCalendar;
  }

  validateType() {
    let leaveStatusControl = this.timesheetForm.get('leaveStatus');
    if (leaveStatusControl.value === 'full_day' && this.markAsLeave) {
      if (this.leaveDuration === 'earned_leave' || this.leaveDuration === 'leave') {
        this.timesheetForm.get('check_in').setValue(null);
        this.timesheetForm.get('check_out').setValue(null);
        this.timesheetForm.get('breakIn').setValue(null);
        this.timesheetForm.get('breakOut').setValue(null);
        this.removeInOutTime();
        this.setBreakInOutTimeValidation([Validators.pattern(this.timeFormatRegex)]);
        this.disabledField = true;
      } else {
        this.disabledField = false;
      }
      this.removeInOutTime();
      this.setBreakInOutTimeValidation([Validators.pattern(this.timeFormatRegex)]);
    } else {
      this.disabledField = false;
      this.resetInOutTime()
    }
    this.checkForWarning();
  }

  validateBreakTime() {
    let breakIn = this.timesheetForm.get('breakIn');
    let breakOut = this.timesheetForm.get('breakOut');
    let check_in = this.timesheetForm.get('check_in');
    let check_out = this.timesheetForm.get('check_out');

    if ((breakIn.value && !breakOut.value || (!breakIn.value && breakOut.value))) {
      this.setBreakInOutTimeValidation([Validators.required, Validators.pattern(this.timeFormatRegex)]);
    }
    if (breakIn.value && breakOut.value) {
      this.checkBreakTimeLimit(breakIn.value, breakOut.value);
    }
    if (!breakIn.value && !breakOut.value) {
      this.setBreakInOutTimeValidation([Validators.pattern(this.timeFormatRegex)]);
      this.checkForWarning();
    }
    let limit = this.configuration?.allowed_daily_hours;

    if (breakIn?.value) {
      if (check_in?.value && check_in.valid) {
        const check_in_date = this.timesheetForm.get('check_in_date')?.value || this.selectedDate;
        const break_in_date = this.timesheetForm.get('break_in_date')?.value || this.selectedDate;
        const timeDifference = this.calculateTimeDifference(check_in.value, breakIn.value, this.format(check_in_date), this.format(break_in_date));
        const time = parseFloat(timeDifference?.hours + "." + timeDifference?.minutes);
        const condition = timeDifference?.hours < 0 || timeDifference?.minutes < 0;
        this.setError(condition, breakIn, "break_time_check_in_error", "Break time cannot taken before Time In hours");
        this.setError((time > limit), breakIn, "break_time_check_out_limit_error", "Break time cannot taken after Time out hours");
      }
      if (check_out?.value && check_out.valid) {
        const check_out_date = this.timesheetForm.get('check_out_date')?.value || this.selectedDate;
        const break_in_date = this.timesheetForm.get('break_in_date')?.value || this.selectedDate;
        const timeDifference = this.calculateTimeDifference(breakIn.value, check_out?.value, this.format(break_in_date), this.format(check_out_date));
        const condition = timeDifference?.hours < 0 || timeDifference?.minutes < 0;
        this.setError(condition, breakIn, "break_time_check_out_error", "Break time cannot taken after Time Out hours");
      }
    }
    if (breakOut.value) {
      if (check_in?.value && check_in.valid) {
        const check_in_date = this.timesheetForm.get('check_in_date')?.value || this.selectedDate;
        const break_out_date = this.timesheetForm.get('break_out_date')?.value || this.selectedDate;
        const timeDifference = this.calculateTimeDifference(check_in.value, breakOut.value, this.format(check_in_date), this.format(break_out_date));
        const time = parseFloat(timeDifference?.hours + "." + timeDifference?.minutes);
        const condition = timeDifference?.hours < 0 || timeDifference?.minutes < 0;
        this.setError(condition, breakOut, "break_out_time_check_in_error", "Break In time cannot taken before Time In hours");
        this.setError((time > limit), breakOut, "break_in_time_check_out_limit_error", "Break In time cannot taken after Time out hours");
      }
      if (check_out?.value && check_out.valid) {
        const check_out_date = this.timesheetForm.get('check_out_date')?.value || this.selectedDate;
        const break_out_date = this.timesheetForm.get('break_out_date')?.value || this.selectedDate;
        const timeDifference = this.calculateTimeDifference(breakOut.value, check_out.value, this.format(break_out_date), this.format(check_out_date));
        const condition = timeDifference?.hours < 0 || timeDifference?.minutes < 0;
        this.setError(condition, breakOut, "break_out_time_check_out_error", "Break In time cannot taken after Time Out hours");
      }
    }
    this.getBreakInOutError();
  }

  setError(condition, control, errorCode, message) {
    let errors = control.errors || null;
    if (condition) {
      errors = { ...errors };
      errors[errorCode] = message;
    } else {
      if (errors && isEmptyObject(errors)) {
        errors = null;
      }
      if (errors) {
        delete errors[errorCode];
        if (errors && isEmptyObject(errors)) {
          errors = null;
        }
      }
    }
    control.setErrors(errors);
    this.getTimeInOutError();
    this.getBreakInOutError();
  }

  checkBreakTimeLimit(f, s) {
    if (f && s) {
      const break_in_date = this.timesheetForm.get('break_in_date')?.value || this.selectedDate;
      const break_out_date = this.timesheetForm.get('break_out_date')?.value || this.selectedDate;
      let timeData = this.validateMinute(f, s, this.format(break_in_date), this.format(break_out_date));
      const calculatedDifference = this.timeStringToFloat(timeData.hours + ":" + timeData.minutes);
      const breakIn = this.timesheetForm.get('breakIn');
      const breakOut = this.timesheetForm.get('breakOut');
      if (breakIn.value == breakOut.value) {
        this.setError(true, breakIn, "break_time_limit_error", `Break In value cannot be same as Break Out`);
      } else if (this.configuration?.is_allowed_break_limit && calculatedDifference > this.configuration.break_hour_limit) {
        this.setError(true, breakIn, "break_time_limit_error", `Break time cannot be more than ${this.configuration.break_hour_limit} hour`);
      } else {
        this.setError(false, breakIn, "break_time_limit_error", "");
      }
      if (timeData.hours < 0 || timeData.minutes < 0) {
        this.setError(true, this.timesheetForm.get('breakIn'), "break_in_time_greater_break_out_error", "Break Out time cannot be greater than Break In time");
      } else {
        this.setError(false, this.timesheetForm.get('breakIn'), "break_in_time_greater_break_out_error", "");

      }
    }
  }

  removeInOutTime() {
    let check_in = this.timesheetForm.get('check_in');
    let check_out = this.timesheetForm.get('check_out');
    check_in.setValidators(null);
    check_out.setValidators(null);
    check_in.updateValueAndValidity();
    check_out.updateValueAndValidity();
  }

  setBreakInOutTimeValidation(validators) {
    let breakIn = this.timesheetForm.get('breakIn');
    let breakOut = this.timesheetForm.get('breakOut');
    breakIn.setValidators(validators);
    breakOut.setValidators(validators);
    breakIn.updateValueAndValidity();
    breakOut.updateValueAndValidity();
  }

  resetInOutTime() {
    let check_in = this.timesheetForm.get('check_in');
    let check_out = this.timesheetForm.get('check_out');
    check_in.setValidators([Validators.required, Validators.pattern(this.timeFormatRegex)]);
    check_out.setValidators([Validators.required, Validators.pattern(this.timeFormatRegex)]);
    check_in.updateValueAndValidity();
    check_out.updateValueAndValidity();
  }

  cancelDayTimesheet(emitData) {
    this.onClose.emit(emitData)
    document.body.classList.remove("no-pointer");
  }

  markLeave() {
    let leaveTypeControl = this.timesheetForm.get('leaveType');
    let leaveStatusControl = this.timesheetForm.get('leaveStatus');
    this.timesheetForm.get('notes').setValue(null);
    if (this.markAsLeave) {
      this.markLWP = undefined;
      this.warningMessage = undefined;
      this.breakLimit = false;

      leaveTypeControl.setValidators([Validators.required]);
      leaveStatusControl.setValidators([Validators.required]);
      this.removeInOutTime();
      this.timesheetForm.get('breakIn').reset();
      this.timesheetForm.get('breakOut').reset();
      this.timesheetForm.get('check_in').reset();
      this.timesheetForm.get('check_out').reset();
    } else {
      leaveTypeControl.reset();
      leaveStatusControl.reset();
      leaveTypeControl.setValidators(null);
      leaveStatusControl.setValidators(null);
    }
    leaveTypeControl.updateValueAndValidity();
    leaveStatusControl.updateValueAndValidity();
    this.timeDifference = undefined;
    this.validateType();
    this.validationChecks(undefined);
    this.checkForWeeklyOff();
  }

  editTimesheet(timesheet) {
    if (timesheet?.leave_type === "weekly_off") {
      const details = this.checkForWeeklyOff();
      details.count += 1;
      if (details && details.allowedWeekOff <= details.count
        && (7 - (details.daysCount)) == (details.allowedWeekOff - details.count)) {
        this.alert.error("You cannot edit this entry.")
        return;
      }
    }
    document.body.classList.add("no-pointer");
    this.editTimesheetModal = false;
  }

  //WIP-1484- modified below code to fix US timezone issue
  formatDateInRequiredFormat(inputDate, format) {
    if (typeof (inputDate) === "object") {
      return this.datePipe.transform((new Date(inputDate)), format);
    } else if (typeof (inputDate) === "string") {
      let date: any = inputDate?.split("-");
      if (date?.length === 3) {
        date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0);// new Date( this.currentTimesheetData?.start_date); //fixed for safari
      }
      return this.datePipe.transform(date, format);
    }
    return inputDate;
  }

  saveDayTimesheet() {
    this.submitted = true;
    const allowed_daily_hours = parseFloat(this.configuration?.allowed_daily_hours);
    if (this.timeDifference) {
      const calculatedDifference = this.timeStringToFloat(this.timeDifference?.hours + ":" + this.timeDifference?.minutes)
      if (calculatedDifference > allowed_daily_hours) {
        this.setError(true, this.timesheetForm.get('check_out'), "Check_out_time_check_in_error", `Time difference cannot exceeds more than ${allowed_daily_hours} hours`);
        return;
      } else {
        this.setError(false, this.timesheetForm.get('check_out'), "Check_out_time_check_in_error", "");
        this.getTimeInOutError();
      }
    }
    if (this.timesheetForm.valid) {
      let form = this.timesheetForm.value;
      if (form?.breakIn && form?.breakOut) {
        if (!form?.check_in || !form?.check_out) {
          this.alert.error('Please provide Time In/Out');
          return false;
        }
      }
      let timesheetData = [];
      let timesheetId = this.timesheetId;
      if (this.markLWP && !this.markAsLeave && form) {
        form.leaveType = "leave";
        form.leaveStatus = this.markLWP;
      }
      const selectedDate = this.formatDateInRequiredFormat(this.selectedDate, "yyyy-MM-dd");
      const check_in_date = this.formatDateInRequiredFormat(form?.check_in_date, "yyyy-MM-dd");
      const check_out_date = this.formatDateInRequiredFormat(form?.check_out_date, "yyyy-MM-dd");
      if (this.timesheetStatus?.toLowerCase() === TimesheetStatus.REJECTED || this.timesheetStatus?.toLowerCase() === TimesheetStatus.WITHDRAWN) {
        timesheetId = undefined;
        if (this.timesheetData?.length > 0) {
          timesheetData = JSON.parse(JSON.stringify(this.timesheetData));
          this.timesheetData?.forEach((timesheet, index) => {
            if (timesheet?.date === selectedDate) {
              timesheetData[index] = {
                date: selectedDate,
                breaks: [],
                type: null,
                day_status: form.leaveType ? "absent" : null,
                leave_type: form.leaveType,
                leave_status: form.leaveStatus,
                check_in: form.check_in,
                check_out: form.check_out,
                check_in_date: check_in_date,
                check_out_date: check_out_date,
                notes: form.notes,
                overnight: check_in_date === check_out_date ? false : true,
                document: this.document
              }

              if (form.breakIn && form.breakOut) {
                timesheetData[index].breaks = [{
                  break_out: form.breakIn,
                  break_in: form.breakOut,
                  break_out_date: this.formatDateInRequiredFormat(form?.break_in_date, "yyyy-MM-dd"),
                  break_in_date: this.formatDateInRequiredFormat(form?.break_out_date, "yyyy-MM-dd")
                }];
              }
            }
          });
        }
      } else {
        timesheetData = [{
          date: selectedDate,
          breaks: [],
          type: null,
          day_status: form.leaveType ? "absent" : null,
          leave_type: form.leaveType,
          leave_status: form.leaveStatus,
          overnight: check_in_date === check_out_date ? false : true,
          check_in: form.check_in,
          check_out: form.check_out,
          check_in_date: check_in_date,
          check_out_date: check_out_date,
          notes: form.notes,
          document: this.document
        }];
        if (form.breakIn && form.breakOut) {
          timesheetData[0].breaks = [{
            break_out: form.breakIn,
            break_in: form.breakOut,
            break_out_date: this.formatDateInRequiredFormat(form?.break_in_date, "yyyy-MM-dd"),
            break_in_date: this.formatDateInRequiredFormat(form?.break_out_date, "yyyy-MM-dd"),
          }];
        }
        const details = this.checkForWeeklyOff();
        if (form.leaveType === "weekly_off") {
          details.count += 1;
        }
        if ((this.oldDetailsForselectedCalendar?.timesheet?.leave_type || this.oldDetailsForselectedCalendar?.timesheet?.check_in) && details.daysCount > 0) {
          details.daysCount -= 1;
        }
        //check if selected date was weekly off earlier and not its not thn -1
        if (!this.disableWeekOff && details && details.allowedWeekOff > details.count &&
          (7 - (details.daysCount + 1)) == (details.allowedWeekOff - details.count)) {
          for (let i = 0; i < details?.daysToAdd?.length; i++) {
            timesheetData.push({
              date: this.formatDateInRequiredFormat(details?.daysToAdd?.[i]?.date, "yyyy-MM-dd"),
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
            });
            if (i + 1 == (details.allowedWeekOff - details.count)) { //this is to add 1 more limit to add allowed no of week off
              break;
            }
          }
        }
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
        working_days: this.working_days,
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
    } else {
      this.getTimeInOutError();
      this.getBreakInOutError();
    }

    document.body.classList.remove("no-pointer");
  }

  convertdatetoMediumDate(date) {
    if (date) {
      const formattedDate = this.formatDateInRequiredFormat(date, "MMM d, y");
      if (formattedDate) {
        return `(${formattedDate})`;
      }
    }
    return date;
  }

  showLeaveType(leaveType) {
    let leaveValue = '';
    switch (leaveType) {
      case 'earned_leave':
        leaveValue = 'Earned Leave (EL)';
        break;
      case 'leave':
        leaveValue = 'Leave (Unpaid)';
        break;
      case 'comp_off':
        leaveValue = 'Compensated Time Off';
        break;
      case 'client_holiday':
        leaveValue = this.holidayName;
        break;
      case 'weekly_off':
        leaveValue = 'Weekly Off';
        break;
    }
    return leaveValue;
  }

  updateDayTimesheet(payload) {
    this.isSubmitted = true;
    payload['timesheet_uuid'] = this.currentTimesheetData?.timesheet_uuid || this.currentTimesheetData?.timesheet_id;
    this.subscriptions.push(this.timesheetService.updateDayTimesheet(payload).subscribe(
      {
        next: data => {
          if (data) {
            this.alert.success('Timesheet updated successfully');
            this.cancelDayTimesheet({ close: true });
            this.isSubmitted = false;
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
            this.currentTimesheetData.timesheet_uuid = data?.data.timesheet_id;
            this.currentTimesheetData.timesheet_id = data?.data.timesheet_id;
            this.storageService.set(TimesheetConstants.TIMESHEET, this.currentTimesheetData, true);
            this.timesheetId = data?.data?.timesheet_id;
            this.alert.success('Timesheet created successfully');
            this.cancelDayTimesheet({ close: true });
            this.isSubmitted = false;
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

  createTimesheet() {
    let timesheetData = [];
    const selectedDate = this.formatDateInRequiredFormat(this.selectedDate, "yyyy-MM-dd");
    if (this.timesheetData?.length > 0) {
      timesheetData = JSON.parse(JSON.stringify(this.timesheetData));
      this.timesheetData?.forEach((timesheet, index) => {
        if (timesheet?.date === selectedDate) {
          timesheetData.splice(index, 1);
        }
      });
    }
    let payload: any = {
      assignment_uuid: this.currentTimesheetData?.assignment_id,
      user_uuid: this.currentTimesheetData?.user_id,
      parent_type: this.currentTimesheetData?.parent_type,
      child_type: this.currentTimesheetData?.child_type,
      worker_type: "worker",
      start_date: this.currentTimesheetData?.start_date,
      end_date: this.currentTimesheetData?.end_date,
      working_days: this.working_days,
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
    this.createDayTimesheet(payload);
  }

  deleteTimesheet(timesheet) {
    if (timesheet?.leave_type === "weekly_off") {
      const details = this.checkForWeeklyOff();
      details.count += 1;
      if (details && details.allowedWeekOff <= details.count
        && (7 - (details.daysCount)) == (details.allowedWeekOff - details.count)) {
        this.alert.error("You cannot delete this entry.")
        return;
      }
    }
    this.confirmBox = true;
  }

  confirmDelete(timesheet) {
    if (this.timesheetStatus?.toLowerCase() === TimesheetStatus.REJECTED || this.timesheetStatus?.toLowerCase() === TimesheetStatus.WITHDRAWN) {
      this.createTimesheet();
    } else {
      this.subscriptions.push(this.timesheetService.deleteDayTimesheet(this.timesheetId, timesheet?.date, 'cico').subscribe(
        {
          next: data => {
            if (data) {
              this.alert.success('Timesheet deleted successfully');
              this.timesheetId = '';
              this.cancelDayTimesheet({ close: true });
            }
          }, error: (err) => {
            this.alert.error(errorHandler(err));
          }
        }
      ));
    }
  }

  cancelDelete() {
    this.confirmBox = false;
  }

  calculateHours(data) {
    if (data?.check_in && data?.check_out) {
      const check_in_date = this.timesheetForm.get('check_in_date')?.value || this.selectedDate;
      const check_out_date = this.timesheetForm.get('check_out_date')?.value || this.selectedDate;
      return this.calculateDifference(data?.check_in, data?.check_out, this.format(check_in_date), this.format(check_out_date));
    }
  }

  //WIP-1484- modified below code to fix US timezone issue
  format(input) {
    if (typeof (input) === "object") {
      const date = input;
      return (date?.getMonth() + 1) + "/" + date?.getDate() + "/" + date?.getFullYear() + " ";
    } else if (typeof (input) === "string") {
      let date: any = input?.split("-");
      if (date?.length === 3) {
        date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0);// new Date( this.currentTimesheetData?.start_date); //fixed for safari
      }
      return (date?.getMonth() + 1) + "/" + date?.getDate() + "/" + date?.getFullYear() + " ";
    }
    return null;
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

  hasWhiteSpace(s) {
    return s.indexOf(' ') >= 0;
  }

  calculateDifference(inTime, outTime, inDate, outDate) {
    let _first = this.hasWhiteSpace(inTime) ? inTime : inTime?.replace(/am/ig, ' am').replace(/pm/ig, ' pm');
    let _second = this.hasWhiteSpace(outTime) ? outTime : outTime?.replace(/am/ig, ' am').replace(/pm/ig, ' pm');
    let timeStart: any = new Date(inDate + _first);
    let timeEnd: any = new Date(outDate + _second);
    let diff = (timeEnd - timeStart) / 60000;
    let minutes = diff % 60;
    let hours = (diff - minutes) / 60;
    let fs;
    let ss;
    if (minutes < 10) { ss = '0'.concat(JSON.stringify(minutes)) } else { ss = minutes }
    if (hours < 10) { fs = '0'.concat(JSON.stringify(hours)) } else { fs = hours }
    return fs + ':' + ss + ' H';
  }

  calculateTimeDifference(inTime, outTime, inDate, outDate) {
    // const currentDate = new Date();
    // const date = (currentDate.getMonth() +1) + "/" + currentDate.getDate() + "/" + currentDate.getFullYear() + " ";
    let _first = this.hasWhiteSpace(inTime) ? inTime : inTime?.replace(/am/ig, ' am').replace(/pm/ig, ' pm');
    let _second = this.hasWhiteSpace(outTime) ? outTime : outTime?.replace(/am/ig, ' am').replace(/pm/ig, ' pm');
    let timeStart: any = new Date(inDate + _first);
    let timeEnd: any = new Date(outDate + _second);
    let diff = (timeEnd - timeStart) / 60000;
    let minutes = diff % 60;
    let hours = (diff - minutes) / 60;
    return { hours, minutes };
  }

  validateMinute(inTime, outTime, inDate, outDate) {
    // const currentDate = new Date();
    // const date = (currentDate.getMonth()+1) + "/" + currentDate.getDate() + "/" + currentDate.getFullYear() + " ";
    // const date= (this.selectedDate?.getMonth() +1) + "/" + this.selectedDate?.getDate() + "/" + this.selectedDate?.getFullYear() + " ";
    let _first = this.hasWhiteSpace(inTime) ? inTime : inTime?.replace(/am/ig, ' am').replace(/pm/ig, ' pm');
    let _second = this.hasWhiteSpace(outTime) ? outTime : outTime?.replace(/am/ig, ' am').replace(/pm/ig, ' pm');
    let timeStart: any = new Date(inDate + _first);
    let timeEnd: any = new Date(outDate + _second);
    let diff = (timeEnd - timeStart) / 60000;
    let minutes = diff % 60;
    let hours = (diff - minutes) / 60;
    return { hours, minutes };
  }

  fileChangeEvent(event: any): void {
    const program = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let programId = program?.id;
    const fileEvent = event.target?.files ? event.target.files : event.dataTransfer.files;
    let fileExtension = fileEvent[0]?.name.split('.')?.pop();
    const fsizeInKb = fileEvent[0].size;
    const fsizeInMb = fsizeInKb / (1024 * 1024);
    if (event && event?.target && event?.target.files && event?.target?.files?.length > 0) {
      fileExtension = fileExtension?.toLowerCase();
      if (fileExtension === 'pdf' || fileExtension === 'doc' || fileExtension === 'docx' || fileExtension === 'png' || fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'msg') {
        //const file = (event.target as HTMLInputElement).files[0];
        // var formData: any = new FormData();
        // formData.append("file", file);
        if (fsizeInMb <= 3 || fsizeInKb <= 1000000) {
          let fileData = fileEvent[0];
          let upload = {};
          this.timesheetService.encodeToBase64(fileData)
            .then((data) => {
              upload['name'] = fileData.name;
              upload['raw'] = data;
              let payload = {
                file_name: upload['name'],
                raw: upload['raw']
              };
              this.subscriptions.push(this.timesheetService.post(`/timesheet/programs/${programId}/timesheets/upload`, payload).subscribe(
                {
                  next: (data: any) => {
                    if (data) {
                      this.document = data?.data;
                      this.alert.success('File uploaded successfully');
                    }
                  }, error: (err) => {
                    this.alert.error(errorHandler(err));
                  }
                }
              ));
            }).catch((err) => {
              console.error("FileError", err)
            });
        } else {
          this.alert.error('File size should be less than 3MB');
        }
      } else {
        this.alert.error('Only .PDF / .MSG / .DOCX / .PNG / .JPEG files supported');
      }
    }
  }


  isAllowAction() {
    if ((this.checkForStatus(TimesheetStatus.WITHDRAWN) && this.infoDetails?.is_need_create) || (this.checkForStatus(TimesheetStatus.REJECTED) && this.infoDetails?.is_need_create)) {
      return true;
    } else {
      return false;
    }
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
