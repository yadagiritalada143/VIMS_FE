import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { HourlyTimeSheetService } from '../hourly-time-sheet.service';
import { addDays, convertHoursToDecimal, getFilteredObjectFromArray, getDateFromString, validateHoursFormat, grandTotal } from '../../../timesheet.utils';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { TimesheetConstants, TimesheetRoutes, TimesheetStatus, ActionAlertType, TimesheetType, TimesheetWeeklyType, HoursDefaultValues, UsersType, TimesheetGracePeriod, HoursInputType, AccountCodeStatus, DATE_FORMAT } from 'src/app/wipro-timesheet/timesheet.enums';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LOG_TYPE } from 'src/app/library/logs/logs.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { AccuracyConfigEnum } from 'src/app/shared/enums';

export enum SOW_TYPE {
  SOW = 'sow',
  PROJECT = 'project',
}
@Component({
  selector: 'app-hourly-timesheet-automatic-entry',
  templateUrl: './hourly-timesheet-automatic-entry.component.html',
  styleUrls: ['./hourly-timesheet-automatic-entry.component.scss']
})
export class HourlyTimesheetAutomaticEntryComponent implements OnInit, OnDestroy {
  dateFormatEnum = DATE_FORMAT; 
  selectedCustomData = {};
  customFields: any[] = [];
  isCustomFieldsValid: any;
  showErrorMessage = false;
  public redirectToSow = '';
  public redirectSow = false;
  public isSaveButtonClick = false;
  project_id: any;
  sow_id: any;
  public disableClearAllButton: boolean = false;
  public startDate: any = undefined;
  public endDate: any = undefined;
  projectCodes: any = undefined;
  public timeSheet: any = {};
  billableBreakup: boolean = false;
  redirectTimesheetFlyout: string;
  HoursInputType = HoursInputType;
  public projectRequiredCheck = false;
  private accountDetails = this.storageService.get('account');
  isAssignmentClosed: boolean = false;
  // disableSubmit: boolean = false;
  currentTimesheetData: any = undefined;
  public weekDates = [];
  public dropDownItems = [];
  public assignmentDetails: any;
  public isTimesheetEnabled: boolean;
  public isAuthorizedToCreate: boolean = false;
  public config: any;
  accuracyConfig = AccuracyConfigEnum;
  showCopyButton: boolean = false;
  disableButton: boolean = false;
  currentProgram: any;
  private subscriptions: Subscription[] = [];
  public formData: any = {
    rowData: [],
    totals: {
    },
    notes: {},
    automatic: {},
    grandTotal: '0.00',
  };
  billing_data: any = undefined;
  defaultValue: string = undefined;
  public stDisabled = 7;
  public otEnabled = 1;
  public errors = {};
  selectedIndex: number = null;
  projectNoteFirst: number = null;
  projectNoteSecond: number = null;
  timesheetStatuses = TimesheetStatus;
  ActionAlertType = ActionAlertType;
  dropdownToggle: boolean = false;
  showCopywidget: boolean = false;
  inDecimals = convertHoursToDecimal;
  getDateFromString = getDateFromString;
  holidayData: any = [];
  getProjects = new Subject<string>();
  projectLoading: any = {};
  sourcing_model: any;
  grandTotal = grandTotal;
  timesheetTab: string = "timesheet";
  public multiApprovals:any;
  approvalAction: any;
  isShowMultiApproval: any;
  timesheetData: any;
  timesheetId: string = undefined;
  constructor(private htsService: HourlyTimeSheetService, public storageService: StorageService,
    private alert: AlertService, private router: Router, private route: ActivatedRoute, 
    private confirmService: ConfirmationDialogService, private timesheetService: TimesheetService,
    private eventStream: EventStreamService, private localdatePipe: LocalDateFormatPipe) { 
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

    this.getProjects.pipe(
      debounceTime(500),
      distinctUntilChanged())
      .subscribe(value => {
        // this.projectLoading = true;
        this.getProject(value['term'])
      });
  }
  ngOnInit(): void {
    this.timesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (this.currentProgram) {
      // this.isShowMultiApproval = this.currentProgram.config?.multiple_approval_timesheet_expense;
      this.isShowMultiApproval = (this.currentProgram?.config?.modules_using_flow_system || [])?.indexOf('TIMESHEETS') !== -1;
    }
    this.initializeTimesheet();
    this.subscriptions.push(this.eventStream.on(Events.TIMESHEET_ACTION_FLYOUT).subscribe((data) => {
      if (data?.reloadCalendar) {
        this.initializeTimesheet();
      }
    }));
    const timesheetId = this.route.snapshot.queryParams['timesheetId'];
    this.multiApprovals = [
      { name: 'approval', api_url: `/approval/programs/${this.currentProgram?.id}/timesheets/${this.currentTimesheetData?.timesheet_uuid || timesheetId}/approval-instances`, status: 'pending', workflow_type: 'approval', isReplaceMember: true },
    ];
    this.eventStream.on(Events.APPROVAL_ACTION).subscribe((data) => {
      if(data){
        this.initializeTimesheet();
        this.multiApprovals = [
          { name: 'approval', api_url: `/approval/programs/${this.currentProgram?.id}/timesheets/${this.currentTimesheetData?.timesheet_uuid || timesheetId}/approval-instances`, status: 'pending', workflow_type: 'approval', isReplaceMember: true },
        ];
      }
    })
  }
  public navigateBackTo() {
    const userType = this.storageService.get(StorageKeys.USER_TYPE);
    if (this.redirectToSow === SOW_TYPE.PROJECT) {
      if (userType?.toLowerCase() === 'vendor') {
        this.router.navigate([`/vendor_sow/${this.sow_id}/vendor_milestones/${this.project_id}/invoicing`]);
      } else {
        this.router.navigate([`/sow/${this.sow_id}/milestones/${this.project_id}/invoicing`]);
      }
    } else if (this.redirectToSow === SOW_TYPE.SOW) {
      if (userType?.toLowerCase() === 'vendor') {
        this.router.navigate([`/vendor_sow/${this.sow_id}/invoicing`]);
      } else {
        this.router.navigate([`/sow/${this.sow_id}/invoicing`]);
      }
    } 
    else if(this.redirectTimesheetFlyout){
      let queryParams = { tab: 'budget', openTimesheetListTab: true , status : this.redirectTimesheetFlyout?.toLowerCase() === 'timesheet approved' ? 'approved' : 'all-pending'  };
      this.router.navigate([`assignment/details/${this.currentTimesheetData?.assignment_id}/final`], { queryParams});
    }
    else {
      this.router.navigate(['/timesheet/list/all']);
    }
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
    this.timesheetId = this.route?.snapshot?.queryParams['timesheetId'] || this.timesheetData?.timesheet_uuid || this.timesheetData?.timesheet_id;
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
            this.eventStream.emit(new EmitEvent(Events.UPDATE_CURRENT_TIMESHEET_DETAILS, undefined));
            this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
            if (!this.currentTimesheetData?.status) {
              this.disableClearAllButton = true;
            }
            this.getTimesheetConfigurations();
            this.isAuthorizedToCreateTimesheet(false, this.timeSheet?.data?.actions_allow?.can_save);
            window.scrollTo(0, 0);
          }
        }, error: (err) => {
          // this.alert.error(errorHandler(err));
          this.getErrorMessage(err);
          // this.alert.error("Something went wrong");
        }
      }
    );
  }

  copyTimesheetInSelectedWeek(event) {
    this.disableClearAllButton = false;
    if (event?.timesheet) {
      this.populateAccountCodes();
      this.populateTimesheet(event?.timesheet, undefined);
    }
    if (event?.showCopyButton) {
      this.showCopyButton = true;
    }
    this.showCopywidget = false;
  }

  validateTimesheetWeeklyType() {
    return this.config?.work_week?.period?.toLowerCase() === TimesheetType?.WEEKLY?.toLocaleLowerCase() && this.config?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType?.AUTOMATIC?.toLowerCase() && this.router?.url?.toLowerCase()?.includes(TimesheetRoutes?.AUTOMATIC_WEEKLY_ENTRY_ROUTE?.toLowerCase());
  }

  checkForStatus(status) {
    return (this.currentTimesheetData?.status?.toLowerCase() === status?.toLowerCase());
  }

  isAllowAction() {
    if (((this.checkForStatus(TimesheetStatus.WITHDRAWN) && this.timeSheet?.data?.is_need_create) || (this.checkForStatus(TimesheetStatus.REJECTED) && this.timeSheet?.data?.is_need_create) || this.checkForStatus(TimesheetStatus.DRAFT) || !this.currentTimesheetData?.status) && !this.isAssignmentClosed) {
      return true
    } else {
      return false
    }
  }

  /* inDecimals(value) {
    const val = value.split(':');
    if(val?.length > 1){
      const decimal = (val[1] / 60) * 100;
      return ('0'+val[0])?.slice(-2) + '.' + ('0'+(decimal + '')?.substring(0, 2))?.slice(-2);
    } else {
      return value;
    }
  } */

  getTimesheetConfigurations() {
    this.timesheetService.emitLogs(undefined);
    this.subscriptions.push(this.timesheetService.getConfigDetails(this.currentTimesheetData?.assignment_id).subscribe(
      {
        next: (data: any) => {
          this.config = data?.data;
          if (this.config?.project?.is_allow) {
            this.getAccountCodes();
          }
          if (this.validateTimesheetWeeklyType()) {
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
          } else {
            this.router.navigate(['/timesheet/list/all']);
          }
        }, error: err => {
          this.getErrorMessage(err);
        }
      }
    ));
  }

  initialTimesheetPopulation() {
    this.populateTimesheetConfiguration();
    this.processweekends();
    this.populateInitialConfig();
    this.addProjectRow(true);
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
              /* if(grace_type === TimesheetGracePeriod.HOUR?.toLowerCase()){
                let effective_date= temporary_access[0].effective_date?.replaceAll("-","/"); // to work in safari, replaced - with /
                effective_date+= this.assignmentDetails?.assignment?.timezone ? " "+this.assignmentDetails?.assignment?.timezone?.toUpperCase() :  "";
                allowedDateToEditAssignment= new Date(effective_date);
                const hours= allowedDateToEditAssignment?.getHours()+ parseInt(option[0].period || 0);
                if(new Date().getTime() > allowedDateToEditAssignment?.setHours(hours)) {
                  this.isAssignmentClosed = true;
                }
                return;     
               } else{
                const effective_date= temporary_access[0].effective_date?.split(" ");
                if(effective_date?.length > 0){
                  const grace_period= option[0].type?.toLowerCase() == TimesheetGracePeriod.MONTH.toLowerCase() ? (option[0].period * 30) : option[0].type?.toLowerCase() == TimesheetGracePeriod?.WEEK.toLowerCase() ? (option[0].period * 7) : option[0].period ;
                  allowedDateToEditAssignment= addDays(effective_date[0], parseInt(grace_period));
                }
               }  */
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
    this.subscriptions.push(this.timesheetService.getAssignmentDetails(this.currentTimesheetData?.assignment_id).subscribe(
      {
        next: (data: any) => {
          this.assignmentDetails = data?.data?.assignments;
          if(!this.currentTimesheetData?.status || this.currentTimesheetData?.status?.toLowerCase() === TimesheetStatus.MISSING){
          this.selectedCustomData = this.timesheetService?.populateCustomFields(this.assignmentDetails?.custom, this.selectedCustomData);
          }
          this.isTimesheetEnabled = Boolean(this.assignmentDetails?.finance?.is_timesheet_enabled);
          this.getHoliday(this.assignmentDetails?.assignment?.work_location?.id);
          this.checkIfAssignmentClosed();
        }, error: err => {
          this.getErrorMessage(err);
        }
      }
    ));
  }

  getHoliday(id) {
    this.currentTimesheetData.hierarchy_id = this.assignmentDetails?.assignment?.hierarchy?.id;
    this.timesheetService.getHolidayList(id, this.currentTimesheetData).subscribe(
      (data: any) => {
        data?.holiday_calendars?.forEach(h => {
           this.holidayData = this.holidayData?.concat(h?.holidays);
        });
        this.matchHoliday();
      });
  } 
  
  matchHoliday() {
    this.weekDates?.forEach(c => {
      this.holidayData?.forEach(t => {
        if (this.timesheetService.formatDateInRequiredFormat(c?.date, "yyyy-MM-dd") === t?.date) {
          c.holiday = t;
          if (!t?.is_time_entry_allowed) {
            c.active = false;
          }
          // if (!this.config?.holiday?.is_allow_entry) {
          //   c.active = false;
          // }
        }
      });
    });
  }

  isDataPresent(data) {
  return parseInt(data);
  }

  isAuthorizedToCreateTimesheet(is_need_create, can_save) {
    this.isAuthorizedToCreate = this.timesheetService.isAuthorizedToCreate(is_need_create, can_save);
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
   
            this.populateTimesheet(resp?.data?.timesheet_logs, resp?.data?.hour_data);
            this.timeSheet = resp;
            this.sourcing_model = resp?.data?.sourcing_model;
            this.billing_data = undefined;
            this.billing_data = { ...this.timeSheet?.data };
            this.eventStream.emit(new EmitEvent(Events.UPDATE_CURRENT_TIMESHEET_DETAILS, { timesheet: this.timeSheet }));
            this.isAuthorizedToCreateTimesheet(this.timeSheet?.data?.is_need_create, this.timeSheet?.data?.actions_allow?.can_save);
            this.checkForAssignmentDurationChange();
          }
        }, error: err => {
          this.getErrorMessage(err);
        }
      }
    ));
  }

  get hasOverrideApprovalPermission() {
    return this.timesheetService?.hasAdminOverridePermission();
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
            this.saveTimesheet({ submit: 0 }, true);
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

  populateTimesheet(resp, hour_data) {
    const projects = resp?.data || [];
    const defaultValue = this.config.hours_input_type?.type == HoursInputType.DECIMAL ? "0.00" : HoursDefaultValues[this.config.hours_input_type?.format];
    this.defaultValue = defaultValue;
    const formData = this.htsService.addProjectRows(projects, defaultValue, this.config?.hour_type_calculation?.toLowerCase(), this.dropDownItems) || {};
    formData.automatic = { total: {} };
    formData.notes['timesheet_level'] = resp?.notes;
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      for (let j = 0; j < project.data.length; j++) {
        const dateLevelTimes = project.data[j];
        const dayLevel = addDays(dateLevelTimes.date, 0);
        if (dateLevelTimes?.notes && formData) {
          formData.notes[this.htsService.getDayOfDate(dayLevel)] = dateLevelTimes?.notes;
        }
        project[this.weekDates[j].dayNumber] = project?.data[j]?.project_note
        this.htsService.populateAutomaticTimes(formData, project, dateLevelTimes);
      }
    }
    hour_data?.data?.forEach(dateLevelTime => {
      this.htsService.populateAutomaticHoursData(formData, dateLevelTime);
    });
    this.formData = formData; 
    this.dropDownItems = this.htsService.removeInactiveProjectCodes(this.dropDownItems, this.formData);
    this.isPresentCode();
    if (this.formData?.rowData?.length == 0) {
      this.addProjectRow(true);
      this.projectRequiredCheck = false;
    } else {
      this.calculateTotals();
      this.removeEmptyRows();
    }
  }

  isPresentCode() {
    this.formData?.rowData?.forEach((row: any) => {
      this.dropDownItems?.forEach((data: any) => {
        if ((row?.project_id == data?.id) && (row?.project_title == data?.title)) {
          data.isSelected = true;
        }
      });
    });
  }

  unsorted = (a, b) => {
    return a;
  }

  calculateTotals() {
    let defaultVal = '0.00';
    if (this.config.hours_input_type?.type !== HoursInputType.DECIMAL) {
      defaultVal = HoursDefaultValues[this.config.hours_input_type?.format];
    }
    // Project level calculate totals
    this.formData.grandTotal = defaultVal;
    for (let r = 0; r < this.formData.rowData.length; r++) {
      this.formData.rowData[r].total = 0.00;
      this.formData.rowData[r].totalDecimal = 0.00;
      for (let i = 0; i < this.weekDates.length; i++) {
        const day = this.weekDates[i].day;
        const row = this.formData.rowData[r];
        row[day] = this.htsService.addZeroes(row[day] + "", 2, this.config);
        row[day] = validateHoursFormat(row[day], this.config);
        if (this.config.hours_input_type?.type === HoursInputType.DECIMAL) {
          this.formData.rowData[r].total = this.htsService.addZeroes((+this.formData.rowData[r].total) + (+row[day]), 2, this.config);
          this.formData.rowData[r].totalDecimal = this.formData?.rowData[r]?.total; 
        } else {
          row[day] = this.htsService.addZeroes(row[day], 2, this.config);

          this.formData.rowData[r].total = this.hoursAddition(this.formData.rowData[r].total + "", row[day] + "");
          this.formData.rowData[r].total = this.updateHrsAndMin(this.formData.rowData[r].total);
          this.formData.rowData[r].totalDecimal += parseFloat(this.inDecimals(this.formData?.rowData[r][this.weekDates[i]?.day]));
        }
      }
      this.formData.rowData[r].totalDecimal = parseFloat(this.formData?.rowData[r]?.totalDecimal)?.toFixed(2);
      // this.formData.rowData[r].total = this.htsService.addZeroes(this.formData.rowData[r].total + "", 2);
      if (this.config.hours_input_type?.type === HoursInputType.DECIMAL) {
        this.formData.grandTotal = this.htsService.addZeroes((+this.formData.grandTotal) + (+this.formData.rowData[r].total) + '', 2, this.config);
      } else {
        this.formData.grandTotal = this.hoursAddition(this.formData.grandTotal + "", this.formData.rowData[r].total + "");
        this.formData.grandTotal = this.updateHrsAndMin(this.formData.grandTotal);
      }
    }

    this.formData.grandTotal = this.htsService.addZeroes(this.formData.grandTotal + "", 2, this.config);
    // Day level calculate totals.
    for (let i = 0; i < this.weekDates.length; i++) {
      const day = this.weekDates[i].day;
      this.formData.totals[day] = 0;
      for (let r = 0; r < this.formData.rowData.length; r++) {
        const row = this.formData.rowData[r];
        if (this.config.hours_input_type?.type === HoursInputType.DECIMAL) {
          this.formData.totals[day] = this.htsService.addZeroes((+this.formData.totals[day]) + (+row[day]), 2, this.config);
        } else {
          this.formData.totals[day] = this.hoursAddition(this.formData.totals[day] + "", row[day] + "");
          this.formData.totals[day] = this.updateHrsAndMin(this.formData.totals[day]);
          // row[day] = this.updateHrsAndMin(row[day]);
        }
      }
      this.formData.totals[day] = this.htsService.addZeroes(this.formData.totals[day] + "", 2, this.config);
    }
  }
  getAccountCodes() {
    this.timesheetService.emitLogs(undefined);
    this.subscriptions.push(this.timesheetService.getAccountCodes(this.currentTimesheetData?.assignment_id).subscribe(
      {
        next: (data: any) => {
          data?.data?.forEach(projectCode => {
            projectCode.originalCode = projectCode?.code;
            const show_account_code = this.timesheetService.showOnlyCodes();
            if (show_account_code) {
              projectCode.code = projectCode?.code || projectCode?.account_code || projectCode?.title;
            } else {
              if (projectCode?.code) {
                projectCode.code = projectCode?.title + '(' + projectCode?.code + ')';
              } else {
                projectCode.code = projectCode?.title;
              }
            }
          });
          this.projectCodes = data?.data;
          this.populateAccountCodes();
        }, error: err => {
          this.getErrorMessage(err);
        }
      }
    ));
  }

  deleteRow(index, row) {
    this.confirmService.confirm('', `This will delete project entry for current timesheet. Are you sure you want to continue?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          if (this.formData?.rowData?.length > 1) {
            if (row?.oldVal) {
              let option = this.getOption(row.oldVal);
              if (!option) { option = {}; }
              option.isSelected = false;
              delete row.oldVal;
            }
            this.formData.rowData.splice(index, 1);
            this.calculateTotals();
          }
        }
      })
      .catch(() => {
        this.alert.error("Unable to delete row. Please try again later.!");
      });

  }

  populateTimesheetConfiguration() {
    const timeSheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
    // this.startDate = Date.parse(timeSheetData.start_date);
    // this.endDate = Date.parse(timeSheetData.end_date);
    const startDate = timeSheetData?.start_date?.split("-") || this.currentTimesheetData?.start_date?.split("-");
    if (startDate?.length === 3)
      this.startDate = new Date(parseInt(startDate[0]), parseInt(startDate[1]) - 1, parseInt(startDate[2]), 0, 0, 0, 0).getTime();
    const endDate = timeSheetData.end_date?.split("-") || this.currentTimesheetData?.end_date?.split("-");
    if (endDate?.length === 3)
      this.endDate = new Date(parseInt(endDate[0]), parseInt(endDate[1]) - 1, parseInt(endDate[2]), 0, 0, 0, 0).getTime();
    this.formData['start_date'] = timeSheetData.start_date;
    this.formData['end_date'] = timeSheetData.end_date;
    this.formData['timesheet_logs'] = {
      data: []
    };

  }

  private processweekends() {
    if (this.config?.weekend?.option && this.config.weekend.option.length > 0) {
      for (let i = 0; i < this.config.weekend.option.length; i++) {
        this.config.weekend.option[i] = this.config.weekend.option[i].substr(0, 1).toUpperCase() + this.config.weekend.option[i].substr(1, 2);
      }
    } else {
      this.config.weekend.option = [];
    }
  }

  private populateInitialConfig() {
    this.weekDates = this.htsService.getDatesBetweenTwoDates(this.startDate, this.endDate, this.config.weekend.option, this.config?.work_week?.week_start_day, this.config);
  }

  private populateAccountCodes() {
    let count = 1;
    this.dropDownItems = [];
    const timesheetEndDate = getDateFromString(this.currentTimesheetData?.end_date);
    for (let i = 0; i < this.projectCodes?.length; i++) {
      if (!this.projectCodes[i]?.start_date || (getDateFromString(this.projectCodes[i]?.start_date) <= timesheetEndDate)) {
        this.dropDownItems.push({ display: count, ...this.projectCodes[i], projectCode: this.projectCodes[i].code, isSelected: false });
        count = count + 1;
      }
    }
    if (!this.currentTimesheetData?.timesheet_uuid) {
      setTimeout(() => {
        this.dropDownItems = this.htsService.removeInactiveProjectCodes(this.dropDownItems, this.formData); 
      }, 100);
    }
  }

  public updateDropDown(val) {
    if (val) {
      const proCode = getFilteredObjectFromArray(this.dropDownItems, 'projectCode', val?.projectCode);
      val.projectInfo = (proCode?.[0] || val.projectInfo);
      if (!val.oldVal) {
        val.oldVal = val.projectCode;
        let option = this.getOption(val.projectCode) || {};
        option.oldVal = val.projectCode;
        option.isSelected = true;
      } else {
        let option = this.getOption(val.oldVal);
        if (option) {
          option.isSelected = false;
        }
        val.oldVal = val.projectCode;
        let newOption = this.getOption(val.projectCode);
        newOption.isSelected = true;
      }
    }
    this.isValidTimesheet(false);
  }

  setProjectValues(col) {
    const option = this.getOption(col.projectCode);
    if (option) {
      col.project_title = option?.title;
      col.project_id = option?.id;
      col.project_type = option?.type;
      col.account_code = option?.account_code;
    }
    this.validateDuplicateProjectCodes();
    const accountConfig = this.storageService.get(StorageKeys.ACCOUNT_CODE_CONFIG);
    if (accountConfig && accountConfig?.is_validation_required) {
    setTimeout(() => {
      this.isAccountCodeValid();
    }, 100);
  }
  }

  isAccountCodeValid() {
    this.subscriptions.push(this.timesheetService?.projectCodeValidation(this.formData?.rowData,this.currentTimesheetData).subscribe(
     {next:(data: any) => {
        this.timesheetService.emitLogs(undefined);
        this.formData?.rowData?.forEach(rd => {
          data?.data?.codes?.forEach(c => {
            if(c?.account_code === (rd?.projectInfo?.account_code || rd?.projectInfo?.originalCode)){
            rd.projectInfo = c;
            }
            this.isValidTimesheet(true);
          });
        });
      },error: err=>{
        const logs= this.timesheetService.showErrorLog(err, (err?.status == 500 || err?.status == 400));
        this.timesheetService.emitLogs(logs);
      }}));
  }



  getOption(val) {
    return this.dropDownItems.find(item => { return (item?.title === val || item?.projectCode === val) });
  }

  addProjectRow(firstRow): void {
    let defaultVal = '0.00';
    if (this.config.hours_input_type?.type !== HoursInputType.DECIMAL) {
      defaultVal = HoursDefaultValues[this.config.hours_input_type?.format];
    }
    let row = { projectCode: '', total: defaultVal, totalDecimal:0.00 };
    for (let i = 0; i < this.weekDates.length; i++) {
      row[this.weekDates[i].day] = defaultVal;
      row[this.weekDates[i].dayNumber] = null;
      if (firstRow) {
        this.formData.totals[this.weekDates[i].day] = defaultVal;
      }
    }
    this.formData.rowData.push(row);
  }

  /* validateHoursFormat(value) {
    const REGEX= TimesheetConstants.REGEX[this.config.hours_input_type?.type?.toLowerCase()]?.[this.config.hours_input_type?.format?.toLowerCase()];
    if (this.config.hours_input_type?.type !== 'decimal') {
      value= formatHoursTime(value);
      var time = value.split(':');
      if (time.length === 1 && !isNaN(time[0])) {
        const defaultVal= HoursDefaultValues[this.config.hours_input_type?.format]?.substring(2) || ':00';
        return time + defaultVal;
      } else if (time.length === 2
        && parseInt(time[0]) >= 0
        && parseInt(time[0]) <= 23
        && parseInt(time[1]) >= 0
        && parseInt(time[1]) <= 59 && REGEX?.test(value)) {
        return value;
      }
      return HoursDefaultValues[this.config.hours_input_type?.format];
    } else {      

      var time = value.split('.');
      if (time.length === 1 && !isNaN(time[0])) {
        return time + '.00';
      } else
        if (time.length === 2
          && parseInt(time[0]) >= 0
          && parseInt(time[0]) <= 23
          && parseInt(time[1]) >= 0
          && parseInt(time[1]) <= 99 && REGEX?.test(value)) {
          return value;
        }
      return "0.00";
    }
  } */

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

  validationError($event, week) {
    this.disableClearAllButton = false;
    this.calculateTotals();
    // this.showErrorMessage = week; max_regular_daily_hours
    this.isValidTimesheet(false);
  }
  validateNotes() {
    this.errors = { 'week': [] };
    this.weekDates.forEach(day => {
      this.errors[day.day] = [];
    });
    let isValid = true;
    if(this.config?.notes?.is_allow && this.isSaveButtonClick){
    this.formData?.rowData?.forEach(row => {
      if(row && row?.projectCode && this.config?.notes?.option?.project_level?.is_mandatory && this.config?.notes?.option?.project_level?.is_allow){
      this.weekDates.forEach(day => {
        if ((row[day?.dayNumber] === null || row[day?.dayNumber] === '') && day?.active) {
          this.errors[day?.day]?.push('Please fill ' + row?.projectCode + ' notes');
        }
      });
    }
    });
  }
  return isValid;
  }

  saveHourlyTimeSheet(event) {
    this.isSaveButtonClick = true;
    if (this.isValidTimesheet(true) && !this.isErrorAvailable()) {
      this.disableButton = true;
      if (event?.submit > 0) {
        this.confirmService.confirm('', `Are you sure you want to submit the timesheet?`,
          'Yes', 'No')
          .then((confirmed) => {
            if (confirmed) {
              this.saveTimesheet(event);
            } else {
              this.disableButton = false;
              this.isSaveButtonClick = false;
            }
          })
          .catch(() => {
          });
      } else {
        this.saveTimesheet(event);
      }
    } else {
      let errorMessage, weeklyErrorMessage, isErrorUpdated = false;
      Object.keys(this.errors).forEach((key) => {
        if (this.errors[key].length && !isErrorUpdated && key != 'week') {
          isErrorUpdated = true;
          errorMessage = this.errors[key][0];
        }
        if (this.errors[key].length && key == 'week') {
          weeklyErrorMessage = this.errors[key][0];
        }
      })
      if (!isErrorUpdated && !!weeklyErrorMessage) {
        errorMessage = weeklyErrorMessage;
      }
      if (!errorMessage) errorMessage = "Please enter valid data";
      const logs = { type: LOG_TYPE.ERROR, heading: errorMessage, messages: [], autoClose: true, isShown: true };
      this.timesheetService.emitLogs(logs);
      // this.alert.error("Please enter valid data");
    }
  }

  async saveTimesheet(event, initializeTimesheet?: boolean) {
    if(this.isCustomFieldsValid || (this.customFields?.length > 0 && (!this.isAuthorizedToCreate || this.isAssignmentClosed || !this.isTimesheetEnabled))){
    this.formData.custom = this.customFields.filter(ele => ele?.values).map(element => {
      return {
        key: element?.slug,
        value: element?.values
      }
    });
 
    const accountConfig = this.storageService.get(StorageKeys.ACCOUNT_CODE_CONFIG);
    if (accountConfig && accountConfig?.is_validation_required) {
      const isValidProject = this.isProjectInfo(this.formData?.rowData);
      const data: any = await this.timesheetService?.isProjectCodeValid(isValidProject, this.currentTimesheetData?.user_id);
      if (!data?.result) {
        this.alert.error(data?.errors);
        this.isSaveButtonClick = false;
      } else {
        this.submit(event, initializeTimesheet);
      }
    } else {
      this.submit(event, initializeTimesheet);
    }
  } else {
    this.disableButton = false;
    this.isSaveButtonClick = false;
    this.alert.error('Please fill all the custom fields');
  }
  }

  submit(event, initializeTimesheet: Boolean) {
    this.subscriptions.push(this.htsService.saveHourlyTimeSheet(this.formData, event?.submit, this.config).subscribe(
      {
        next: (data: any) => {
          //check if its create or update call by response
          if (initializeTimesheet) {
            this.initialTimesheetPopulation()
          }
          if (data?.data?.timesheet_id) {
            this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
            this.currentTimesheetData.timesheet_uuid = data?.data?.timesheet_id;
            this.multiApprovals = [
              { name: 'approval', api_url: `/approval/programs/${this.currentProgram?.id}/timesheets/${this.currentTimesheetData?.timesheet_uuid}/approval-instances`, status: 'pending',workflow_type:'approval', isReplaceMember:true },
            ];
            this.currentTimesheetData.timesheet_id = data?.data.timesheet_id;
            if (!this.currentTimesheetData?.status || this.currentTimesheetData?.status?.toLowerCase() == TimesheetStatus.WITHDRAWN || this.currentTimesheetData?.status?.toLowerCase() == TimesheetStatus.REJECTED || this.currentTimesheetData?.status?.toLowerCase() == TimesheetStatus.MISSING) {
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
        this.isSaveButtonClick = false;
        }, error: err => {
          this.getErrorMessage(err);
          this.disableButton = false;
        this.isSaveButtonClick = false;
        }
      }
    ));
  }

  isProjectInfo(data) {
    data?.forEach(p => {
      if (!p?.projectInfo) {
        const matchProject = this.projectCodes?.find(pc => pc?.code === p?.projectCode || p?.project_id === pc?.id);
        p.projectInfo = matchProject;
      }
    });
    return data;
  }
  getProject(value) {
    this.timesheetService.emitLogs(undefined);
    const currentTimesheetData = this.storageService.get(TimesheetConstants?.TIMESHEET);
    const projectType = this.timesheetService?.getProjectType(this.config?.project?.option);
    this.subscriptions.push(this.timesheetService.getProject(currentTimesheetData?.assignment_id, projectType, value).subscribe(
      {
        next: (data: any) => {
          data?.data?.forEach(projectCode => {
            projectCode.originalCode = projectCode?.code;
            const show_account_code = this.timesheetService.showOnlyCodes();
            if (show_account_code) {
              projectCode.code = projectCode?.code || projectCode?.account_code || projectCode?.title;
            } else {
              if (projectCode?.code) {
                projectCode.code = projectCode?.title + '(' + projectCode?.code + ')';
              } else {
                projectCode.code = projectCode?.title;
              }
            }
          });
          this.projectCodes = data?.data;
          this.populateAccountCodes();
          this.projectLoading = {};
          this.isPresentCode();
        }, error: err => {
          this.getErrorMessage(err);
        }
      }
    ));
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


  isValidTimesheet(showAlerts): boolean {
    let isValid = true;
    this.errors = { 'week': [] };
    this.weekDates.forEach(day => {
      this.errors[day.day] = [];
    });

    //START: Row is added but project is not selected
    this.validateNotes();
    isValid = this.validateProjectCodes();
    if (isValid) {
      isValid = this.validateDuplicateProjectCodes();
    }
    //END: Row is added but project is not selected
    // TODO Mocked data for testing
    // this.config.is_enable_daily_hour_limit = true;

    if (this.config.is_enable_daily_hour_limit) {
      //START: Perday ST hour limit validation
      const isSTPerDayValid = this.validateSpecificTimeLimitPerDay("ST", this.config.allowed_maximum_daily_hours, null);
      isValid = isValid ? isSTPerDayValid : false;
      //END: Perday ST hour limit validation
    }

    //START: Perday ST hour limit validation
    const dayLimitValid = this.validateDayLimit("Per Day", this.config.is_enable_daily_hour_limit ? this.config.allowed_maximum_daily_hours : 24, null);
    //END: Perday ST hour limit validation
    isValid = isValid ? dayLimitValid : false;
    // TODO testig
    // this.config.is_enable_weekly_hour_limit = true;

    if (this.config.is_enable_weekly_hour_limit) {
      //START: Perweek ST hour limit validation
      const isDayValid = this.validateDayLimit("Per Week", null, this.config.allowed_maximum_weekly_hours);
      isValid = isValid ? isDayValid : false;
      const isSTValid = this.validateSpecificTimeLimitPerDay("ST", null, this.config.allowed_maximum_weekly_hours);
      isValid = isValid ? isSTValid : false;

      //END: Perday ST hour limit validation
    }

    // if (isValid && this.config.overtime.is_allow) {

    //   this.config.overtime.option.day_rules?.rules?.forEach(dayRule => {

    //     if (dayRule.key === 'overtime') {
    //       const days = this.getSpecificTimeLimitPerDay("OT", 0.1, null);
    //       if (days && days.length > 0) {
    //         const isSTMinValid = this.validateSpecificTimeMinLimitPerDay("ST", dayRule.min_hour, null, days);
    //         isValid = isValid ? isSTMinValid : false;

    //         const isSTValid = this.validateSpecificTimeLimitPerDay("OT", dayRule.max_hour - dayRule.min_hour, null);
    //         isValid = isValid ? isSTValid : false;
    //       }
    //     } else if (dayRule.key === 'doubletime') {
    //       const days = this.getSpecificTimeLimitPerDay("OT", 0.1, null);
    //       if (days && days.length > 0) {
    //         let minStHrs = 0;
    //         let minOTHrs = 0;
    //         this.config.overtime.option.day_rules?.rules?.forEach(dayR => {
    //           if (dayR.key === 'overtime') {
    //             minOTHrs = dayR.max_hour - dayR.min_hour;
    //             minStHrs = dayR.min_hour;
    //           }
    //         });
    //         const isSTMinValid = this.validateSpecificTimeMinLimitPerDay("ST", minStHrs, null, days);
    //         isValid = isValid ? isSTMinValid : false;

    //         const isOTValid = this.validateSpecificTimeMinLimitPerDay("OT", minOTHrs, null, days);
    //         isValid = isValid ? isOTValid : false;

    //         const isDTValid = this.validateSpecificTimeLimitPerDay("DT", 24 - dayRule.min_hour, null);
    //         isValid = isValid ? isDTValid : false;
    //       }
    //     }
    //   });

    //   if (isValid) {
    //     this.config.overtime.option.weekly_rules?.rules?.forEach(weekRule => {
    //       if (weekRule.key === 'overtime') {
    //         const isSTMinValid = this.validateSpecificTimeMinLimitPerDay("ST", null, weekRule.min_hour);
    //         isValid = isValid ? isSTMinValid : false;

    //         // const isSTValid = this.validateSpecificTimeLimitPerDay("OT", dayRule.max_hour - dayRule.min_hour, null);
    //         // isValid = isValid ? isSTValid : false;
    //       } else if (weekRule.key === 'doubletime') {

    //         let minStHrs = 0;
    //         let minOTHrs = 0;
    //         this.config.overtime.option.day_rules?.rules?.forEach(dayR => {
    //           if (dayR.key === 'overtime') {
    //             minOTHrs = dayR.max_hour - dayR.min_hour;
    //             minStHrs = dayR.min_hour;
    //           }
    //         });
    //         const isSTMinValid = this.validateSpecificTimeMinLimitPerDay("ST", null, minStHrs);
    //         isValid = isValid ? isSTMinValid : false;

    //         const isOTValid = this.validateSpecificTimeMinLimitPerDay("OT", null, minOTHrs);
    //         isValid = isValid ? isOTValid : false;
    //       }
    //     });
    //   }
    // }


    return isValid;
  }

  removeEmptyRows() {
    for (let j = 0; j < this.formData.rowData.length; j++) {
      const rowData = this.formData.rowData[j];
      this.updateDropDown(rowData);
    }
    const accountConfig = this.storageService.get(StorageKeys.ACCOUNT_CODE_CONFIG);
    if (accountConfig && accountConfig?.is_validation_required) {
    setTimeout(() => {
      this.isAccountCodeValid();
    }, 100);
  }
  }

  clearTimesheetLogs() {
    this.confirmService.confirm('', `This will clear the Timesheet logs for current week. Are you sure you want to continue?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.timesheetService.emitLogs(undefined);
          if (this.currentTimesheetData?.timesheet_uuid) {
            this.disableClearAllButton = true;
            this.subscriptions.push(this.timesheetService.clearTimesheetLogs(this.currentTimesheetData?.timesheet_uuid).subscribe(
              {
                next: (data: any) => {
                  this.alert.success(data?.message || "Timesheet deleted successfully.");
                  this.clearAll();
                  this.populateAccountCodes();
                }, error: err => {
                  this.getErrorMessage(err);
                  this.disableClearAllButton = false;
                }
              }
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

  get projectCodesValidation() {
    return this.formData.rowData?.filter(val => !!val?.projectCode);
  }
  projectNotesValidation(daynum) {
    return this.formData.rowData?.filter(val => !!val[daynum]);
  }

  clearAll() {
    this.errors = {};
    this.formData = {
      rowData: [],
      totals: {},
      automatic: {},
      notes: {},
      grandTotal: '0.00'
    };
    this.billing_data = undefined;
    this.initialTimesheetPopulation();
    this.disableClearAllButton = true;
    if (this.currentTimesheetData?.timesheet_uuid) {
      this.getTimesheetDetails();
    } else {
      this.populateAccountCodes();
    }
  }


  validateDayLimit(type, perdayMaxHrs, perWeekMaxHrs?) {
    let perWeekActualHrs = "0";
    this.weekDates.forEach(day => {
      let perdayActualHrs = "0";
      this.formData.rowData.forEach(project => {
        if (this.config.hours_input_type?.type === HoursInputType.DECIMAL) {
          perdayActualHrs = +(perdayActualHrs) + (+project[day.day]) + "";
        } else {
          perdayActualHrs = this.hoursAddition(perdayActualHrs + "", project[day.day] + "");
          perdayActualHrs = this.updateHrsAndMin(perdayActualHrs);
        }
      });
      perdayActualHrs = perdayActualHrs.replace(":", ".");
      perWeekActualHrs = this.hoursAddition(perWeekActualHrs + "", perdayActualHrs + "");
      perdayActualHrs = perdayActualHrs.replace(":", ".");
      if (perdayMaxHrs) {
        if (+perdayActualHrs > +perdayMaxHrs) {
          this.errors[day.day].push(type + " Hours Cannot Exceed More than " + perdayMaxHrs + " hours");
          return false;
        }
      }
    });
    if (perWeekMaxHrs) {
      perWeekActualHrs = perWeekActualHrs.replace(":", ".");
      if (+perWeekActualHrs > +perWeekMaxHrs) {
        this.errors['week'].push(type + " Hours Cannot Exceed More than " + perWeekMaxHrs + " hours");
        return false;
      }
    }
    return true;
  }

  validateSpecificTimeLimitPerDay(type, perdayMaxSTHrs, perWeekMaxSTHrs?) {
    let perWeekActualSTHrs = "0";
    let hours_type;
    switch (type) {
      case "ST": hours_type = 'Standard Time (ST)'; break;
      case "OT": hours_type = 'Over Time (OT)'; break;
      case "DT": hours_type = 'Double Time (DT)'; break;
    }
    this.weekDates.forEach(day => {
      let perdayActualSTHrs = "0";
      this.formData?.rowData?.forEach(project => {
        if (project?.projectCode?.endsWith(type)) {
          if (this.config.hours_input_type?.type === HoursInputType.DECIMAL) {
            perdayActualSTHrs = +perdayActualSTHrs + (+project[day.day]) + "";
          } else {
            perdayActualSTHrs = this.hoursAddition(perdayActualSTHrs + "", project[day.day] + "");
            perdayActualSTHrs = this.updateHrsAndMin(perdayActualSTHrs);
          }
        }
      });
      perdayActualSTHrs = perdayActualSTHrs.replace(":", ".");
      perWeekActualSTHrs = this.hoursAddition(perWeekActualSTHrs + "", perdayActualSTHrs + "");
      if (perdayMaxSTHrs) {
        if (+perdayActualSTHrs > +perdayMaxSTHrs) {
          this.errors[day.day] = hours_type + " Cannot Exceed More than " + perdayMaxSTHrs + " hours";
          return false;
        }
      }

    });

    if (perWeekMaxSTHrs) {
      if (+perWeekActualSTHrs > +perWeekMaxSTHrs) {
        this.errors['week'] = hours_type + " Cannot Exceed More than " + perWeekMaxSTHrs + " hours per week";
        return false;
      }
    }

    return true;
  }

  editNote(w) {
    this.selectedIndex = w;
  }
  projectNote(w, j) {
    this.projectNoteFirst = w;
    this.projectNoteSecond = j;
    let itemid = "projectNote" + w.toString() + j.toString();
    setTimeout(() => {
      document.getElementById(itemid).focus();
    }, 100);
  }

  validateProjectCodes() {
    //START: Row is added but project is not selected
    let isValid = true;
    this.formData.rowData.forEach(row => {
      if (!row.projectCode && this.config?.project?.is_allow) {
        isValid = false;
        this.projectRequiredCheck = true;
      } else {
        const isProjectInactive = row?.projectInfo?.status?.toLowerCase() === AccountCodeStatus.INACTIVE?.toLowerCase();
        if (isProjectInactive) {
          // Commented because V2M-7949
          // const inactivated_at = getDateFromString(row?.projectInfo?.inactivated_at) || null;
          this.weekDates.forEach(day => {
            // if (inactivated_at < day?.date && (row[day.day] != '0.00' && row[day.day] != HoursDefaultValues['hh:mm'] && row[day.day] != HoursDefaultValues['hh:mm:ss'])) {
              this.errors[day.day].push(row?.projectCode + ' is deactivated on ' + this.localdatePipe?.transform(row?.projectInfo?.inactivated_at,'','','',true));
            // }
          })
        }
      }
    });
    return isValid;
  }

  validateDuplicateProjectCodes() {
    //START: Row is added but project is not selected
    let isValid = true;
    this.formData.rowData.forEach((row: any, i) => {
      row.duplicate = false;
      this.formData?.rowData?.forEach((dup, j) => {
        if (i != j && (row?.project_id == dup?.project_id) && (row?.project_title == dup?.project_title)) {
          isValid = false;
          row.duplicate = true;
        }
      });

    });
    return isValid;
  }

  isVisibleOptions() {
    return (!this.currentTimesheetData?.status || this.currentTimesheetData?.status == this.timesheetStatuses?.DRAFT || this.currentTimesheetData?.status == this.timesheetStatuses?.MISSING) && this.isAuthorizedToCreate && !this.isAssignmentClosed && this.isTimesheetEnabled && this.timeSheet?.data?.actions_allow?.action_alert?.type?.toLowerCase() != ActionAlertType?.ARCHIVE?.toLowerCase();
  }

  Print() {
    window.print();
  }

  isShowTimesheetBilling() {
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

  showFullDayView(i) {
    console.log(i)
    const item =  document.querySelectorAll('.day-col-mobile');
    item.forEach(function(e) {
      e.classList.remove('active');
    });
    document.getElementById(i).classList.add('active');
  }

  hideDayCol(i) {
    document.getElementById(i).classList.remove('active');
  }

  setCustomFieldsFormValid(event) {
    this.isCustomFieldsValid = event;
  }
  customFieldUpdated(event) {
    this.customFields = event;    
  }
  getApprovalAction(event:any){
    if(event){
      this.approvalAction =  event;
    }
  }
  showTimesheetTab(value) {
    this.timesheetTab = value;
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
