import { Component, OnDestroy, OnInit } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { DatePipe } from '@angular/common';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { DATE_FORMAT, HoursDefaultValues, HoursInputType, TimesheetConstants, TimesheetGracePeriod, TimesheetRoutes, TimesheetStatus, TimesheetType, TimesheetWeeklyType, TimesheetWorkType, TimesheetWorkTypeAbbreviation, TimesheetWorkWeekDays, UsersType } from 'src/app/wipro-timesheet/timesheet.enums';
import { Subscription } from 'rxjs';
import { HourlyTimeSheetService } from '../hourly-time-sheet.service';
import { addDays, convertHoursToDecimal, getDateFromString, MonthList, sortByKey } from 'src/app/wipro-timesheet/timesheet.utils';
import { ClonerService } from 'src/app/core/services/cloner.service';

export enum SOW_TYPE {
  SOW = 'sow',
  PROJECT = 'project',
}
@Component({
  selector: 'app-monthly-hour-based-timesheet-entry',
  templateUrl: './monthly-hour-based-timesheet-entry.component.html',
  styleUrls: ['./monthly-hour-based-timesheet-entry.component.scss']
})
export class MonthlyHourBasedTimesheetEntryComponent implements OnInit, OnDestroy {
  dateFormatEnum = DATE_FORMAT; 
  public isAuthorizedToCreate: boolean = false;
  public redirectToSow = '';
  public redirectSow = false;
  public project_id: any;
  public sow_id: any;
  // workingWeekDays: any = [];
  holidayData: any = [];
  leaveApplicationModal;
  leaveDuration;
  editLeaveModal;
  selectedWeekIndex: any;
  redirectTimesheetFlyout: string;
  dataLoader: boolean = true;
  billingData: any = [];
  public timesheetStatus: string = undefined;
  public timeSheet: any = {};
  public calendar: any = [];
  public readonly dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  public days: any = [];
  isSubmitted: boolean = false;
  isAllSubmitted: boolean = false;
  pickListData: any;
  locationData: any;
  // timesheet: any = [];
  public weekData: any = [];
  programId: string = undefined;
  public monthDate: Date = undefined;
  public config: any = {};
  currentTimesheetData;
  dropDownItems: any = [];
  projectCodes: any = [];
  earnLeaveBalance: number = 0;
  earned_leave: number = 0;
  timesheetInfoDetails;
  assignmentDetails: any;
  isTimesheetEnabled: boolean;
  isshowHoliday: boolean = true;
  gridView = true;
  _locationData: any = [];
  selectedLocation: string = undefined;
  noteDropdown = false;
  basicInfoLocationType: string = undefined;
  private accountDetails = this.storageService.get('account');
  showMarkWeekOffBtn: boolean = false;
  assignmentWorker: any = {};
  disableDropDown: any = { first: false, last: false };
  isAssignmentClosed: boolean = false;
  tooltipvisible: boolean = false;
  ruleConfiguration: any = {};
  timesheetStatuses = TimesheetStatus;
  disableButton: boolean = false;
  timesheet_logs: any = {};
  response_timesheet_logs: any = {};
  hideTimesheetAlert: boolean = false;
  private subscriptions: Subscription[] = [];
  getDateFromString = getDateFromString;
  selectedCustomData = {};
  customFields: any[] = [];
  isCustomFieldsValid: any;

  constructor(
    private storageService: StorageService,
    private htsService: HourlyTimeSheetService,
    private timesheetService: TimesheetService,
    private router: Router,
    private route: ActivatedRoute,
    private alert: AlertService, private clonerService: ClonerService,
    private confirmService: ConfirmationDialogService,
    private datePipe: DatePipe, private eventStream: EventStreamService,
    private authorizationService: AuthorizationService

  ) {
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
    this.initializeTimesheet();
    this.subscriptions.push(this.eventStream.on(Events.TIMESHEET_ACTION_FLYOUT).subscribe((data) => {
      if (data?.reloadCalendar) {
        this.initializeTimesheet();
      }
    }));
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
  initializeTimesheet() {
    const program = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = program?.id;
    const timesheetId = this.route.snapshot.queryParams['timesheetId'];
    this.isAuthorizedToCreateTimesheet(false, this.timeSheet?.data?.actions_allow?.can_save);
    if (timesheetId) {
      this.storageService.set(TimesheetConstants.TIMESHEET, {
        timesheet_id: timesheetId,
        timesheet_uuid: timesheetId,
      }, true);
      this.getBasicInfo(timesheetId);
    } else {
      this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
      this.getRuleConfiguration();
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

    if (this.isAuthorizedToCreate) {
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

  getRuleConfiguration() {
    this.timesheetService.emitLogs(undefined);
    this.timesheetService.getRuleConfiguration(this.currentTimesheetData?.assignment_id, this.currentTimesheetData?.start_date, this.currentTimesheetData?.end_date).subscribe(
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
          if (data?.data) {
            this.ruleConfiguration = data.data;
            if (this.config?.hour_type_calculation === TimesheetWeeklyType.MANUAL) {
              this.populateManualNoProjectDropdown();
            }
          }
         }
        }, error: (err) => { }
    }
    );
  }

  getBasicInfo(timesheetId) {
    this.timesheetService.emitLogs(undefined);
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
            this.eventStream.emit(new EmitEvent(Events.UPDATE_CURRENT_TIMESHEET_DETAILS, undefined));
          }
        }, error: (err) => {
          this.getErrorMessage(err);
          // this.alert.error(errorHandler(err));
          // this.alert.error("Something went wrong");
        }
      }
    );
  }

  getErrorMessage(err) {
    const logs = this.timesheetService.showErrorLog(err, false);
    this.timesheetService.emitLogs(logs);
  }

  isValidTimesheet(showAlerts): boolean {
    return true;
  }

  copyTimesheetData(event) {
    this.disableButton = true;
    event.pasteIndexes?.forEach(data => {
      if (data >= 0) {
        for (let i = 0; i <= 6; i++) {
          let startIndex = this.getCurrentIndex(data, i);
          const selectedDate = this.datePipe.transform((new Date(this.calendar[startIndex]?.date)), "yyyy-MM-dd");
          this.timesheet_logs?.data?.forEach((projectData, projectIndex) => {
            projectData?.data.forEach((logs, logsIndex) => {
              if (selectedDate === logs.date) {
                this.timesheet_logs.data[projectIndex].data[logsIndex] = { date: logs.date, break: [] };
              }
            });
          });
        }
      }
    });

    //how to remove preset data for the day?
    event.pasteIndexes?.forEach(data => {
      if (data >= 0) {
        for (let i = 0; i <= 6; i++) {
          let copyIndex = this.getCurrentIndex(event.copyIndex, i);
          let copyFrom = this.calendar[copyIndex]?.timesheet;
          let startIndex = this.getCurrentIndex(data, i);
          const selectedDate = this.datePipe.transform((new Date(this.calendar[startIndex]?.date)), "yyyy-MM-dd");
          if (copyFrom?.projects?.length > 0) {
            copyFrom.projects?.forEach(projectData => {
              let projectIndex = undefined;
              const isProjectFound = this.timesheet_logs?.data.some((project, index) => {
                if (project?.project_title === projectData?.project_title) { projectIndex = index }; return project?.project_title === projectData?.project_title
              });
              if (isProjectFound && projectIndex >= 0) {
                this.timesheet_logs?.data[projectIndex]?.data.forEach((logs, logsIndex) => {
                  if (selectedDate === logs.date) {
                    if (this.config?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType.MANUAL?.toLowerCase()) {
                      this.timesheet_logs.data[projectIndex].data[logsIndex] = { ...this.timesheet_logs.data[projectIndex].data[logsIndex], ...this.calendar[copyIndex]?.timesheet, date: selectedDate };
                      if (Array.isArray(this.timesheet_logs.data[projectIndex].data[logsIndex].hours)) {
                        this.timesheet_logs.data[projectIndex].data[logsIndex].hours.push({ value: projectData.hours, hours_type: projectData?.hours_type });
                      } else {
                        this.timesheet_logs.data[projectIndex].data[logsIndex].hours = [{ value: projectData.hours, hours_type: projectData?.hours_type }];
                      }
                    } else {
                      this.timesheet_logs.data[projectIndex].data[logsIndex] = { ...projectData, ...this.calendar[copyIndex]?.timesheet, date: selectedDate };
                    }

                  }
                });
              } else {
                if (this.config?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType.MANUAL?.toLowerCase()) {
                  this.timesheet_logs?.data.push({ data: [{ ...projectData, ...this.calendar[copyIndex]?.timesheet, hours: [{ value: projectData.hours, hours_type: projectData?.hours_type, }], date: selectedDate }], project_title: projectData?.project_title, project_type: projectData?.project_type });
                } else {
                  this.timesheet_logs?.data.push({ data: [{ ...projectData, ...this.calendar[copyIndex]?.timesheet, date: selectedDate }], project_title: projectData?.project_title, project_type: projectData?.project_type });
                }
              }
            });
          }
        }
      }
    });
    this.saveTimesheet(0);

  }

  createHourlyPayload(event) {
    this.disableButton = true;
    // this.timesheet_logs={};
    if (!this.timesheet_logs?.data) {
      this.timesheet_logs.data = [];
    } else {
      this.timesheet_logs?.data?.forEach((projectData, projectIndex) => {
        projectData?.data.forEach((logs, logsIndex) => {
          if (this.timesheetService.formatDateInRequiredFormat(event?.date, "yyyy-MM-dd") === logs.date) {
            this.timesheet_logs.data[projectIndex].data[logsIndex] = { date: logs.date, break: [] };
          }
        });
      });
    }
    if (!event?.delete) {
      event?.timesheet?.projects?.forEach(project => {
        let isProjectFound = false;
        this.timesheet_logs?.data.forEach((projectData, projectIndex) => {
          let isLogsFound = false;
          projectData?.data.forEach((logs, logsIndex) => {
            if (project?.project_title === projectData?.project_title) {
              isProjectFound = true;
              if (this.timesheetService.formatDateInRequiredFormat(project?.date, "yyyy-MM-dd") === logs.date) {
                isLogsFound = true;
                if (this.config?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType.MANUAL?.toLowerCase()) {
                  this.timesheet_logs.data[projectIndex].data[logsIndex] = { ...this.timesheet_logs.data[projectIndex].data[logsIndex], ...event?.timesheet };
                  if (Array.isArray(this.timesheet_logs.data[projectIndex].data[logsIndex].hours)) {
                    this.timesheet_logs.data[projectIndex].data[logsIndex].hours.push({ value: project.hours, hours_type: project?.hours_type });
                  } else {
                    this.timesheet_logs.data[projectIndex].data[logsIndex].hours = [{ value: project.hours, hours_type: project?.hours_type }];
                  }
                } else {
                  this.timesheet_logs.data[projectIndex].data[logsIndex] = { ...project, ...event?.timesheet };
                }
              }

            }
          });
          if (!isLogsFound && projectData?.project_title === project?.project_title) {
            if (this.config?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType.MANUAL?.toLowerCase()) {
              this.timesheet_logs?.data[projectIndex]?.data.push({ ...project, hours: [{ value: project.hours, hours_type: project?.hours_type }] });
            } else {
              this.timesheet_logs?.data[projectIndex]?.data.push({ ...project, ...event?.timesheet });
            }
            this.timesheet_logs.data[projectIndex].data = sortByKey(this.timesheet_logs?.data[projectIndex]?.data, "date");
          }
        });
        if (!isProjectFound) {
          if (this.config?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType.MANUAL?.toLowerCase()) {
            this.timesheet_logs?.data.push({ data: [{ ...project, ...event?.timesheet, hours: [{ value: project.hours, hours_type: project?.hours_type, }] }], project_title: project?.project_title, project_type: project?.project_type });
          } else {
            this.timesheet_logs?.data.push({ data: [{ ...project, ...event?.timesheet }], project_title: project?.project_title, project_type: project?.project_type });
          }
        }
      });
    }
    this.saveTimesheet(0);
  }

  submitHourlyTimeSheet(event) {
    if (this.isValidTimesheet(true)) {
      this.disableButton = true;
      if (event?.submit > 0) {
        this.confirmService.confirm('', `Are you sure you want to submit the timesheet?`,
          'Yes', 'No')
          .then((confirmed) => {
            if (confirmed) {
              this.saveTimesheet(event.submit);
            } else {
              this.disableButton = false;
            }
          })
          .catch(() => {
          });
      } else {
        this.saveTimesheet(event.submit);
      }

    } else {
      this.alert.error("Please enter valid data");
    }
  }

  isAuthorizedToCreateTimesheet(is_need_create, can_save) {
    this.isAuthorizedToCreate = this.timesheetService.isAuthorizedToCreate(is_need_create, can_save);
  }

  saveTimesheet(submit) {
    this.timesheetService.emitLogs(undefined);
    let customFields;
    if(this.isCustomFieldsValid || (this.customFields?.length > 0 && (!this.isAuthorizedToCreate || this.isAssignmentClosed || !this.isTimesheetEnabled))){
      customFields = this.customFields.filter(ele => ele?.values).map(element => {
        return {
          key: element?.slug,
          value: element.values
        }
      });
    }
    if (!this.timesheet_logs?.data) {
      this.timesheet_logs = { data: [{ data: [] }] };
    }
    this.subscriptions.push(this.htsService.saveHourlyTimesheetData(submit, this.timesheet_logs, customFields).subscribe(
      {
        next: (data: any) => {
          //check if its create or update call by response
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
          if (submit > 0) {
            this.router.navigate(['/timesheet/list/pending']);
          } else {
            this.cancelApplication({ close: true });
          }
          this.disableButton = false;
        }, error: err => {
          this.getErrorMessage(err);
          this.timesheet_logs = this.clonerService.deepClone(this.response_timesheet_logs);
          this.disableButton = false;
        }
      }
    ));
  }

  openNotes() {
    this.noteDropdown = true;
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
    return this.config?.work_week?.period?.toLowerCase() === TimesheetType?.MONTHLY?.toLowerCase() && this.router?.url?.toLowerCase() === TimesheetRoutes?.MONTHLY_HOUR_BASED_ENTRY_ROUTE?.toLowerCase();//revert later
  }

  get hasOverrideApprovalPermission() {
    return this.timesheetService?.hasAdminOverridePermission();
  }

  getTimesheetConfigurator() {
    this.timesheetService.emitLogs(undefined);
    const _url = `/timesheet/programs/${this.programId}/config?assignment_uuid=${this.currentTimesheetData?.assignment_id}`; // temporary
    this.timesheetService.get(_url).subscribe(
      {
        next: (data: any) => {
          this.config = data?.data;
          if (this.validateTimesheetWeeklyType()) {
            if (this.config?.project?.is_allow) {
              this.getProjectCodes();
            } else if (this.config.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType.MANUAL?.toLowerCase()) {
              this.populateManualNoProjectDropdown();
            } else {
              this.dropDownItems = undefined;
            }
            this.getTimeSheetDetails();
            const value = this.getStartDayOfCalendar(this.config?.work_week?.week_start_day); // pass this from configurator
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
        }, error: err => {
          this.getErrorMessage(err);
        }
      }
    )
  }

  setDaysArray(dayNumber: number) {
    for (let i = dayNumber; i <= 7; i++) {
      if (this.days.length < 7) {
        this.days.push({ name: this.dayNames[i], isWeekend: this.config?.weekend?.option?.includes(this.dayNames[i]?.toLowerCase()) });
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

  durationUpdate() {
    this.leaveDuration = true;
  }

  openApplicationModal(allowOpen, i, j, date, dayTimeEntry) {
    if (allowOpen && this.isTimesheetEnabled && !this.isAssignmentClosed && (this.editViewCheck(dayTimeEntry) || this.isAuthorizedToCreate)) {
      this.leaveApplicationModal = i;
      this.selectedWeekIndex = j;
      this.hideTimesheetAlert = true;
    }
  }

  cancelApplication(data) {
    this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
    this.leaveApplicationModal = '';
    this.selectedWeekIndex = '';
    this.hideTimesheetAlert = true;
    if (data?.reloadCalendar) {
      this.reloadCalendar();
    }
    if (data?.close) {
      this.getTimeSheetDetails();
      this.hideTimesheetAlert = false;
    }
  }

  reloadCalendar() {
    if (this.currentTimesheetData?.start_date) {
      const value = this.getStartDayOfCalendar(this.config?.work_week?.week_start_day); // pass this from configurator
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
    const copiedMonthDate = monthDate;
    let startingDateOfCalendar = this.getStartDateForCalendar(monthDate, dayNumber, true);
    let dateToAdd = startingDateOfCalendar;
    const currentMonth = copiedMonthDate;//this.monthDate;//new Date(this.monthDate);
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1, 0, 0, 0, 0);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 0, 0, 0, 0);
    // const work_week = this.config.work_week;
    const work_week_end_day = TimesheetWorkWeekDays[this.config?.work_week?.week_start_day];
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
      const disableDate = (date?.date < start_date || date?.date > end_date || (!this.config?.weekend?.is_allow_entry && this.config?.weekend?.option?.includes(this.getDayOfDate(date?.date?.getDay()))));
      date.disableDate = disableDate;
      date.isvalidTimesheetDate = (date?.date >= start_date && date?.date <= end_date)
    });
    // this.setWorkingDaysPerWeek([]);

    this.getLogData(this.timesheetService.formatDateInRequiredFormat(this.calendar[0].date, "yyyy-MM-dd"), this.timesheetService.formatDateInRequiredFormat(this.calendar[this.calendar?.length - 1].date, "yyyy-MM-dd"));
    // this.getLogData(this.datePipe.transform((this.calendar[0].date), "yyyy-MM-dd"), this.datePipe.transform((this.calendar[this.calendar?.length - 1].date), "yyyy-MM-dd"));
  }

  getDayOfDate(dayNumber) {
    let weekday = new Array(7);
    weekday[0] = "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";
    return weekday[dayNumber]?.toLowerCase();
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

  getTimeSheetDetails() {
    const allowCopyPasteCheck = [];
    if (this.currentTimesheetData?.timesheet_uuid) {
      this.timesheetService.getTimesheetDetails(this.currentTimesheetData?.timesheet_uuid).subscribe(
        {
          next: (data: any) => {
            this.timeSheet = data;
            if (data?.data) {
              this.currentTimesheetData.status = data.data?.status?.toLowerCase();
              this.showTooltip();
              this.timesheetStatus = data.data?.status?.toLowerCase();
              this.currentTimesheetData.code = data.data?.code;
              this.storageService.set(TimesheetConstants.TIMESHEET, this.currentTimesheetData, true);
              this.timesheetInfoDetails = data.data;
              this.isAuthorizedToCreateTimesheet(this.timesheetInfoDetails?.is_need_create, this.timeSheet?.data?.actions_allow?.can_save);
              this.checkForAssignmentDurationChange();
              this.timesheet_logs = data?.data?.timesheet_logs;
              this.response_timesheet_logs = this.clonerService.deepClone(data?.data?.timesheet_logs);
              let allowCopy = false;
              let showCopyTimesheetButton = false;
              this.eventStream.emit(new EmitEvent(Events.UPDATE_CURRENT_TIMESHEET_DETAILS, { timesheet: this.timeSheet }));
              this.calendar?.forEach((c, calendarIndex) => {
                if (!c.disableDate) {
                  c.timesheet = c.timesheet || {};
                  c.timesheet.projects = [];
                  c.timesheet.total = 0;
                  c.timesheet.notes = undefined;
                }
                data?.data?.timesheet_logs?.data?.forEach(t => {
                  if (t.data?.length > 0) {
                    t.data.forEach((data: any) => {
                      if (this.formatDate(c?.date) === data?.date) {
                        if (data.hours) {
                          if (typeof data.hours === 'string') { //automatic
                            if (this.config.hours_input_type?.type === HoursInputType.HOUR) {
                              c.timesheet.total = this.hoursAddition((c.timesheet.total || 0) + "", (data.hours || 0) + "");
                              c.timesheet.total = this.updateHrsAndMin(c.timesheet.total);
                            } else {
                              c.timesheet.total = parseFloat(c.timesheet.total || 0) + parseFloat(data.hours || 0);
                            }
                            c.timesheet.projects?.push({ ...data, project_title: t?.project_title, value: data.hours, project_name: t.project_title ? t.project_title : null, hours: data.hours || HoursDefaultValues[this.config.hours_input_type?.format] });
                          } else if (typeof data?.hours === 'object') {//manual
                            data?.hours?.forEach(hours => {
                              if (this.config.hours_input_type?.type === HoursInputType.HOUR) {
                                c.timesheet.total = this.hoursAddition((c.timesheet.total || 0) + "", (hours?.value || 0) + "");
                                c.timesheet.total = this.updateHrsAndMin(c.timesheet.total);
                              } else {
                                c.timesheet.total = parseFloat(c.timesheet.total || 0) + parseFloat(hours?.value || 0);
                              }
                              c.timesheet.projects?.push({ ...data, project_title: t.project_title, ...hours, project_name: t.project_title ? (t.project_title + ' - ' + this.htsService.getHoursType(hours?.hours_type)) : this.htsService.getHoursType(hours?.hours_type), hours: hours?.value || HoursDefaultValues[this.config.hours_input_type?.format] });
                            });
                          }
                          if (this.config.hours_input_type?.type == HoursInputType.DECIMAL) {
                            c.timesheet.total = c.timesheet.total ? parseFloat(c.timesheet.total?.toFixed(2)) : c.timesheet.total;
                          }
                          c.timesheet.notes = data.notes;
                        }
                      }
                    })
                  }
                });
                if (!c.disableDate && this.config.hours_input_type?.type === HoursInputType.HOUR) {
                  c.timesheet.total = c?.timesheet?.total ? convertHoursToDecimal(c?.timesheet?.total) : c?.timesheet?.total;
                }
                if (c?.timesheet?.projects?.length > 0) {
                  allowCopy = true;
                  showCopyTimesheetButton = true;
                }
                if (calendarIndex != 0 && (calendarIndex % 7 === 0 || calendarIndex == this.calendar?.length - 1)) {
                  let startIndex = calendarIndex - 1;
                  if (calendarIndex == this.calendar?.length - 1) {
                    startIndex = calendarIndex;
                  }
                  allowCopyPasteCheck.push({
                    allowCopy: allowCopy,
                    allowPaste: this.calendar[calendarIndex - 7]?.isvalidTimesheetDate && this.calendar[startIndex]?.isvalidTimesheetDate
                  });
                  allowCopy = false;
                }
              });
              if (this.isAuthorizedToCreate) {
                this.eventStream.emit(new EmitEvent(Events.UPDATE_BILLING_AND_WORKING_DAYS_DETAILS, { showCopyTimesheetOption: showCopyTimesheetButton, allowCopyPasteCheck: allowCopyPasteCheck }));
              }
            }
            this.dataLoader = false;
            this.eventStream.emit(new EmitEvent(Events.UPDATE_CURRENT_TIMESHEET_DETAILS, { updateCalendar: true, calendar: this.calendar, days: this.days }));
            this.matchHoliday();
            this.getBilling();
            this.isTimesheetSubmitted(false);


          }, error: error => {
            this.dataLoader = false;
          }
        }
      );
    } else {
      this.dataLoader = false;
    }
  }

  hoursAddition(val1, val2) {
    val1 = (val1 + "").replace(":", ".");
    val2 = (val2 + "").replace(":", ".");

    const val1HrsMin = (val1 + "").split(".");
    const val2HrsMin = (val2 + "").split(".");
    if (val1HrsMin.length == 1) {
      val1HrsMin.push("0");
    }
    if (val2HrsMin.length == 1) {
      val2HrsMin.push("0");
    }
    let hrs = (+val1HrsMin[0]) + (+val2HrsMin[0]);

    const min = (+val1HrsMin[1]) + (+val2HrsMin[1]);

    const hrsFromMin = (((+min) / 60) + "").split('.')[0];
    let minFromMin = (+min) % 60 + "";
    if (parseInt(minFromMin) < 10) {
      minFromMin = "0" + minFromMin;
    }
    return ((+hrsFromMin) + hrs) + ":" + this.htsService.formatMinutes(minFromMin);

  }


  updateHrsAndMin(val) {
    const decimal = (val + "").split(".");

    if (decimal.length > 1) {
      const hrs = (((+decimal[1]) / 60) + "").split('.')[0];
      let min = (+decimal[1]) % 60 + "";
      val = ((+decimal[1]) + hrs) + ":" + this.htsService.formatMinutes(min);
    }
    return val;
  }

  //need a fix
  checkForAssignmentDurationChange() {
    if ((this.timesheetInfoDetails?.data?.new_start_date && this.timesheetInfoDetails?.data?.start_date != this.timesheetInfoDetails?.data?.new_start_date) || (this.timesheetInfoDetails?.data?.new_end_date && this.timesheetInfoDetails?.data?.end_date != this.timesheetInfoDetails?.data?.new_end_date)) {
      this.confirmService.confirm('', `Hey! Your Assignment has been updated. Do you want to proceed with new timesheet entry?`,
        'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            if (this.timesheetInfoDetails?.data?.new_start_date && this.timesheetInfoDetails?.data?.start_date != this.timesheetInfoDetails?.data?.new_start_date) {
              this.currentTimesheetData.start_date = this.timesheetInfoDetails?.data?.new_start_date;
            }
            if (this.timesheetInfoDetails?.data?.new_end_date && this.timesheetInfoDetails?.data?.end_date != this.timesheetInfoDetails?.data?.new_end_date) {
              this.currentTimesheetData.end_date = this.timesheetInfoDetails?.data?.new_end_date;
            }
            this.reloadCalendar();
            const startDate = getDateFromString(this.currentTimesheetData?.start_date);
            const endDate = getDateFromString(this.currentTimesheetData.end_date);
            let timesheet_logs = { data: [] };
            this.timesheetInfoDetails?.timesheet_logs?.data?.forEach(project => {
              let projectData = { ...project };
              projectData.data = [];
              project?.data?.forEach(sheet => {
                let timesheetDate = getDateFromString(sheet?.date);
                if (startDate <= timesheetDate && timesheetDate <= endDate) {
                  projectData.data.push(sheet);
                }
              });
              timesheet_logs.data.push(projectData);
            });
            if (this.timesheetStatus?.toLowerCase() === TimesheetStatus.REJECTED || this.timesheetStatus?.toLowerCase() === TimesheetStatus.WITHDRAWN) {
              this.timesheet_logs = timesheet_logs;
              this.saveTimesheet(0);
            }
          }
        })
        .catch(() => {
          this.alert.error("Some issue happening opening the confirm popup for duration change");
        });
    }
  }

  getProjectCodes() {
    this.timesheetService.emitLogs(undefined);
    this.subscriptions.push(this.timesheetService.getAccountCodes(this.currentTimesheetData?.assignment_id).subscribe(
      {
        next: (data: any) => {
          data?.data?.forEach(projectCode => {
            projectCode.code = projectCode.title;
          });
          this.projectCodes = data?.data;
          this.populateProjectCodes();
        }, error: err => {
          this.getErrorMessage(err);
        }
      }
    ));
  }

  private populateProjectCodes() {
    let count = 1;
    this.dropDownItems = [];
    const dropDownItems = [];
    const isOverTimeAllowed = this.ruleConfiguration?.hours_type_classification?.includes(TimesheetWorkType.OVERTIME);
    const isDoubleTimeAllowed = this.ruleConfiguration?.hours_type_classification?.includes(TimesheetWorkType.DOUBLETIME);
    for (let i = 0; i < this.projectCodes?.length; i++) {
      dropDownItems.push({
        display: count, project_title: this.projectCodes[i].code, project_name: this.config.hour_type_calculation === TimesheetWeeklyType.MANUAL ? this.projectCodes[i].code + " - " + TimesheetWorkTypeAbbreviation.REGULAR : this.projectCodes[i].code,
        isSelected: false, ...this.projectCodes[i], hours_type: TimesheetWorkType.REGULAR
      });
      count = count + 1;
      if (this.ruleConfiguration?.overtime?.overtime?.is_allow) {
        if (isOverTimeAllowed) {
          dropDownItems.push({ display: count, project_title: this.projectCodes[i].code, project_name: this.projectCodes[i].code + " - " + TimesheetWorkTypeAbbreviation.OVERTIME, isSelected: false, ...this.projectCodes[i], hours_type: TimesheetWorkType.OVERTIME });
          count = count + 1;
        }
        if (isDoubleTimeAllowed) {
          dropDownItems.push({ display: count, project_title: this.projectCodes[i].code, project_name: this.projectCodes[i].code + " - " + TimesheetWorkTypeAbbreviation.DOUBLETIME, isSelected: false, ...this.projectCodes[i], hours_type: TimesheetWorkType.DOUBLETIME });
          count = count + 1;
        }
      }
    }
    this.dropDownItems = dropDownItems;
  }

  populateManualNoProjectDropdown() {
    let count = 0;
    let dropDownItems = [];
    this.dropDownItems = undefined;
    this.ruleConfiguration?.hours_type_classification?.forEach(name => {
      dropDownItems.push({ display: count, project_title: null, project_name: this.htsService.getHoursType(name)?.toUpperCase(), hours_type: name, isSelected: false });
      count = count + 1;
    });
    this.dropDownItems = dropDownItems;
  }

  getLogData(start_date, end_date) {
    this.timesheetService.getLogData(this.currentTimesheetData?.user_id, this.currentTimesheetData?.assignment_id, start_date, end_date, 0).subscribe((data: any) => {
      if (data?.data) {
        const logData = data.data.logs;
        this.calendar.forEach(calendar => {
          if (calendar.disableDate) {
            const selectedDate = this.timesheetService.formatDateInRequiredFormat(calendar?.date, "yyyy-MM-dd");//this.datePipe.transform((calendar?.date), "yyyy-MM-dd");
            if (logData[selectedDate]) {
              calendar.timesheet = logData[selectedDate];
              calendar.timesheet.total = 0;
              calendar.timesheet.projects = [];
              calendar?.timesheet?.details?.forEach(data => {
                if (data.hours) {
                  if (data.hours != undefined && typeof data.hours === 'string') { //automatic
                    if (this.config.hours_input_type?.type === HoursInputType.HOUR) {
                      calendar.timesheet.total = this.hoursAddition((calendar.timesheet.total || 0) + "", (data.hours || 0) + "");
                      calendar.timesheet.total = this.updateHrsAndMin(calendar.timesheet.total);
                    } else {
                      calendar.timesheet.total = parseFloat(calendar.timesheet.total || 0) + parseFloat(data.hours || 0);
                    }
                    calendar.timesheet.projects?.push({ ...data, project_title: data?.project_title, value: data.hours, project_name: data.project_title ? data.project_title : null, hours: data.hours || HoursDefaultValues[this.config.hours_input_type?.format] });
                  } else if (typeof data?.hours === 'object') {//manual
                    data?.hours?.forEach(hours => {
                      if (this.config.hours_input_type?.type === HoursInputType.HOUR) {
                        calendar.timesheet.total = this.hoursAddition((calendar.timesheet.total || 0) + "", (hours?.value || 0) + "");
                        calendar.timesheet.total = this.updateHrsAndMin(calendar.timesheet.total);
                      } else {
                        calendar.timesheet.total = parseFloat(calendar.timesheet.total || 0) + parseFloat(hours?.value || 0);
                      }
                      calendar.timesheet.projects?.push({ ...data, project_title: data.project_title, ...hours, project_name: data.project_title ? (data.project_title + ' - ' + this.htsService.getHoursType(hours?.hours_type)) : this.htsService.getHoursType(hours?.hours_type), hours: hours?.value || HoursDefaultValues[this.config.hours_input_type?.format] });
                    });
                  }
                  if (this.config.hours_input_type?.type == HoursInputType.DECIMAL) {
                    calendar.timesheet.total = calendar.timesheet.total ? parseFloat(calendar.timesheet.total?.toFixed(2)) : calendar.timesheet.total;
                  }
                }
              });
              if (this.config.hours_input_type?.type === HoursInputType.HOUR) {
                calendar.timesheet.total = calendar?.timesheet?.total ? convertHoursToDecimal(calendar?.timesheet?.total) : calendar?.timesheet?.total;
              }
            }
          }
        });
        this.eventStream.emit(new EmitEvent(Events.UPDATE_CURRENT_TIMESHEET_DETAILS, { updateCalendar: true, calendar: this.calendar, days: this.days }));
      }
    });
  }



  matchHoliday() {
    this.calendar?.forEach(c => {
      this.holidayData?.forEach(t => {
        if (this.formatDate(c?.date) === t?.date) {
          c.holiday = t;
          if (!t?.is_time_entry_allowed) {
            c.disableDate = false;
          }
          // if (!this.config?.holiday?.is_allow_entry) {
          //   c.disableDate = true;
          // }
        }
      });
    });
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
        this.isTimesheetEnabled = Boolean(this.assignmentDetails?.finance?.is_timesheet_enabled);
        this.checkIfAssignmentClosed();
        this.assignmentWorker = { 'location_type': this.assignmentDetails?.assignment.work_location_type, 'worker_type': this.assignmentDetails?.worker.source_type };
        this.getHoliday(this.assignmentDetails?.assignment?.work_location?.id);
      });
  }

  getHoliday(id) {
    if (id) {
      // const year = '&year=' + new Date().getFullYear();
      this.currentTimesheetData.hierarchy_id = this.assignmentDetails?.assignment?.hierarchy?.id;
      this.timesheetService.getHolidayList(id,this.currentTimesheetData).subscribe(
        (data: any) => {
          data?.holiday_calendars?.forEach(h => {
            this.holidayData = this.holidayData?.concat(h?.holidays);
         });
          this.matchHoliday();
        });
    }
  }

  /* 
    getDay(day) {
  
      if (day === 'Saturdasy' || day === 'Sundays') {
        return false
      } else {
        return true;
      }
    }
   */
  editViewCheck(data) {
    if (data && (data?.notes || data?.projects?.length > 0)) {
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
  /* isNotSubmit(data) {
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
  } */

  // whether all the days are submitted or not
  isTimesheetSubmitted(showAlert) {
    this.isAllSubmitted = true;
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

  isShowTimesheetBilling() {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let isshow = this.route?.snapshot?.queryParams['isshow'];
    if (isshow) {
      return true
    } else {
      if (currentProgram?.config?.timesheet?.hide_billable_section) {
        return false;
      } else {
        return true;
      }
    }
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
