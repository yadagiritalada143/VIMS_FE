import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { HourlyTimeSheetService } from '../hourly-timesheet/hourly-time-sheet.service';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { DATE_FORMAT, TimesheetConstants, TimesheetGracePeriod, TimesheetStatus, UsersType } from '../../timesheet.enums';
import { addDays, convertHoursToDecimal, convertTime12to24, formatHoursTime, getDateFromString, getFilteredObjectFromArray } from '../../timesheet.utils';
import { Subscription } from 'rxjs';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
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
  selector: 'app-tito-timesheet-entry',
  templateUrl: './tito-timesheet-entry.component.html',
  styleUrls: ['./tito-timesheet-entry.component.scss']
})
export class TitoTimesheetEntryComponent implements OnInit {
  dateFormatEnum = DATE_FORMAT; 
  selectedCustomData = {};
  customFields: any[] = [];
  isCustomFieldsValid: any;
  showErrorMessage = false;
  redirectTimesheetFlyout: string;
  public startDate;
  public endDate;
  public timeSheet: any = {};
  billing_data: any = undefined;
  private accountDetails = this.storageService.get('account');
  isAssignmentClosed: boolean = false;
  disableButton: boolean = false;
  private subscriptions: Subscription[] = [];
  currentTimesheetData: any = undefined;
  public weekDates = [];
  public assignmentDetails: any;
  public isTimesheetEnabled: boolean;
  public redirectToSow = '';
  public redirectSow = false;
  public project_id: any;
  public sow_id: any;
  currentProgram: any = undefined;
  public config: any;
  public readonly MINUS_SYMBOL = '-';
  public multiApprovals:any;
  timesheetTab: string = "timesheet";
  compliantReasons = [
    {id: 'Due To Work', name: 'Due To Work'},
    {id: 'My choice', name: 'My choice'}
];
  public formData: any = {
    data: [],
    billing_data_total: {},
    timesheet_level_notes: undefined
  };
  getDateFromString = getDateFromString;
  inDecimals = convertHoursToDecimal;
  public disableClearAllButton: boolean = false;
  showCopyButton: boolean = false;
  public errors = {};
  timesheetStatuses = TimesheetStatus;
  selectedIndex: number = null;
  breakModal: string = undefined;
  billableBreakup = false;
  defaultValue: string = '0.00';
  holidayData: any = [];
  dropdownToggle: boolean = false;
  showTimePanel: string = undefined;
  isAuthorizedToCreate: boolean = false;
  showCopywidget: boolean = false;
  sourcing_model: any;
  readonly allowedkeys = {
    12: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 32, 65, 77, 80, 97, 109, 112],
    24: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58]
  }
  timePlaceHolder: string = undefined;
  moreItemModal = false;
  accuracyConfig = AccuracyConfigEnum;
  isShowMultiApproval: any;
  constructor(private htsService: HourlyTimeSheetService, public storageService: StorageService,
    private alert: AlertService, private router: Router,
    private route: ActivatedRoute, private timesheetService: TimesheetService,
    private eventStream: EventStreamService, private confirmService: ConfirmationDialogService) {
    this.route.queryParamMap
      .subscribe((params) => {
        this.redirectToSow = params['params']?.redirectToSow;
        this.redirectTimesheetFlyout = params['params']?.title;
        if (this.redirectToSow && this.redirectToSow === SOW_TYPE.PROJECT || this.redirectToSow === SOW_TYPE.SOW) {
          this.redirectSow = true;
        }
        this.sow_id = params['params']?.sow_id;
        this.project_id = params['params']?.project_id;
      });
  }

  ngOnInit(): void {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (currentProgram) {
      // this.isShowMultiApproval = currentProgram.config?.multiple_approval_timesheet_expense;
      this.isShowMultiApproval = (currentProgram?.config?.modules_using_flow_system || [])?.indexOf('TIMESHEETS') !== -1;
    }
    this.initializeTimesheet();
    this.subscriptions.push(this.eventStream.on(Events.TIMESHEET_ACTION_FLYOUT).subscribe((data: any) => {
      if (data?.reloadCalendar) {
        this.initializeTimesheet();
      }
    }));
    const timesheetId = this.route.snapshot.queryParams['timesheetId'];
    this.eventStream.on(Events.APPROVAL_ACTION).subscribe((data) => {
      if(data){
        this.initializeTimesheet();
        this.multiApprovals = [
          { name: 'approval', api_url: `/approval/programs/${this.currentProgram?.id}/timesheets/${this.currentTimesheetData?.timesheet_uuid || timesheetId}/approval-instances`, status: 'pending', workflow_type: 'approval', isReplaceMember: true },
        ];          
      }
    })
    this.multiApprovals = [
      { name: 'approval', api_url: `/approval/programs/${this.currentProgram?.id}/timesheets/${this.currentTimesheetData?.timesheet_uuid || timesheetId}/approval-instances`, status: 'pending', workflow_type: 'approval', isReplaceMember: true },
    ];    
  }

  isDataPresent(data) {
    return parseInt(data);
  }

  showFullDayView(i) {
    const item =  document.querySelectorAll('.day-col-mobile');
    item.forEach(function(e) {
      e.classList.remove('active');
    });
    document.getElementById(i).classList.add('active');
  }

  hideDayCol(i) {
    document.getElementById(i).classList.remove('active');
  }

  showTimesheetTab(value) {
    this.timesheetTab = value;
  }
  unsorted = (a, b) => {
    return a;
  }

  initializeTimesheet() {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const timesheetId = this.route.snapshot.queryParams['timesheetId'];
    if (timesheetId) {
      this.storageService.set(TimesheetConstants.TIMESHEET, {
        timesheet_id: timesheetId,
        timesheet_uuid: timesheetId,
      }, true);
      this.getBasicInfo(timesheetId);
    } else {
      this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
      if (!this.currentTimesheetData?.status) {
        this.disableClearAllButton = true;
      }
      this.getTimesheetConfigurations();
      this.isAuthorizedToCreateTimesheet(false, this.timeSheet?.data?.actions_allow?.can_save);
      window.scrollTo(0, 0);
    }
    this.multiApprovals = [
      { name: 'approval', api_url: `/approval/programs/${currentProgram?.id}/timesheets/${this.currentTimesheetData?.timesheet_uuid || timesheetId}/approval-instances`, status: 'pending',workflow_type:'approval', isReplaceMember:true },
    ];
  }

  getBasicInfo(timesheetId) {
    this.timesheetService.getBasicInfo(undefined, timesheetId, undefined, undefined).subscribe(
      {
        next: (data: any) => {
          if (data?.data) {
            //set the data to locastorage
            var response = data.data;
            // const date = response?.start_date?.split("-");
            this.currentTimesheetData = {
              assignment_id: response?.assignment_id,
              assignment_title: response?.assignment_title,
              child_type: response?.child_type,
              code: response.code,
              // display_value: display_value,
              end_date: response?.end_date,
              parent_type: response?.parent_type,
              start_date: response?.start_date,
              status: response?.status,
              timesheet_code: response?.code,
              timesheet_id: timesheetId,
              timesheet_uuid: timesheetId,
              user_id: response?.worker?.id
            }
            this.storageService.set(TimesheetConstants.TIMESHEET, this.currentTimesheetData, true);
            this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
            if (!this.currentTimesheetData?.status) {
              this.disableClearAllButton = true;
            }
            this.getTimesheetConfigurations();
            this.isAuthorizedToCreateTimesheet(false, this.timeSheet?.data?.actions_allow?.can_save);
            this.eventStream.emit(new EmitEvent(Events.UPDATE_CURRENT_TIMESHEET_DETAILS, undefined));
            window.scrollTo(0, 0);
          }
        }, error: (err) => {
          const logs = { type: LOG_TYPE.ERROR, heading: errorHandler(err), messages: [], autoClose: true, isShown: true };
          this.timesheetService.emitLogs(logs);
          // this.alert.error("Something went wrong");
        }
      }
    );
  }

  setSelectedTime($event, col, fieldName) {
    col[fieldName] = $event;
    this.setFormattedDateToCol(col, fieldName, col?.date);
    this.calculateTotalCheckInOutTime(fieldName, col, false);
  }

  setFormattedDateToCol(col, fieldName, date) {
    date = date || col.date;
    let dateField = fieldName + '_date';
    if (date?.getDate) {
      col[dateField + '_number'] = date?.getDate();
    }
    /* if(fieldName === 'check_in' && date?.getDate){
      col.displayInDate= date?.getDate();
    }else if(fieldName === 'check_out' && date?.getDate){
      col.displayOutDate= date?.getDate();
    } */
    col[dateField] = this.timesheetService.formatDateInRequiredFormat(date, "yyyy-MM-dd");
  }

  isAuthorizedToCreateTimesheet(is_need_create, can_save) {
    this.isAuthorizedToCreate = this.timesheetService.isAuthorizedToCreate(is_need_create, can_save);
  }

  checkTimePattern(event) {
    if (event) {
      if (!this.allowedkeys[this.config?.time_format]?.includes(event.charCode)) {
        event.preventDefault();
        return false;
      }
    }
  }

  public navigateBackTo() {
    if (this.redirectToSow === SOW_TYPE.PROJECT) {
      this.router.navigate([`/sow/${this.sow_id}/milestones/${this.project_id}/invoicing`]);
    } else if (this.redirectToSow === SOW_TYPE.SOW) {
      this.router.navigate([`/sow/${this.sow_id}/invoicing`]);
    }else if(this.redirectTimesheetFlyout){
      let queryParams = { tab: 'budget', openTimesheetListTab: true , status : this.redirectTimesheetFlyout?.toLowerCase() === 'timesheet approved' ? 'approved' : 'all-pending'  };
      this.router.navigate([`assignment/details/${this.currentTimesheetData?.assignment_id}/final`], { queryParams});
    }
     else {
      this.router.navigate(['/timesheet/list/all']);
    }
  }

  getHoursFromTime(time) {
    let numberArray = time?.split(":");
    if (numberArray?.length > 1) {
      return parseInt(numberArray[0]);
    }
  }
  timeToDecimal(time) {
    time = time?.split(':');
    return Number(parseFloat((parseInt(time[0], 10) + parseInt(time[1], 10) / 60)?.toString())?.toFixed(2));
  }

  checkTimeFormat(col, fieldName) {
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
        if (fieldName === TIME_TYPE?.BREAKOUT  || fieldName === TIME_TYPE?.BREAKIN  ) {
          if ((col?.dayNumber + 1 == col?.check_out_date_number || (col?.check_out_date_number === 1 && col?.check_out_date_number < col?.dayNumber) && this.config?.time_format?.toString() == TIME_FORMAT?.Hours12) ||
            (this.config?.time_format?.toString() == TIME_FORMAT?.Hours24 && ((this.timeToDecimal(col?.check_in) > Number(TIME_FORMAT?.Hours12) &&
              this.timeToDecimal(col?.check_out) < Number(TIME_FORMAT?.Hours12)) || col?.dayNumber + 1 == col?.check_in_date_number))) {
            if ((col?.temp_break_out?.toLowerCase()?.includes(MERIDIEM_FORMAT?.AM.toLowerCase()) || (col?.check_out_date_number === 1 && col?.check_out_date_number < col?.dayNumber && this.config?.time_format?.toString() == TIME_FORMAT?.Hours12) || (this.config?.time_format?.toString() == TIME_FORMAT?.Hours24 && this.timeToDecimal(col?.temp_break_out) < Number(TIME_FORMAT?.Hours12)) || col?.dayNumber + 1 == col?.check_in_date_number) &&
              !(col?.temp_break_out?.toLowerCase()?.includes(MERIDIEM_FORMAT?.PM.toLowerCase()) && col?.check_in_date_number === col?.dayNumber)
              && col?.dayNumber === col?.temp_break_out_date_number && col?.temp_break_in) {
              this.updateInOutDate(TIME_TYPE?.BREAKOUT , true, col)
            }
            else if (col?.temp_break_out_date_number === col?.check_out_date_number &&
              (col?.dayNumber + 1 <= col?.check_out_date_number &&
                (col?.dayNumber + 1 == col?.temp_break_out_date_number && col?.temp_break_out?.toLowerCase()?.includes(MERIDIEM_FORMAT?.PM.toLowerCase()) ||
                  (col?.check_out_date_number === 1 && col?.dayNumber > col?.check_out_date_number && col?.temp_break_out?.toLowerCase()?.includes(MERIDIEM_FORMAT?.PM.toLowerCase())))  &&
                col?.check_out?.toLowerCase()?.includes(MERIDIEM_FORMAT?.AM.toLowerCase()) || (!(this.timeToDecimal(col?.temp_break_out) < Number(TIME_FORMAT?.Hours12))
                  && this.config?.time_format?.toString() == TIME_FORMAT?.Hours24))) {
              this.updateInOutDate(TIME_TYPE?.BREAKOUT, false, col)
            }
            if ((col?.temp_break_in?.toLowerCase()?.includes(MERIDIEM_FORMAT?.AM.toLowerCase()) || (col?.check_out_date_number === 1 && col?.check_out_date_number < col?.dayNumber && this.config?.time_format?.toString() == TIME_FORMAT?.Hours12) || (this.config?.time_format?.toString() == TIME_FORMAT?.Hours24 && this.timeToDecimal(col?.temp_break_in) < Number(TIME_FORMAT?.Hours12)) || col?.dayNumber + 1 == col?.check_in_date_number) && col?.dayNumber == col?.temp_break_in_date_number && col?.temp_break_in) {
              this.updateInOutDate(TIME_TYPE?.BREAKIN , true, col)
            }
            else if (col?.temp_break_in_date_number === col?.check_out_date_number && fieldName === TIME_TYPE?.BREAKIN   &&
              (col?.dayNumber + 1 <= col?.temp_break_in_date_number
                && (col?.temp_break_in?.toLowerCase()?.includes(MERIDIEM_FORMAT?.PM.toLowerCase()) ||
                  (col?.check_out_date_number === 1 && col?.dayNumber > col?.check_out_date_number &&
                    col?.temp_break_in?.toLowerCase()?.includes(MERIDIEM_FORMAT?.PM.toLowerCase()))) &&
                col?.check_out?.toLowerCase()?.includes(MERIDIEM_FORMAT?.AM.toLowerCase()) ||
                (!(this.timeToDecimal(col?.temp_break_in) < Number(TIME_FORMAT?.Hours12))
                  && this.config?.time_format?.toString() == TIME_FORMAT?.Hours24))) {
              this.updateInOutDate(TIME_TYPE?.BREAKIN , false, col)
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
    this.calculateTotalCheckInOutTime(fieldName, col, false);
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

  validateBreak(col, break_type) {
    this.timesheetService.emitLogs(undefined);
    const option = this.config.break.options?.filter(option => { return option?.type?.toLowerCase() === break_type });
    if ((!col.temp_break_out && !col.temp_break_in && !col.temp_compliant) || ((col.temp_break_out && col.temp_compliant) || (col.temp_break_in && col.temp_compliant))) {
      if (option?.length > 0 && option[0]?.penality_rule?.is_allow && !option[0]?.is_mandatory) {
        // this.alert.error("Please select either Break out-in or compliant value");
        const logs = { type: LOG_TYPE.ERROR, heading: "Please select either Break out-in or compliant value", messages: [], autoClose: true, isShown: true };
        this.timesheetService.emitLogs(logs);
      } else {
        // this.alert.error("Please select Break out-in Time");
        const logs = { type: LOG_TYPE.ERROR, heading: "Please select Break out-in Time", messages: [], autoClose: true, isShown: true };
        this.timesheetService.emitLogs(logs);
      }
      return;
    }
    if ((col.temp_break_out && !col.temp_break_in) || (!col.temp_break_out && col.temp_break_in)) {
      // this.alert.error("Please add Break out and Break in values");      
      const logs = { type: LOG_TYPE.ERROR, heading: "Please add Break out and Break in values", messages: [], autoClose: true, isShown: true };
      this.timesheetService.emitLogs(logs);
      return;
    }
    if (col.temp_break_out && col.temp_break_in && col.temp_break_out === col.temp_break_in) {
      // this.alert.error("Break out and Break in values cannot be same");
      const logs = { type: LOG_TYPE.ERROR, heading: "Break out and Break in values cannot be same", messages: [], autoClose: true, isShown: true };
      this.timesheetService.emitLogs(logs);
      return;
    }
    /*  1)  check break timing if given
         2)check break duration between check_in / checkout
         3)check break is more than min and max hours if given
    */
    const index = col?.temp_index >= 0 ? col?.temp_index : col.breaks[break_type]?.breaks?.length;
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
      if (break_rule.max_hours_Converted && option?.length > 0 && !option[0]?.penality_rule?.is_allow && option[0]?.is_mandatory) {
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
    col.breaks[break_type].breaks[index] = {
      break_out: col.temp_break_out || null, break_in: col.temp_break_in || null,
      break_number: index, type: break_type, compliant: col.temp_compliant || null,
      break_out_number: col.temp_break_out_date_number, break_in_number: col.temp_break_in_date_number,
      break_out_date: col.temp_break_out_date, break_in_date: col.temp_break_in_date
    };
    this.openBreakModal(undefined, break_type, col, undefined);
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
      });
    } else {
      this.initBreaks(col);
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
    this.formData.total = Number(this.formData?.total)?.toFixed(8);
  }

  isErrorAvailable() {
    let isErrorAvailable = false;
    for (let key in this.errors) {
      const errors = this.errors[key];
      if (errors?.length > 0) {
        isErrorAvailable = true;
      }
    }
    return isErrorAvailable;
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

  hasWhiteSpace(s) {
    return s?.indexOf(' ') >= 0;
  }
  clearTimesheetLogs() {
    this.confirmService.confirm('', `This will clear the Timesheet logs for current week. Are you sure you want to continue?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          if (this.currentTimesheetData?.timesheet_uuid) {
            this.timesheetService.emitLogs(undefined);
            this.disableClearAllButton = true;
            this.subscriptions.push(this.timesheetService.clearTimesheetLogs(this.currentTimesheetData?.timesheet_uuid).subscribe(
              {
                next: (data: any) => {
                  this.alert.success(data?.message || "Timesheet deleted successfully.");
                  this.clearAll();
                }, error: err => {
                  this.getErrorMessage(err);
                  this.disableClearAllButton = false;
                }
              }
              ,
            ));
          } else {
            this.clearAll();
          }
        }
      })
      .catch(() => {
        this.alert.error("Unable to clear data");
      });
  }



  clearAll() {
    this.errors = {};
    this.formData = {
      data: [],
      billing_data_total: {},
      timesheet_level_notes: undefined
    };
    this.billing_data = undefined;
    this.initialTimesheetPopulation();
    this.disableClearAllButton = true;
    if (this.currentTimesheetData?.timesheet_uuid) {
      this.getTimesheetDetails();
    }
  }

  private processMinMaxHours() {
    this.config?.break?.options?.forEach(option => {
      option?.break_rule?.forEach(rule => {
        if(rule?.max_hours){
        let maxvalue = rule?.max_hours?.replace(':', '.');
        maxvalue = parseFloat(maxvalue);
        rule.max_hours_Converted = maxvalue;
        }
        if(rule?.min_hours) {
        let minvalue = rule?.min_hours?.replace(':', '.');
        minvalue = parseFloat(minvalue);
        rule.min_hours_Converted = minvalue;
        }
      });
    });
  }
  getTimesheetConfigurations() {
    this.timesheetService.emitLogs(undefined);
    this.timesheetService.getConfigDetails(this.currentTimesheetData?.assignment_id).subscribe(
      {
        next: (data: any) => {
          this.config = data?.data;
          this.processMinMaxHours();
          if (this.config?.time_format == 12) {
            this.timePlaceHolder = "HH:MM AM";
          } else {
            this.timePlaceHolder = "HH:MM";
          }
          this.initialTimesheetPopulation();
          if (this.currentTimesheetData?.start_date) {
            this.checkIfAssignmentClosed();
          } else {
            this.alert.error("Please select valid timesheet");
            this.router.navigate(['/timesheet/list/all']);
          }
          this.getAssignmentDetails();
          if (this.currentTimesheetData?.timesheet_uuid) {
            this.getTimesheetDetails();
          }
        }, error: err => {
          this.getErrorMessage(err);
        }
      }
    );
  }

  checkForAssignmentDurationChange() {
    if ((this.timeSheet?.data?.new_start_date && this.timeSheet?.data?.start_date != this.timeSheet?.data?.new_start_date) || (this.timeSheet?.data?.new_end_date && this.timeSheet?.data?.end_date != this.timeSheet?.data?.new_end_date)) {
      this.confirmService.confirm('', `Hey! Your Assignment has been updated. Do you want to proceed with new timesheet entry?`,
        'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            if (this.timeSheet?.data?.new_start_date && this.timeSheet?.data?.start_date != this.timeSheet?.data?.new_start_date) {
              this.currentTimesheetData.start_date = this.timeSheet?.data?.new_start_date;
            }

            if (this.timeSheet?.data?.new_end_date && this.timeSheet?.data?.end_date != this.timeSheet?.data?.new_end_date) {
              this.currentTimesheetData.end_date = this.timeSheet?.data?.new_end_date;
            }
            this.storageService.set(TimesheetConstants.TIMESHEET, this.currentTimesheetData, true);
            this.saveTITOTimeSheet(0, true);
            // setTimeout(() => { 
            //   this.initialTimesheetPopulation();
            // }, 100); 
          }
        })
        .catch(() => {
          this.alert.error("Some issue happening opening the confirm popup for duration change");
        });
    }
  }

  initialTimesheetPopulation() {
    this.populateTimesheetConfiguration();
    this.processweekends();
    this.populateInitialConfig();
  }

  checkIfAssignmentClosed() {
    if (this.assignmentDetails?.assignment?.status?.toLowerCase() === 'closed') {
      let allowedDateToEditAssignment = addDays(this.assignmentDetails?.assignment?.end_date, 0);
      let userCategory = this.accountDetails?.role?.organization_category?.toLowerCase();
      if (userCategory?.toLowerCase() === UsersType.CANDIDATE.toLowerCase()) {
        userCategory = UsersType.WORKER?.toLowerCase();
      }
      if (this.config?.grace_period?.is_allow) {
        const grace_period = this.config.grace_period?.option?.[userCategory];
        if (grace_period?.is_allow) {
          const no_of_days = grace_period.type?.toLowerCase() == TimesheetGracePeriod.MONTH.toLowerCase() ? (grace_period.period * 30) : grace_period.type?.toLowerCase() == TimesheetGracePeriod?.WEEK.toLowerCase() ? (grace_period.period * 7) : grace_period.period;
          allowedDateToEditAssignment = addDays(this.assignmentDetails?.assignment?.end_date, parseInt(no_of_days || 0));

        }
      }
      if (this.assignmentDetails?.assignment?.temporary_access?.length > 0) {
        const temporary_access = this.assignmentDetails.assignment.temporary_access.filter(temp_access => { return temp_access.module_type === "timesheet" });
        if (temporary_access?.length > 0) {
          if (temporary_access[0].module_action?.submit?.is_allow) {
            const option = temporary_access[0].module_action?.submit.option?.filter(option => { return option?.user_type?.toLowerCase() === userCategory });
            if (option?.length > 0 && option[0].is_allow) {
              const grace_type = option[0].type?.toLowerCase();
              let effective_date = temporary_access[0].effective_date?.replaceAll("-", "/"); // to work in safari, replaced - with /
              effective_date += this.assignmentDetails?.assignment?.timezone ? " " + this.assignmentDetails?.assignment?.timezone?.toUpperCase() : "";
              const period = parseInt(option[0].period) * 24;
              const grace_period = grace_type?.toLowerCase() == TimesheetGracePeriod.MONTH.toLowerCase() ? (period * 30) : grace_type?.toLowerCase() == TimesheetGracePeriod?.WEEK.toLowerCase() ? (period * 7) : grace_type?.toLowerCase() == TimesheetGracePeriod?.DAY.toLowerCase() ? period : parseInt(option[0]?.period || 0);
              allowedDateToEditAssignment = new Date(effective_date);
              const hours = allowedDateToEditAssignment?.getHours() + grace_period;
              if (new Date().getTime() > allowedDateToEditAssignment?.setHours(hours)) {
                // changed due to V2M-28948
                this.isAssignmentClosed = this.timeSheet?.data?.actions_allow?.can_save ? false : true;
              }
              return;
            }
          }
        }
      }
      if (new Date().setHours(0, 0, 0, 0) > allowedDateToEditAssignment.setHours(0, 0, 0, 0)) {
        this.isAssignmentClosed = this.timeSheet?.data?.actions_allow?.can_save ? false : true;
      }
    }
  }
  getAssignmentDetails() {
    this.timesheetService.emitLogs(undefined);
    this.timesheetService.getAssignmentDetails(this.currentTimesheetData?.assignment_id).subscribe(
      {
        next: (data: any) => {
          this.assignmentDetails = data?.data?.assignments;
          if(!this.currentTimesheetData?.status || this.currentTimesheetData?.status?.toLowerCase() === TimesheetStatus.MISSING){
          this.selectedCustomData = this.timesheetService?.populateCustomFields(this.assignmentDetails?.custom, this.selectedCustomData);
          }
          this.isTimesheetEnabled = Boolean(this.assignmentDetails?.finance?.is_timesheet_enabled);
          this.checkIfAssignmentClosed();
          this.getHoliday(this.assignmentDetails?.assignment?.work_location?.id);
        }, error: err => {
          this.getErrorMessage(err);
        }
      }
    );
  }

  getTimesheetDetails() {
    this.timesheetService.emitLogs(undefined);
    this.subscriptions.push(this.timesheetService.getTimesheetDetails(this.currentTimesheetData?.timesheet_uuid).subscribe(
      {
        next: (resp: any) => {
          if (resp) {
              // Show custom field data
              if (resp?.data?.custom) {
                this.selectedCustomData = resp?.data?.custom;
              } else {
                this.selectedCustomData = {};
              }
              // End
            this.sourcing_model = resp?.data?.sourcing_model;
            this.populateTimesheet(resp?.data?.timesheet_logs, resp?.data?.hour_data);
            this.timeSheet = resp;
            this.billing_data = undefined;
            this.billing_data = { ...this.timeSheet?.data };
            this.eventStream.emit(new EmitEvent(Events.UPDATE_CURRENT_TIMESHEET_DETAILS, { timesheet: this.timeSheet }));
            this.isAuthorizedToCreateTimesheet(this.timeSheet?.data?.is_need_create, this.timeSheet?.data?.actions_allow?.can_save);
            this.setDataToStorage(resp?.data);
            this.checkForAssignmentDurationChange();
          }
        }, error: err => {
          this.getErrorMessage(err);
        }
      }
    ));
  }

  setDataToStorage(data) {
    this.currentTimesheetData.status = data?.status;
    this.currentTimesheetData.start_date = data.start_date;
    this.currentTimesheetData.end_date = data.end_date;
    this.storageService.set(TimesheetConstants.TIMESHEET, this.currentTimesheetData, true);
  }

  populateTimesheet(timesheetLogs, hour_data) {
    this.formData.billing_data_total = {};
    if (timesheetLogs?.data?.length > 0) {
      this.formData?.data?.forEach(data => {
        data.billing_data = {};
        const formattedDate = this.timesheetService.formatDateInRequiredFormat(data.date, "yyyy-MM-dd");
        timesheetLogs?.data[0]?.data?.forEach(timesheetLog => {
          if (timesheetLog?.date === formattedDate) {
            for (var break_type in data?.breaks) {
              data.breaks[break_type].breaks = timesheetLog?.breaks?.filter(breaks => breaks.type === break_type);
            }
            data.check_in = timesheetLog.check_in;
            data.check_in_date = timesheetLog?.check_in ? timesheetLog?.check_in_date: undefined;
            data.check_out = timesheetLog.check_out;
            data.check_out_date = timesheetLog?.check_out ? timesheetLog?.check_out_date: undefined;
            data.notes = timesheetLog.notes;
            if (timesheetLog.check_in && timesheetLog.check_out) {
              data.check_in_date_number = getDateFromString(timesheetLog.check_in_date)?.getDate();
              data.check_out_date_number = getDateFromString(timesheetLog.check_out_date)?.getDate();
              this.calculateTotalCheckInOutTime('check_in', data, true);
              // data.difference= this.calculateDifference(timesheetLog?.check_in_date , timesheetLog?.check_out_date , " " +timesheetLog?.check_in, " " +timesheetLog?.check_out);
            }
          }
        });
        hour_data?.data?.forEach(dateLevelTime => {
          if (dateLevelTime?.date === formattedDate) {
            data.billing_data = dateLevelTime;
            for (let key in dateLevelTime) {
              if (key != 'date') {
                if (this.formData.billing_data_total[key] == undefined) {
                  this.formData.billing_data_total[key] = 0;
                }
                this.formData.billing_data_total[key] += parseFloat(dateLevelTime[key]);
              }
            }
          }
        });
      });
      Object.keys(this.formData?.billing_data_total)?.forEach((key) => {
        this.formData.billing_data_total[key] = Number(this.formData?.billing_data_total[key])?.toFixed(8);
      })
      this.formData.timesheet_level_notes = timesheetLogs.notes;
      // this.formData=JSON.parse(JSON.stringify(this.formData)); // fixed time conversion issue
    }
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

  matchHoliday() {
    this.formData?.data?.forEach(c => {
      this.holidayData?.forEach(t => {
        if (this.timesheetService.formatDateInRequiredFormat(c?.date, "yyyy-MM-dd") === t?.date) {
          c.holiday = t;
          if (!t?.is_time_entry_allowed) {
            c.active = false;
          }
          // if (!this.config?.holiday?.is_allow_entry) {
          //   c.disableDate = true;
          // }
        }
      });
    });
  }

  checkValidations(col, fieldName, checkall) {
    const day = col.day?.toLowerCase();
    this.errors[day] = [];
    if (!col.check_in && col.check_out) {
      this.errors[day].push("Please provide Time in value");
    }
    if (col.check_in && !col.check_out) {
      this.errors[day].push("Please provide Time out value");
    }
    if (col?.difference?.hours >= 24) {
      this.errors[day].push("Difference between check-in check out cannot be more than 24 hours.");
    }
    if (col?.difference?.symbol === this.MINUS_SYMBOL) {
      this.errors[day].push("Please select valid Time in-Time out");
    }
    if (this.config?.is_enable_daily_hour_limit && (parseFloat(col?.difference?.decimalValue) > this.config?.allowed_maximum_daily_hours)) {
      this.errors[day].push("Per Day Hours Cannot Exceed More than " + this.config?.allowed_maximum_daily_hours+ ' Hours');
    }
   this.weeklyValidation()
  }

  weeklyValidation() {
    let total: any = 0.00;
    this.formData.data?.forEach(col => {
      if (col?.difference?.decimalValue) {
        total += parseFloat(col?.difference?.decimalValue);
      }
    });
    
    this.errors['week'] = [];
    if (this.config?.is_enable_weekly_hour_limit && (parseFloat(total) > this.config?.allowed_maximum_weekly_hours)) {
      this.errors['week'].push("Per Week Hours Cannot Exceed More than " + this.config?.allowed_maximum_weekly_hours + ' Hours');
    }
  }

  populateTimesheetConfiguration() {
    // const timeSheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
    // this.startDate = Date.parse(timeSheetData.start_date);
    this.startDate = getDateFromString(this.currentTimesheetData?.start_date)?.getTime();
    this.endDate = getDateFromString(this.currentTimesheetData?.end_date)?.getTime();
  }

  private populateInitialConfig() {
    this.formData.data = this.htsService.getDatesBetweenTwoDates(this.startDate, this.endDate, this.config?.weekend?.option, this.config?.work_week?.week_start_day, this.config);
    this.populateBreakConfig();
  }

  populateBreakConfig() {
    this.formData.data?.forEach(col => {
      col.breaks = {};
      col.check_in_date_number = col.dayNumber;
      col.check_out_date_number = col.dayNumber;
      this.initBreaks(col);
    });
  }

  initBreaks(col) {
    this.config.break?.options?.forEach(option => {
      col.breaks[option.type] = { breaks: [], disableBreak: true, allowedBreaks: 0, showCompliantReasons: (option?.penality_rule?.is_allow && !option.is_mandatory) || false };
      // col.disableBreak= {[option.type]: true, ...col.disableBreak};
    });
  }

  updateInOutDate(date_type, isForward, col) {
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

  private processweekends() {
    for (let i = 0; i < this.config?.weekend?.option.length; i++) {
      this.config.weekend.option[i] = this.config?.weekend?.option[i].substr(0, 1).toUpperCase() + this.config?.weekend?.option[i].substr(1, 2);
    }
  }


  calculateTotals() {

  }


  updateHrsAndMin(val) {
    const decimal = (val + "").split(".");

    if (decimal && decimal.length > 1) {
      const hrs = (((+decimal[1]) / 60) + "").split('.')[0];
      let min = (+decimal[1]) % 60 + "";
      val = ((+decimal[1]) + hrs) + ":" + this.htsService.formatMinutes(min);
    }
    return val;
  }


  saveTITOTimeSheet(event, initializeTimesheet?: boolean) {
    this.timesheetService.emitLogs(undefined);
    if(this.isCustomFieldsValid || (this.customFields?.length > 0 && (!this.isAuthorizedToCreate || this.isAssignmentClosed || !this.isTimesheetEnabled))){
      this.formData.custom = this.customFields.filter(ele => ele?.values).map(element => {
        return {
          key: element?.slug,
          value: element.values
        }
      });
    if (this.isValidTimesheet() && !this.isErrorAvailable()) {
      this.disableButton = true;
      let timesheet_logs = [];
      if (initializeTimesheet) {
        this.initialTimesheetPopulation();
      }
      const startDate = getDateFromString(this.currentTimesheetData?.start_date);
      const endDate = getDateFromString(this.currentTimesheetData.end_date);
      this.formData?.data?.forEach(data => {
        if (data.active && startDate <= data.date && data.date <= endDate) {
          const breaks = [];
          for (var break_type in data?.breaks) {
            breaks.push(...data.breaks[break_type]?.breaks);
          }
          timesheet_logs.push({
            date: this.timesheetService.formatDateInRequiredFormat(data.date, "yyyy-MM-dd"),
            breaks: breaks,
            notes: data.notes,
            check_in: data?.check_in || null,
            check_in_date: data?.check_in ? data?.check_in_date: undefined,
            check_out: data?.check_out || null,
            check_out_date: data?.check_out ? data?.check_out_date: undefined,
            overnight: data?.check_in_date === data?.check_out_date ? false : true,
          });
        }
      });
      // this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
      let timesheetId = this.currentTimesheetData?.timesheet_uuid || this.currentTimesheetData?.timesheet_id;
      this.multiApprovals = [
        { name: 'approval', api_url: `/approval/programs/${this.currentProgram?.id}/timesheets/${this.currentTimesheetData?.timesheet_uuid}/approval-instances`, status: 'pending',workflow_type:'approval', isReplaceMember:true },
      ];      
      if (this.currentTimesheetData?.status?.toLowerCase() === TimesheetStatus.WITHDRAWN?.toLowerCase() || this.currentTimesheetData?.status?.toLowerCase() === TimesheetStatus.REJECTED?.toLowerCase()) {
        timesheetId = undefined;
      }
      let payload: any = {
        assignment_uuid: this.currentTimesheetData?.assignment_id,
        user_uuid: this.currentTimesheetData?.user_id,
        parent_type: this.currentTimesheetData?.parent_type,
        child_type: this.currentTimesheetData?.child_type,
        worker_type: "worker",
        start_date: this.currentTimesheetData?.start_date,
        end_date: this.currentTimesheetData?.end_date,
        is_submit: event?.submit,
        custom: this.formData.custom,
        timesheet_logs: {
          data: [{
            data: timesheet_logs
          }],
          notes: this.formData?.timesheet_level_notes
        },
        timesheet_uuid: timesheetId,
      }
      if (event?.submit > 0) {
        this.confirmService.confirm('', `Are you sure you want to submit the timesheet?`,
          'Yes', 'No')
          .then((confirmed) => {
            if (confirmed) {
              this.saveTimesheet(payload, event);
            } else {
              this.disableButton = false;
            }
          })
          .catch(() => {
          });
      } else {
        this.saveTimesheet(payload, event);
      }
    } else {
      // this.alert.error("Please enter valid data");
      const logs = { type: LOG_TYPE.ERROR, heading: "Please enter valid data", autoClose: true, isShown: true };
      this.timesheetService.emitLogs(logs);
    }
  } else {
    this.disableButton = false;
    this.alert.error('Please fill all the custom fields');
  }
  }

  saveTimesheet(payload, event) {
    if (payload.timesheet_uuid) {
      this.updateDayTimesheet(payload, event);
    } else {
      this.createDayTimesheet(payload, event);
    }
  }
  createDayTimesheet(payload, event) {
    this.timesheetService.emitLogs(undefined);
    this.subscriptions.push(this.timesheetService.createDayTimesheet(payload).subscribe(
      {
        next: data => {
          this.processResponse(data, event);
        }, error: (err) => {
          this.getErrorMessage(err);
          this.disableButton = false;
        }
      }
    ));
  }

  updateDayTimesheet(payload, event) {
    this.timesheetService.emitLogs(undefined);
    this.subscriptions.push(this.timesheetService.updateDayTimesheet(payload).subscribe(
      {
        next: data => {
          this.processResponse(data, event);
        }, error: (err) => {
          this.getErrorMessage(err);
          this.disableButton = false;
        }
      }
    ));
  }

  processResponse(data, event) {
    if (data?.data?.timesheet_id) {
      this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
      this.currentTimesheetData.timesheet_uuid = data?.data?.timesheet_id;
      this.multiApprovals = [
        { name: 'approval', api_url: `/approval/programs/${this.currentProgram?.id}/timesheets/${this.currentTimesheetData?.timesheet_uuid}/approval-instances`, status: 'pending',workflow_type:'approval', isReplaceMember:true },
      ];      
      this.currentTimesheetData.timesheet_id = data?.data.timesheet_id;
      if (!this.currentTimesheetData?.status || this.currentTimesheetData?.status?.toLowerCase() == TimesheetStatus.WITHDRAWN || this.currentTimesheetData?.status?.toLowerCase() == TimesheetStatus.REJECTED) {
        this.currentTimesheetData.status = TimesheetStatus.DRAFT;
      }
      this.storageService.set(TimesheetConstants.TIMESHEET, this.currentTimesheetData, true);
      this.eventStream.emit(new EmitEvent(Events.UPDATE_CURRENT_TIMESHEET_DETAILS, undefined));
      this.isAuthorizedToCreateTimesheet(false, this.timeSheet?.data?.actions_allow?.can_save);
    }
    this.alert.success(data?.message);
    if (event?.submit > 0) {
      this.router.navigate(['/timesheet/list/pending']);
    } else {
      this.getTimesheetDetails();
    }
    this.disableButton = false;
  }

  getErrorMessage(err) {
    const logs = this.timesheetService.showErrorLog(err, (err?.status == 500 || err?.status == 400));
    this.timesheetService.emitLogs(logs);
    /* if (err?.error?.error?.errors?.length > 0 && err?.error?.error?.errors[0]?.message) {
      this.alert.error(err?.error?.error?.errors[0]?.message);
    } else if (err?.error?.errors[0]?.message) {
      this.alert.error(err?.error?.errors[0]?.message);
    } else {
      this.alert.error(errorHandler(err));
    } */
  }

  isValidTimesheet(): boolean {
    this.formData?.data?.forEach(col => {
      this.checkValidations(col, undefined, true);
    });
    return true;
  }

  editNote(w) {
    this.selectedIndex = w;
  }

  openBreakModal(breakModal, type, col, index) {
    if (this.isAuthorizedToCreate && !this.isAssignmentClosed && this.isTimesheetEnabled) {
      if (col) {
        col.temp_break_in = undefined;
        col.temp_break_out = undefined;
        col.temp_compliant = undefined;
        col.temp_index = undefined;
        col.temp_break_out_date_number = col.dayNumber;
        col.temp_break_in_date_number = col.dayNumber;
        if (index >= 0 && col.breaks[type].breaks?.length >= index) {
          const breaks = col.breaks[type].breaks[index];
          col.temp_break_in = breaks?.break_in;
          col.temp_break_out = breaks?.break_out;
          col.temp_compliant = breaks?.compliant;
          col.temp_break_out_date = breaks?.break_out_date;
          col.temp_break_in_date = breaks?.break_in_date;
          col.temp_break_out_date_number = breaks?.break_out_number || col?.dayNumber;
          col.temp_break_in_date_number = breaks?.break_in_number || col?.dayNumber;
          col.temp_index = index;
        }
      }
      this.breakModal = breakModal;
    }
  }

  showBillableBreakUp() {
    this.billableBreakup = !this.billableBreakup;
  }

  copyTimesheetInSelectedWeek(event) {
    this.disableClearAllButton = false;
    if (event?.timesheet) {
      this.formData?.data?.forEach(data => {
        event?.timesheet?.data[0]?.data?.forEach(timesheetLog => {
          const day = this.htsService.getDayOfDate(timesheetLog.date);
          const formattedDate = this.timesheetService.formatDateInRequiredFormat(data?.date, "yyyy-MM-dd");
          const date = addDays(formattedDate, 1);
          const formattedNextDate = this.timesheetService.formatDateInRequiredFormat(date, "yyyy-MM-dd");
          if (day === data.day) {
            for (var break_type in data?.breaks) {
              data.breaks[break_type].breaks = timesheetLog?.breaks?.filter(breaks => breaks.type === break_type);
              data.breaks[break_type]?.breaks?.forEach(breakData => {
                if (breakData.break_in_date) {
                  if (breakData.break_in_date === timesheetLog.date) {
                    breakData.break_in_date = formattedDate;
                  } else {
                    breakData.break_in_date = formattedNextDate;
                  }
                }
                if (breakData.break_out_date) {
                  if (breakData.break_out_date === timesheetLog.date) {
                    breakData.break_out_date = formattedDate;
                  } else {
                    breakData.break_out_date = formattedNextDate;
                  }
                }
              });
            }
            if (timesheetLog.check_in) {
              data.check_in = timesheetLog.check_in;
              if (timesheetLog.check_in_date === timesheetLog.date) {
                data.check_in_date = formattedDate;
              } else {
                data.check_in_date = formattedNextDate;
              }
            }
            if (timesheetLog.check_out) {
              data.check_out = timesheetLog.check_out;
              if (timesheetLog.check_out_date === timesheetLog.date) {
                data.check_out_date = formattedDate;
              } else {
                data.check_out_date = formattedNextDate;
              }
            }
            data.notes = timesheetLog.notes;
            if (data.check_in && data.check_out && data?.check_in_date && data?.check_out_date) {
              this.calculateTotalCheckInOutTime('check_in', data, true);
              // data.difference= this.calculateDifference(data?.check_in_date , data?.check_out_date , " " +data?.check_in, " " +data?.check_out);
              // this.checkValidations(data, undefined);
            }
          }
        });
      });
    }
    if (event?.showCopyButton) {
      this.showCopyButton = true;
    }
    this.showCopywidget = false;
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  openMoreItem(option) {
    if (option) {
      option.moreItemModal = true;
    }
  }

  closeMoreItem(option) {
    if (option) {
      option.moreItemModal = false;
    }
  }
  isVisibleOptions() {
    return (!this.currentTimesheetData?.status || this.currentTimesheetData?.status == this.timesheetStatuses?.DRAFT || this.currentTimesheetData?.status == this.timesheetStatuses?.MISSING) && this.isAuthorizedToCreate && !this.isAssignmentClosed && this.isTimesheetEnabled;
  }

  isShowTimesheetBilling() {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let isshow = this.route?.snapshot?.queryParams['isshow'];
    if (isshow) {
      return true
    } else {
      if (this.currentProgram?.config?.timesheet?.hide_billable_section) {
        return false;
      } else {
        return true;
      }
    }
  }

  get hasOverrideApprovalPermission() {
    return this.timesheetService?.hasAdminOverridePermission();
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

}
