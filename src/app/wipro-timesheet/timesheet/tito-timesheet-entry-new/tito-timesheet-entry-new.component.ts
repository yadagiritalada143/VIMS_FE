
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { HourlyTimeSheetService } from '../hourly-timesheet/hourly-time-sheet.service';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { DATE_FORMAT, TimesheetConstants, TimesheetGracePeriod, TimesheetStatus, UsersType } from '../../timesheet.enums';
import { addDays, convertHoursToDecimal, convertTime12to24, getDateFromString } from '../../timesheet.utils';
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
@Component({
  selector: 'app-tito-timesheet-entry-new',
  templateUrl: './tito-timesheet-entry-new.component.html',
  styleUrls: ['./tito-timesheet-entry-new.component.scss']
})
export class TITOTimesheetEntryNewComponent implements OnInit {
  dateFormatEnum = DATE_FORMAT; 
  selectedCustomData = {};
  activeTableItem: number;
  showFullData: boolean = false;
  titoEntry: any = [];
  totalEntry: any = [];
  activeItem: number;
  public redirectToSow = '';
  showErrorMessage = false;
  public startDate;
  redirectTimesheetFlyout: string;
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
  public redirectSow = false;
  public project_id: any;
  public sow_id: any;
  currentProgram: any = undefined;
  public config: any;
  public readonly MINUS_SYMBOL = '-';
  compliantReasons = [
    { id: 'Due To Work', name: 'Due To Work' },
    { id: 'My choice', name: 'My choice' }
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
  holidayData: any = undefined;
  dropdownToggle: boolean = false;
  showTimePanel: string = undefined;
  isAuthorizedToCreate: boolean = false;
  showCopywidget: boolean = false;
  sourcing_model: any;
  oldLogs: any;
  oldSelectedDay: any;
  customFields: any[] = [];
  isCustomFieldsValid: any;
  public multiApprovals:any;
  timesheetTab: string = "timesheet";

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
        this.redirectTimesheetFlyout = params['params']?.title;
      })
     }

  ngOnInit(): void {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (currentProgram) {
      // this.isShowMultiApproval = currentProgram.config?.multiple_approval_timesheet_expense;
      this.isShowMultiApproval = (currentProgram?.config?.modules_using_flow_system || [])?.indexOf('TIMESHEETS') !== -1;
    }
    this.initializeTimesheet();
    const timesheetId = this.route.snapshot.queryParams['timesheetId'];
    this.eventStream.on(Events.APPROVAL_ACTION).subscribe((data) => {
      if(data){
        this.initializeTimesheet();
        this.multiApprovals = [
          { name: 'approval', api_url: `/approval/programs/${this.currentProgram?.id}/timesheets/${this.currentTimesheetData?.timesheet_uuid || timesheetId}/approval-instances`, status: 'pending', workflow_type: 'approval', isReplaceMember: true },
        ];
      } 
    })
    this.subscriptions.push(this.eventStream.on(Events.TIMESHEET_ACTION_FLYOUT).subscribe((data: any) => {
      if (data?.reloadCalendar) {
        this.initializeTimesheet();
      }
    }));
    this.multiApprovals = [
      { name: 'approval', api_url: `/approval/programs/${this.currentProgram?.id}/timesheets/${this.currentTimesheetData?.timesheet_uuid || timesheetId}/approval-instances`, status: 'pending',workflow_type:'approval', isReplaceMember:true },
    ];  
  }

  initializeTimesheet() {
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
  }
  showTimesheetTab(value) {
    this.timesheetTab = value;
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

  initialTimesheetPopulation() {
    this.populateTimesheetConfiguration();
    this.processweekends();
    this.populateInitialConfig();
  }

  populateTimesheetConfiguration() {
    this.startDate = getDateFromString(this.currentTimesheetData?.start_date)?.getTime();
    this.endDate = getDateFromString(this.currentTimesheetData?.end_date)?.getTime();
  }

  private processweekends() {
    for (let i = 0; i < this.config?.weekend?.option.length; i++) {
      this.config.weekend.option[i] = this.config?.weekend?.option[i].substr(0, 1).toUpperCase() + this.config?.weekend?.option[i].substr(1, 2);
    }
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

  


  getHoliday(id) {
    let year = '';
    if (this.currentTimesheetData?.start_date) {
      const date = this.currentTimesheetData?.start_date?.split("-");
      if (date?.length > 0) {
        year = date[0];
      }
      year = '&year=' + year;
    }
    this.timesheetService.getHolidayList(id, year).subscribe(
      (data: any) => {
        this.holidayData = data?.holiday_calendars[0]?.holidays;
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


  private processMinMaxHours() {
    this.config?.break?.options?.forEach(option => {
      option?.break_rule?.forEach(rule => {
        if (rule?.max_hours) {
          let maxvalue = rule?.max_hours?.replace(':', '.');
          maxvalue = parseFloat(maxvalue);
          rule.max_hours_Converted = maxvalue;
        }
        if (rule?.min_hours) {
          let minvalue = rule?.min_hours?.replace(':', '.');
          minvalue = parseFloat(minvalue);
          rule.min_hours_Converted = minvalue;
        }
      });
    });
  }

  public navigateBackTo() {
    if (this.redirectToSow === SOW_TYPE.PROJECT) {
      this.router.navigate([`/sow/${this.sow_id}/milestones/${this.project_id}/invoicing`]);
    } else if (this.redirectToSow === SOW_TYPE.SOW) {
      this.router.navigate([`/sow/${this.sow_id}/invoicing`]);
    } else if(this.redirectTimesheetFlyout){
      let queryParams = { tab: 'budget', openTimesheetListTab: true , status : this.redirectTimesheetFlyout?.toLowerCase() === 'timesheet approved' ? 'approved' : 'all-pending'  };
      this.router.navigate([`assignment/details/${this.currentTimesheetData?.assignment_id}/final`], { queryParams});
    } else {
      this.router.navigate(['/timesheet/list/all']);
    }
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

  isAuthorizedToCreateTimesheet(is_need_create, can_save) {
    this.isAuthorizedToCreate = this.timesheetService.isAuthorizedToCreate(is_need_create, can_save);
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
            // this.saveTITOTimeSheet(0, true);
          }
        })
        .catch(() => {
          this.alert.error("Some issue happening opening the confirm popup for duration change");
        });
    }
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
            data.check_in_date = timesheetLog?.check_in ? timesheetLog?.check_in_date : undefined;
            data.check_out = timesheetLog.check_out;
            data.check_out_date = timesheetLog?.check_out ? timesheetLog?.check_out_date : undefined;
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

  getErrorMessage(err) {
    const logs = this.timesheetService.showErrorLog(err, (err?.status == 500 || err?.status == 400));
    // console.log('this.oldLogs last', this.oldLogs);
    // this.formData.data = this.oldLogs;
    this.timesheetService.emitLogs(logs);
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
            check_in_date: data?.check_in ? data?.check_in_date : undefined,
            check_out: data?.check_out || null,
            check_out_date: data?.check_out ? data?.check_out_date : undefined,
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
    this.formData.data = this.oldLogs;
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
      this.currentTimesheetData.timesheet_id = data?.data.timesheet_id;
      if (!this.currentTimesheetData?.status || this.currentTimesheetData?.status?.toLowerCase() == TimesheetStatus.WITHDRAWN || this.currentTimesheetData?.status?.toLowerCase() == TimesheetStatus.REJECTED) {
        this.currentTimesheetData.status = TimesheetStatus.DRAFT;
      }
      this.storageService.set(TimesheetConstants.TIMESHEET, this.currentTimesheetData, true);
      this.eventStream.emit(new EmitEvent(Events.UPDATE_CURRENT_TIMESHEET_DETAILS, undefined));
      this.isAuthorizedToCreateTimesheet(false, this.timeSheet?.data?.actions_allow?.can_save);
    }
    this.alert.success(data?.message);
    // Its for redirect to the new date
    if (this.oldSelectedDay && this.breakModal) {
      let index = this.formData?.data?.findIndex(x => x?.dayNumber === this.oldSelectedDay?.dayNumber);
      if (((index + 1) !== this.formData?.data?.length) && this.formData?.data[index + 1]?.active) {
        this.addNewTime(this.formData?.data[index + 1]);
      }
    } else {
      this.eventStream.emit(new EmitEvent(Events.ADD_NEW_TIME,
        {
          breakModal: false
        }));
    }
    if (event?.submit > 0) {
      this.router.navigate(['/timesheet/list/pending']);
    } else {
      this.getTimesheetDetails();
    }
    this.disableButton = false;
  }

  isValidTimesheet(): boolean {
    this.formData?.data?.forEach(col => {
      this.checkValidations(col, undefined, true);
    });
    return true;
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

  updateLogs(logs) {
    if(logs?.selectedDay){
      let index = logs?.data?.findIndex(d=> { return logs?.selectedDay?.dayNumber === d?.dayNumber});
      logs.data[index] = logs?.selectedDay;
    }
    this.breakModal = logs?.breakModal;
    this.formData.data = logs?.data;
    this.saveTITOTimeSheet({ submit: 0 });
  }

  isVisibleOptions() {
    return (!this.currentTimesheetData?.status || this.currentTimesheetData?.status == this.timesheetStatuses?.DRAFT || this.currentTimesheetData?.status == this.timesheetStatuses?.MISSING) && this.isAuthorizedToCreate && !this.isAssignmentClosed && this.isTimesheetEnabled;
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

  get hasOverrideApprovalPermission() {
    return this.timesheetService?.hasAdminOverridePermission();
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  unsorted = (a, b) => {
    return a;
  }
  
  percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
  }

  breakPercentage(data) {
    let total = {hours: 0 , minutes: 0};
    let hours = 0;
    let minutes = 0;
    data?.forEach(b => {
      if(b?.break_in ||  b?.break_out){
      let Difference = this.calculateDifference(b?.break_in_date, b?.break_out_date, " " + b?.break_in, " " + b?.break_out);
      hours += Difference?.hours; 
      minutes += (Difference?.minutes)
      total = {hours: +(hours), minutes: +(minutes)};
      }      
    });
    return this.percentage(total?.hours + '.' + total?.minutes, 12) ;
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

  panaltyBreakCount(breaks) {
    let count = 0;
    breaks?.forEach(b => {
      if(b?.compliant) {
        count++;
      }
    });
    return count;
  }

  showHideEntry(i, row) {
    if (row?.active && row?.check_in && row?.check_out) {
      if(this.activeItem != i){
      this.activeItem = i;
      } else {
        this.activeItem = this.formData?.data?.length + 1;
      }
    }
  }

  showHideFUllData() {
    this.showFullData = !this.showFullData;
  }

  showHideChildRow(i) {
    this.activeTableItem = i
  }

  breakDifference(col) {
    let Difference = this.calculateDifference(col?.break_in_date, col?.break_out_date, " " + col?.break_in, " " + col?.break_out);
    let value = '';
    if (Difference?.hours) {
      value = Difference?.hours + ' Hrs' + Difference?.minutes + ' Min';
    } else if (Difference?.minutes) {
      value = Difference?.minutes + ' Min'
    }
    return value;
  }

  addNewTime(data) {
    this.oldLogs = JSON.parse(JSON.stringify(this.formData?.data));
    this.oldSelectedDay = JSON.parse(JSON.stringify(data));
    this.eventStream.emit(new EmitEvent(Events.ADD_NEW_TIME,
      {
        formData: this.formData,
        config: this.config,
        selectedDay: data,
        breakModal: true,
        timeSheet: this.timeSheet,
        isAssignmentClosed: this.isAssignmentClosed,
        isTimesheetEnabled: this.isTimesheetEnabled,
        oldLogs: this.oldLogs,
        timePlaceHolder: this.timePlaceHolder
      }));
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
