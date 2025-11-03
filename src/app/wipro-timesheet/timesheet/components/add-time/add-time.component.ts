import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { addDays, convertHoursToDecimal, convertTime12to24, formatHoursTime, getFilteredObjectFromArray } from '../../../timesheet.utils';
import { TimesheetConstants } from '../../../timesheet.enums';
import { LOG_TYPE } from 'src/app/library/logs/logs.model';
import { AccuracyConfigEnum } from 'src/app/shared/enums';

export enum SOW_TYPE {
  SOW = 'sow',
  PROJECT = 'project',
}

export enum MERIDIEM_FORMAT {
  AM = 'AM',
  PM = 'PM',
}

export enum TIME_FORMAT {
  Hours12 = '12',
  Hours24 = '24',
}

export enum TIME_TYPE {
  BREAKOUT = 'temp_break_out',
  BREAKIN = 'temp_break_in',
  CHECKOUT = 'check_out'
}

@Component({
  selector: 'app-add-time',
  templateUrl: './add-time.component.html',
  styleUrls: ['./add-time.component.scss']
})
export class AddTimeComponent implements OnInit {
  timesheetDetails: any;
  timePlaceHolder: any;
  @Output() updateTimesheetLogs = new EventEmitter();
  public disableClearAllButton: boolean = false;
  inDecimals = convertHoursToDecimal;
  public readonly MINUS_SYMBOL = '-';
  public errors = {};
  showTimePanel: string = undefined;
  formData: any;
  selectedDay: any = {};
  config: any;
  accuracyConfig = AccuracyConfigEnum;
  readonly allowedkeys = {
    12: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 32, 65, 77, 80, 97, 109, 112],
    24: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58]
  };

  breakModal: boolean = false;
  compliantReasons = [
    { id: 'Due To Work', name: 'Due To Work' },
    { id: 'My choice', name: 'My choice' }
  ];
  constructor(private eventstream: EventStreamService,
    private timesheetService: TimesheetService,
  ) { }

  ngOnInit(): void {
    this.eventstream.on(Events.ADD_NEW_TIME).subscribe((data) => {
      if (data?.breakModal) {
        this.breakModal = true;
        const Date = data?.selectedDay?.date;
        this.timesheetDetails = data;
        this.formData = data?.formData;
        this.selectedDay = JSON.parse(JSON.stringify(data?.selectedDay));
        this.config = data?.config;
        this.timePlaceHolder = data?.timePlaceHolder;
        this.selectedDay.date = Date;
        this.selectedDay.temp_break_out_date_number = this.selectedDay?.dayNumber;
        this.selectedDay.temp_break_in_date_number = this.selectedDay?.dayNumber;
      } else {
        this.breakModal = false;
      }

    });
  }

  selectDay(day) {
    if (this.timesheetDetails?.isAuthorizedToCreate && !this.timesheetDetails?.isAssignmentClosed && this.timesheetDetails?.isTimesheetEnabled) {
      this.selectedDay = day;
    }
  }

  saveData(value) {
    this.removeEmptyBreaks();
    this.formData.selectedDay = this.selectedDay;
    if (value === 'save&continue') {
      this.formData.breakModal = true;
      this.updateTimesheetLogs.emit(this.formData);
    } else {
      this.formData.breakModal = false;
      this.updateTimesheetLogs.emit(this.formData);
      // this.closeModal();
    }
  }

  removeEmptyBreaks() {
    this.config?.break?.options?.forEach(option => {
      this.selectedDay?.breaks[option?.type]?.breaks?.forEach((b,index) => {
        if(!b?.break_in && !b?.break_out && !b?.compliant){
          this.selectedDay?.breaks[option?.type]?.breaks?.splice(index, 1);
        }
      });
    });
  }

  checkTimePattern(event) {
    if (event) {
      if (!this.allowedkeys[this.config?.time_format]?.includes(event.charCode)) {
        event.preventDefault();
        return false;
      }
    }
  }

  checkTimeFormat(col, fieldName, breaks?) {
    if (fieldName?.includes('temp_break')) {
      col.temp_break_out = breaks?.break_out;
      col.temp_break_in = breaks?.break_in;
      col.temp_compliant = breaks?.compliant;
    }
    if (col?.check_in && col?.check_out && this.config?.overnight) {
      if (((col?.check_in?.toLowerCase()?.includes(MERIDIEM_FORMAT?.PM.toLowerCase()) ||
        (col?.check_in?.toLowerCase()?.includes(MERIDIEM_FORMAT?.AM.toLowerCase()) &&
          (col?.dayNumber + 1 === col?.check_in_date_number || (col?.check_in_date_number === 1 && col?.check_in_date_number < col?.dayNumber)))) &&
        col?.check_out?.toLowerCase()?.includes(MERIDIEM_FORMAT?.AM.toLowerCase()) && this.config?.time_format?.toString() == TIME_FORMAT?.Hours12) ||
        (this.config?.time_format?.toString() == TIME_FORMAT?.Hours24 && this.timeToDecimal(col?.check_in) > Number(TIME_FORMAT?.Hours12) &&
          this.timeToDecimal(col?.check_out) < Number(TIME_FORMAT?.Hours12))) {
        if (col?.check_in_date_number === col?.check_out_date_number || (col?.check_in?.toLowerCase()?.includes(MERIDIEM_FORMAT?.AM.toLowerCase())
          && (col?.dayNumber + 1 === col?.check_in_date_number || (col?.check_in_date_number === 1 && col?.check_in_date_number < col?.dayNumber)))
          && col?.dayNumber + 1 > col?.check_out_date_number) {
          if (col?.check_out_date_number === col?.dayNumber) {
            this.updateInOutDate(TIME_TYPE?.CHECKOUT, true, col);
          }
        }
      }
      else if (col?.check_in_date_number !== col?.check_out_date_number && (col?.dayNumber + 1 <= col?.check_out_date_number ||
        (col?.check_out_date_number === 1 && col?.dayNumber > col?.check_out_date_number))) {
        this.updateInOutDate(TIME_TYPE?.CHECKOUT, false, col);
      }
      if (col?.temp_break_out || col?.temp_break_in) {
        if (fieldName === TIME_TYPE?.BREAKOUT || fieldName === TIME_TYPE?.BREAKIN) {
          if ((col?.dayNumber + 1 == col?.check_out_date_number || (col?.check_out_date_number === 1 && col?.check_out_date_number < col?.dayNumber) && this.config?.time_format?.toString() == TIME_FORMAT?.Hours12) ||
            (this.config?.time_format?.toString() == TIME_FORMAT?.Hours24 && ((this.timeToDecimal(col?.check_in) > Number(TIME_FORMAT?.Hours12) &&
              this.timeToDecimal(col?.check_out) < Number(TIME_FORMAT?.Hours12)) || col?.dayNumber + 1 == col?.check_in_date_number))) {
            if ((col?.temp_break_out?.toLowerCase()?.includes(MERIDIEM_FORMAT?.AM.toLowerCase()) || (col?.check_out_date_number === 1 && col?.check_out_date_number < col?.dayNumber && this.config?.time_format?.toString() == TIME_FORMAT?.Hours12) || (this.config?.time_format?.toString() == TIME_FORMAT?.Hours24 && this.timeToDecimal(col?.temp_break_out) < Number(TIME_FORMAT?.Hours12)) || col?.dayNumber + 1 == col?.check_in_date_number) &&
              !(col?.temp_break_out?.toLowerCase()?.includes(MERIDIEM_FORMAT?.PM.toLowerCase()) && col?.check_in_date_number === col?.dayNumber)
              && col?.dayNumber === col?.temp_break_out_date_number && col?.temp_break_in) {
              this.updateInOutDate(TIME_TYPE?.BREAKOUT, true, col)
            }
            else if (col?.temp_break_out_date_number === col?.check_out_date_number &&
              (col?.dayNumber + 1 <= col?.check_out_date_number &&
                (col?.dayNumber + 1 == col?.temp_break_out_date_number && col?.temp_break_out?.toLowerCase()?.includes(MERIDIEM_FORMAT?.PM.toLowerCase()) ||
                  (col?.check_out_date_number === 1 && col?.dayNumber > col?.check_out_date_number && col?.temp_break_out?.toLowerCase()?.includes(MERIDIEM_FORMAT?.PM.toLowerCase()))) &&
                col?.check_out?.toLowerCase()?.includes(MERIDIEM_FORMAT?.AM.toLowerCase()) || (!(this.timeToDecimal(col?.temp_break_out) < Number(TIME_FORMAT?.Hours12))
                  && this.config?.time_format?.toString() == TIME_FORMAT?.Hours24))) {
              this.updateInOutDate(TIME_TYPE?.BREAKOUT, false, col)
            }
            if ((col?.temp_break_in?.toLowerCase()?.includes(MERIDIEM_FORMAT?.AM.toLowerCase()) || (col?.check_out_date_number === 1 && col?.check_out_date_number < col?.dayNumber && this.config?.time_format?.toString() == TIME_FORMAT?.Hours12) || (this.config?.time_format?.toString() == TIME_FORMAT?.Hours24 && this.timeToDecimal(col?.temp_break_in) < Number(TIME_FORMAT?.Hours12)) || col?.dayNumber + 1 == col?.check_in_date_number) && col?.dayNumber == col?.temp_break_in_date_number && col?.temp_break_in) {
              this.updateInOutDate(TIME_TYPE?.BREAKIN, true, col)
            }
            else if (col?.temp_break_in_date_number === col?.check_out_date_number && fieldName === TIME_TYPE?.BREAKIN &&
              (col?.dayNumber + 1 <= col?.temp_break_in_date_number
                && (col?.temp_break_in?.toLowerCase()?.includes(MERIDIEM_FORMAT?.PM.toLowerCase()) ||
                  (col?.check_out_date_number === 1 && col?.dayNumber > col?.check_out_date_number &&
                    col?.temp_break_in?.toLowerCase()?.includes(MERIDIEM_FORMAT?.PM.toLowerCase()))) &&
                col?.check_out?.toLowerCase()?.includes(MERIDIEM_FORMAT?.AM.toLowerCase()) ||
                (!(this.timeToDecimal(col?.temp_break_in) < Number(TIME_FORMAT?.Hours12))
                  && this.config?.time_format?.toString() == TIME_FORMAT?.Hours24))) {
              this.updateInOutDate(TIME_TYPE?.BREAKIN, false, col)
            }
          }
        }
      }
    }
    this.timesheetService.emitLogs(undefined);
    let value = col[fieldName];
    if (!col[fieldName + '_date']) {
      this.setFormattedDateToCol(col, fieldName, col?.date);
    }
    value = col[fieldName]?.toUpperCase();
    if (this.config?.time_format == 12) { //check config format
      if (value?.slice(value?.length - 3) !== ' AM' && value.slice(value?.length - 3) !== ' PM') {
        value = value?.trim().replace(/.{2}$/, ' $&');
      }
      col[fieldName] = this.formatTime(value);
      if (!TimesheetConstants.REGEX.hour[12]?.test(col[fieldName])) {
        col[fieldName] = "";
        // this.alert.warn("Please provide time in hh:mm AM/PM format");
        const logs = { type: LOG_TYPE.WARNING, heading: "Please provide time in hh:mm AM/PM format", autoClose: true, isShown: true };
        this.timesheetService.emitLogs(logs);
      }
    } else {
      col[fieldName] = formatHoursTime(value);
      if (!TimesheetConstants.REGEX.hour[24]?.test(col[fieldName])) {
        col[fieldName] = "";
        // this.alert.warn("Please provide time in hh:mm 24 hours format");
        const logs = { type: LOG_TYPE.WARNING, heading: "Please provide time in hh:mm 24 hours format", autoClose: true, isShown: true };
        this.timesheetService.emitLogs(logs);
      }
    }
    this.disableClearAllButton = false;
    this.calculateTotalCheckInOutTime(fieldName, this.selectedDay, false);
  }

  breakTimeFormat(col, fieldName) {
    let value = col[fieldName];
    if (!col[fieldName + '_date']) {
      this.setFormattedDateToCol(col, fieldName, col?.date);
    }
    value = col[fieldName]?.toUpperCase();
    if (this.config?.time_format == 12) { //check config format
      if (value?.slice(value?.length - 3) !== ' AM' && value.slice(value?.length - 3) !== ' PM') {
        value = value?.trim().replace(/.{2}$/, ' $&');
      }
      col[fieldName] = this.formatTime(value);
      if (!TimesheetConstants.REGEX.hour[12]?.test(col[fieldName])) {
        col[fieldName] = "";
        // this.alert.warn("Please provide time in hh:mm AM/PM format");
        const logs = { type: LOG_TYPE.WARNING, heading: "Please provide time in hh:mm AM/PM format", autoClose: true, isShown: true };
        this.timesheetService.emitLogs(logs);
      }
    } else {
      col[fieldName] = formatHoursTime(value);
      if (!TimesheetConstants.REGEX.hour[24]?.test(col[fieldName])) {
        col[fieldName] = "";
        // this.alert.warn("Please provide time in hh:mm 24 hours format");
        const logs = { type: LOG_TYPE.WARNING, heading: "Please provide time in hh:mm 24 hours format", autoClose: true, isShown: true };
        this.timesheetService.emitLogs(logs);
      }
    }
  }

  calculateTotalCheckInOutTime(fieldName, col, persistBreaks) {
    if (col && (fieldName === 'check_in' || fieldName === 'check_out') && col.check_in && col.check_out) {
      //if total is negative, then add validation
      col.difference = this.calculateDifference(col?.check_in_date, col?.check_out_date, " " + col?.check_in, " " + col?.check_out);
      this.checkBreaksLimit(col, persistBreaks);
      this.checkValidations(col, fieldName, false);
      this.calculateGrandTotal();
    } else if (col && (!col.check_in || !col.check_out)) {
      col.difference = null;
      this.checkBreaksLimit(col, persistBreaks);
      if (!col.check_in && !col.check_out) {
        this.checkValidations(col, fieldName, false);
      }
    }
  }

  calculateGrandTotal() {
    this.formData.total = 0.00;
    this.formData.data?.forEach(col => {
      if (col?.difference?.decimalValue) {
        this.formData.total += parseFloat(col?.difference?.decimalValue);
      }
    });
  }

  checkValidations(col, fieldName, checkall) {
    const day = col.day?.toLowerCase();
    this.errors[day] = [];
    if (!col.check_in && col.check_out) {
      this.errors[day].push("Please provide Time in value");
      const logs = { type: LOG_TYPE.WARNING, heading: "Please provide Time in value", autoClose: true, isShown: true };
      this.timesheetService.emitLogs(logs);
    }
    if (col.check_in && !col.check_out) {
      this.errors[day].push("Please provide Time out value");
      const logs = { type: LOG_TYPE.WARNING, heading: "Please provide Time out value", autoClose: true, isShown: true };
      this.timesheetService.emitLogs(logs);
    }
    if (col?.difference?.hours >= 24) {
      this.errors[day].push("Difference between check-in check out cannot be more than 24 hours.");
      const logs = { type: LOG_TYPE.WARNING, heading: "Difference between check-in check out cannot be more than 24 hours.", autoClose: true, isShown: true };
      this.timesheetService.emitLogs(logs);
    }
    if (col?.difference?.symbol === this.MINUS_SYMBOL) {
      this.errors[day].push("Please select valid Time in-Time out");
      const logs = { type: LOG_TYPE.WARNING, heading: "Please select valid Time in-Time out", autoClose: true, isShown: true };
      this.timesheetService.emitLogs(logs);
    }
    
  }

  checkBreaksLimit(col, persistBreaks) {
    if (col.check_out && col.check_in) {
      this.config.break?.options?.forEach(option => {
        if (option) {
          let breakTaken = false;
          col.breaks[option.type] = { breaks: col.breaks[option.type]?.breaks?.length > 0 && persistBreaks ? col.breaks[option.type].breaks : [], disableBreak: true, isMandatory: option.is_mandatory || option?.penality_rule?.is_allow, showCompliantReasons: (option?.penality_rule?.is_allow && !option.is_mandatory) || false };
          option.break_rule?.forEach(rule => {
            const total = parseFloat(col?.difference?.hours + '.' + (col?.difference?.minutes < 10 ? '0' + col?.difference?.minutes : col?.difference?.minutes));
            if ((!rule?.min_hours_Converted || rule?.min_hours_Converted <= total) && col?.difference?.symbol != this.MINUS_SYMBOL) {
              col.breaks[option.type].disableBreak = false;
              col.breaks[option.type].showCompliantReasons = (option?.penality_rule?.is_allow && !option.is_mandatory);
              col.breaks[option.type].allowedBreaks = (col?.breaks[option.type]?.allowedBreaks || 0) + 1;
              breakTaken = true;
            }
          });
          if (!breakTaken && option?.initial_break?.is_allow && (option?.penality_rule?.is_allow && !option.is_mandatory)) {
            col.breaks[option.type].disableBreak = false;
            col.breaks[option.type].showCompliantReasons = false;
            col.breaks[option.type].allowedBreaks = 1;
          }
        }
        if (col.breaks[option.type].disableBreak) {
          col.breaks[option.type].breaks = [];
        }

        // Break initialization
        if (this.config?.break?.is_allow) {
          if (this.selectedDay?.breaks?.meal && this.selectedDay?.breaks[option?.type].breaks?.length === 0 && !this.selectedDay?.breaks[option?.type]?.disableBreak) {
            this.addMoreField(this.selectedDay, option?.type, 0);
          }
        }
        // end
        
        if(this.selectedDay?.breaks[option?.type]?.disableBreak || this.selectedDay?.breaks[option.type]?.allowedBreaks <= 0 || this.selectedDay?.breaks[option.type]?.breaks?.length > this.selectedDay?.breaks[option.type]?.allowedBreaks) {
          this.selectedDay.breaks.meal.breaks = [];
          this.selectedDay.breaks.rest.breaks = [];
        }
      });
    } else {
      this.initBreaks(this.selectedDay);
    }
  }

  initBreaks(col) {
    this.config.break?.options?.forEach(option => {
      col.breaks[option.type] = { breaks: [], disableBreak: true, allowedBreaks: 0, showCompliantReasons: (option?.penality_rule?.is_allow && !option.is_mandatory) || false };
      // col.disableBreak= {[option.type]: true, ...col.disableBreak};
    });
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

  setFormattedDateToCol(col, fieldName, date) {
    date = date || col.date;
    let dateField = fieldName + '_date';
    if (date?.getDate) {
      col[dateField + '_number'] = date?.getDate();
    }
    col[dateField] = this.timesheetService.formatDateInRequiredFormat(date, "yyyy-MM-dd");
  }

  timeToDecimal(time) {
    time = time?.split(':');
    if(!time){
      return;
    }
    return Number(parseFloat((parseInt(time[0], 10) + parseInt(time[1], 10) / 60)?.toString())?.toFixed(2));
  }

  updateInOutDate(date_type, isForward, col) {
    this.timesheetService.emitLogs(undefined);
    const field = date_type + '_date';
    let date = new Date();
    if (!col[field]) {
      col[field] = this.timesheetService.formatDateInRequiredFormat(col.date, "yyyy-MM-dd");
    }
    if (isForward) {
      date = addDays(col[field], 1);
    } else {
      date = addDays(col[field], -1);
    }
    this.setFormattedDateToCol(col, date_type, date);
    this.calculateTotalCheckInOutTime(date_type, col, false);
    
  }

  updateBreaksInOutDate(date_type, isForward, breaks, index) {
    if(!breaks?.break_in_date || !breaks?.break_in_date){
      breaks.break_out_date = breaks?.break_in_date || this.selectedDay?.check_in_date;
      breaks.break_in_date = breaks?.break_in_date || this.selectedDay?.check_in_date;
    }
    let date = new Date();
    if (isForward) {
      date = addDays(breaks[date_type + '_date'], 1);
    } else {
      date = addDays(breaks[date_type + '_date'], -1);
    }
    breaks[date_type + '_date'] = this.timesheetService.formatDateInRequiredFormat(date, "yyyy-MM-dd");
    if (date?.getDate()) {
      breaks[date_type + '_number'] = date.getDate();
    }
    this.selectedDay.temp_break_in_date = breaks?.break_in_date;
    this.selectedDay.temp_break_out_date = breaks?.break_out_date
    this.selectedDay.temp_break_in_date_number = breaks?.break_in_number;
    this.selectedDay.temp_break_out_date_number = breaks?.break_out_number;    
    this.validateBreak(this.selectedDay, breaks?.type, breaks, index);
  }

  setShowTimeValue(value) {
    this.showTimePanel = value;
  }

  calculateDifference(start_date, end_date, start_time, end_time) {
    let _first = start_time;
    let _second = end_time;
    if (this.config?.time_format == "12") {
      // _first = this.hasWhiteSpace(start_time) ? start_time : start_time?.replace(/am/ig, ' am').replace(/pm/ig, ' pm');
      _first = " " + convertTime12to24(_first);
      // _second = this.hasWhiteSpace(end_time) ? end_time : end_time?.replace(/am/ig, ' am').replace(/pm/ig, ' pm');
      _second = " " + convertTime12to24(_second);
    } else {
      // _first = this.hasWhiteSpace(start_time) ? start_time : start_time?.replace(/am/ig, ' am').replace(/pm/ig, ' pm');
      // _second = this.hasWhiteSpace(end_time) ? end_time : end_time?.replace(/am/ig, ' am').replace(/pm/ig, ' pm');
    }

    let timeStart: any = new Date(start_date + _first);
    let timeEnd: any = new Date(end_date + _second);
    let diff = (timeEnd - timeStart) / 60000;
    let minutes = diff % 60;
    let hours = (diff - minutes) / 60;
    let fs;
    let ss;
    let symbol = '';
    if (minutes < 0 || hours < 0) {
      hours = Math.abs(hours);
      minutes = Math.abs(minutes);
      symbol = this.MINUS_SYMBOL;
      // col.total=  fs + ':' + ss + ' H';
    }
    if (minutes < 10) { ss = '0'.concat(JSON.stringify(minutes)) } else { ss = minutes }
    if (hours < 10) { fs = '0'.concat(JSON.stringify(hours)) } else { fs = hours };
    const decimalValue = symbol + this.inDecimals(hours + ":" + minutes);
    return { value: symbol + fs + ':' + ss + ' H', hours, minutes, decimalValue, symbol };
  }

  deleteBreakField(data, i) {
    data.splice(i, 1);
    // this.breakInput.splice(i, 1)
  }

  validateBreakOut(selectedDay, type, breaks, index) {
    if(breaks?.break_out && breaks?.break_in){
    this.validateBreak(this.selectedDay, type, breaks, index);
    }
  }

  validateBreak(col, break_type, breaks?, index?) {
    col.temp_break_out = breaks?.break_out;
    col.temp_break_in = breaks?.break_in;
    col.temp_compliant = breaks?.compliant;

    this.timesheetService.emitLogs(undefined);
    const option = this.config.break.options?.filter(option => { return option?.type?.toLowerCase() === break_type });
    if ((!col.temp_break_out && !col.temp_break_in && !col.temp_compliant) || ((col.temp_break_out && col.temp_compliant) || (col.temp_break_in && col.temp_compliant))) {
      if (option?.length > 0 && option[0]?.penality_rule?.is_allow && !option[0]?.is_mandatory) {
        const logs = { type: LOG_TYPE.ERROR, heading: "Please select either Break out-in or compliant value", messages: [], autoClose: true, isShown: true };
        this.timesheetService.emitLogs(logs);
      } else {
        const logs = { type: LOG_TYPE.ERROR, heading: "Please select Break out-in Time", messages: [], autoClose: true, isShown: true };
        this.timesheetService.emitLogs(logs);
      }
      return;
    }
    if ((col.temp_break_out && !col.temp_break_in) || (!col.temp_break_out && col.temp_break_in)) {
      const logs = { type: LOG_TYPE.ERROR, heading: "Please add Break out and Break in values", messages: [], autoClose: true, isShown: true };
      this.timesheetService.emitLogs(logs);
      return;
    }
    if (col.temp_break_out && col.temp_break_in && col.temp_break_out === col.temp_break_in) {
      const logs = { type: LOG_TYPE.ERROR, heading: "Break out and Break in values cannot be same", messages: [], autoClose: true, isShown: true };
      this.timesheetService.emitLogs(logs);
      return;
    }
    /*  1)  check break timing if given
         2)check break duration between check_in / checkout
         3)check break is more than min and max hours if given
    */
    // const index = col?.temp_index >= 0 ? col?.temp_index : col.breaks[break_type]?.breaks?.length;
    if (col.temp_break_out && col.temp_break_in) {
      const breakDifference = this.calculateDifference(col?.temp_break_out_date, col?.temp_break_in_date, " " + col.temp_break_out, " " + col.temp_break_in);
      if (this.negativeValueError(breakDifference, 'Break out', 'Break in')) {
        return;
      }
      //check in - checkout
      const breakCheckoutDifference = this.calculateDifference(col?.temp_break_in_date, col?.check_out_date, " " + col.temp_break_in, " " + col.check_out);
      if (this.negativeValueError(breakCheckoutDifference, 'Break in', 'Check out')) {
        return;
      }
      const total = (60 * breakDifference?.hours) + breakDifference.minutes;
      const break_types = getFilteredObjectFromArray(this.config.break?.options, 'type', break_type);
      const break_rule = break_types[0]?.break_rule[index];
      if (break_rule?.max_duration && total > break_rule.max_duration) {
        // this.alert.error(`Break duration cannot be more than ${break_rule.max_duration } minutes`);
        const logs = { type: LOG_TYPE.ERROR, heading: `Break duration cannot be more than ${break_rule.max_duration} minutes`, autoClose: true, isShown: true };
        this.timesheetService.emitLogs(logs);
        return;
      }
      if (break_rule?.min_duration && total < break_rule.min_duration) {
        // this.alert.error(`Break duration cannot be less than ${break_rule.min_duration } minutes`);
        const logs = { type: LOG_TYPE.ERROR, heading: `Break duration cannot be less than ${break_rule.min_duration} minutes`, autoClose: true, isShown: true };
        this.timesheetService.emitLogs(logs);
        return;
      }
      if (break_rule?.min_hours_Converted && option?.length > 0 && !option[0]?.penality_rule?.is_allow && option[0]?.is_mandatory) {
        const breakCheckInDifference = this.calculateDifference(col?.check_in_date, col?.temp_break_out_date, " " + col.check_in, " " + col.temp_break_out);
        if (this.negativeValueError(breakCheckInDifference, 'Check in', 'Break out')) {
          return;
        }
        const time = parseFloat(breakCheckInDifference?.hours + '.' + (breakCheckInDifference?.minutes < 10 ? "0" + breakCheckInDifference?.minutes : breakCheckInDifference?.minutes));
        if (break_rule.min_hours_Converted >= time) {
          // this.alert.error(`Break can not be taken before ${break_rule.min_hours} hours of Check in hours`);
          const logs = { type: LOG_TYPE.ERROR, heading: `Break can not be taken before ${break_rule.min_hours} hours of Check in hours`, autoClose: true, isShown: true };
          this.timesheetService.emitLogs(logs);
          return;
        }
      }
      if (break_rule?.max_hours_Converted && option?.length > 0 && !option[0]?.penality_rule?.is_allow && option[0]?.is_mandatory) {
        const breakCheckOutDifference = this.calculateDifference(col?.check_in_date, col?.temp_break_in_date, " " + col.check_in, " " + col.temp_break_in);
        if (this.negativeValueError(breakDifference, 'Check In', 'break in')) {
          return;
        }
        const time = parseFloat(breakCheckOutDifference?.hours + '.' + (breakCheckOutDifference?.minutes < 10 ? "0" + breakCheckOutDifference?.minutes : breakCheckOutDifference?.minutes));
        if (break_rule.max_hours_Converted < time) {
          // this.alert.error(`Break can not be taken after ${break_rule.max_hours} hours of Check in hours`);
          const logs = { type: LOG_TYPE.ERROR, heading: `Break can not be taken after ${break_rule.max_hours} hours of Check in hours`, autoClose: true, isShown: true };
          this.timesheetService.emitLogs(logs);
          return;
        }
      }
    }
    // col.breaks[break_type].breaks.push({break_out: col.temp_break_out || null, break_in: col.temp_break_in || null,
    //   break_number: index, type: break_type, compliant: col.temp_compliant || null});
    if (col.temp_compliant) {
      col.temp_break_out_date = undefined;
      col.temp_break_out_date_number = undefined;
      col.temp_break_in_date = undefined;
      col.temp_break_in_date_number = undefined;
    }
    col.breaks[break_type].breaks[index - 1] = {
      break_out: col.temp_break_out || null, break_in: col.temp_break_in || null,
      break_number: index - 1, type: break_type, compliant: col.temp_compliant || null,
      break_out_number: col.temp_break_out_date_number || breaks.break_out_number, break_in_number: col.temp_break_in_date_number || breaks.break_in_number,
      break_out_date: col.temp_break_out_date || breaks.break_out_date, break_in_date: col.temp_break_in_date || breaks.break_in_date
    };
    // this.openBreakModal(undefined, break_type, col, undefined);
    this.disableClearAllButton = false;    
  }

  negativeValueError(breakDifference, in_time, out_time) {
    if (breakDifference?.symbol === this.MINUS_SYMBOL) {
      // this.alert.error(`${in_time} cannot be greater than ${out_time}`);
      const logs = { type: LOG_TYPE.ERROR, heading: `${in_time} cannot be greater than ${out_time}`, autoClose: true, isShown: true };
      this.timesheetService.emitLogs(logs);
      return true;
    } else {
      return false;
    }
  }

  addMoreField(col, break_type, index) {
    col.temp_break_in = undefined;
    col.temp_break_out = undefined;
    col.temp_compliant = undefined;
    col.temp_index = undefined;
    col.temp_break_out_date = col?.break_out_date;
    col.temp_break_in_date = col?.break_in_date;
    col.temp_break_out_date_number = col?.break_out_number || col?.dayNumber;
    col.temp_break_in_date_number = col?.break_in_number || col?.dayNumber;

    col.breaks[break_type].breaks[index] = {
      break_out: col.temp_break_out || null, break_in: col.temp_break_in || null,
      break_number: index, type: break_type, compliant: col.temp_compliant || null,
      break_out_number: col.temp_break_out_date_number, break_in_number: col.temp_break_in_date_number,
      break_out_date: col.temp_break_out_date, break_in_date: col.temp_break_in_date,
    };
  }


  closeModal() {
    // this.formData.data = this.timesheetDetails?.oldLogs;
    this.breakModal = false;
  }
}
