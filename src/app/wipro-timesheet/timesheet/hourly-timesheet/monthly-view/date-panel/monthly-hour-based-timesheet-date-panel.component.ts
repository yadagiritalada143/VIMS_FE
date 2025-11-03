import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { HoursDefaultValues, HoursInputType, TimesheetConstants, TimesheetStatus, TimesheetWeeklyType } from 'src/app/wipro-timesheet/timesheet.enums';
import { Subscription } from 'rxjs';
import { validateHoursFormat } from 'src/app/wipro-timesheet/timesheet.utils';
import { ClonerService } from 'src/app/core/services/cloner.service';

@Component({
  selector: 'app-monthly-hour-based-timesheet-date-panel',
  templateUrl: './monthly-hour-based-timesheet-date-panel.component.html',
  styleUrls: ['./monthly-hour-based-timesheet-date-panel.component.scss']
})
export class MonthlyHourBasedTimesheetDatePanelComponent implements OnInit {

  private subscriptions: Subscription[] = [];
  @Input() selectedDate;
  public selectedTimeSheet: any = {};
  @Input() set selectedTimeSheetData(selectedTimeSheet) {
    this.selectedTimeSheet = this._cloneService.deepClone(selectedTimeSheet);
  };
  @Input() isAssignmentClosed;
  @Input() configuration;
  @Input() selectedWeekIndex;
  @Input() timesheetStatus;
  @Input() assignmentDetails;
  @Input() timeSheet;
  @Input() isTimesheetEnabled;
  projects: any = undefined;
  @Input() set projectDropdown(projects) {
    this.projects = projects;
  }
  public timesheetData: any = {};
  @Input() set infoDetails(timesheetInfo) {
    this.timesheetData = timesheetInfo;
    this.isAuthorizedToCreateTimesheet(timesheetInfo?.is_need_create, timesheetInfo?.actions_allow?.can_save);
  };
  @Input() currentIndex;
  @Input() calendar;
  @Input() working_days;
  showTime: string = '';
  editTimesheetModal;
  disabledField: any;
  document: any;
  @Input() disableButton;
  disableSave: boolean = false;
  @Output() save = new EventEmitter();
  @Output() onClose = new EventEmitter();
  timeDifference: any = undefined;
  timeFormatRegex: string = "^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$";
  currentTimesheetData;
  isAuthorizedToCreate: boolean = false;
  confirmBox = false;
  dayValue: number = (1000 * 60 * 60 * 24);
  timesheetStatuses = TimesheetStatus;
  timesheetWeeklyType = TimesheetWeeklyType;
  placeholder: string = undefined;

  constructor(
    private timesheetService: TimesheetService,
    private alert: AlertService,
    private datePipe: DatePipe,
    private storageService: StorageService, private _cloneService: ClonerService,
    private eventStream: EventStreamService
  ) { }


  ngOnInit(): void {
    this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
    this.editViewCheck(this.selectedTimeSheet?.timesheet);
    this.placeholder = this.configuration?.hours_input_type?.type == HoursInputType.DECIMAL ? "0.00" : HoursDefaultValues[this.configuration?.hours_input_type?.format];
    this.subscriptions.push(this.eventStream.on(Events.UPDATE_CURRENT_TIMESHEET_DETAILS).subscribe((data: any) => {
      this.currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
      if (data?.updateTimesheet && data?.timesheet != undefined) {
        this.timesheetData = data.timesheet;
      }
      if (data?.updateCalendar && data?.calendar != undefined) {
        this.calendar = data.calendar;
      }
      this.timesheetStatus = this.currentTimesheetData?.status?.toLowerCase();
    }));
    // this.isAuthorizedToCreateTimesheet(false);
  }

  isAuthorizedToCreateTimesheet(is_need_create, can_save) {
    this.isAuthorizedToCreate = this.timesheetService.isAuthorizedToCreate(is_need_create, can_save);
  }

  validateHoursFormat(project) {
    if (!project.hours) {
      this.disableSave = true;
      return;
    }
    this.disableSave = false;
    const hours = validateHoursFormat(project.hours, this.configuration);
    const convertedHours = parseInt(hours?.replace(':', '')?.replace(".", ""));
    const convertedPHours = parseInt(project.hours?.replace(':', '')?.replace(".", ""));
    if (convertedHours != convertedPHours && (hours == HoursDefaultValues[this.configuration?.hours_input_type?.format] || hours == 0.00)) {
      this.disableSave = true;
      this.alert.warn(`Please provide hours in ${HoursDefaultValues[this.configuration?.hours_input_type?.format]} format`);
      project.hours = undefined;
    } else {
      project.hours = hours;
    }
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

  projectChanged(project) {
    const data = this.projects.filter(pr => { return pr?.project_name === project?.project_name });
    project.project_title = data[0]?.project_title;
    project.hours_type = data[0]?.hours_type;
    project.project_type = data[0]?.parent_type;
  }

  editViewCheck(data) {
    if (data && (data?.projects?.length > 0 || data?.notes)) {
      this.editTimesheetModal = true;
    } else {
      this.editTimesheetModal = false;
      if (!data?.projects || data?.projects?.length == 0) {
        if (!this.selectedTimeSheet?.timesheet) {
          this.selectedTimeSheet.timesheet = {};
        }
        if (this.projects?.length == 1) {
          this.selectedTimeSheet.timesheet.projects = [{ breaks: [], date: this.timesheetService.formatDateInRequiredFormat(this.selectedDate, "yyyy-MM-dd"), notes: null, ...this.projects[0] }]
        } else {
          this.selectedTimeSheet.timesheet.projects = [{ breaks: [], date: this.timesheetService.formatDateInRequiredFormat(this.selectedDate, "yyyy-MM-dd"), notes: null }]
        }
      }
      document.body.classList.add("no-pointer");
    }
  }

  addProject() {
    this.selectedTimeSheet?.timesheet?.projects?.push({ breaks: [], date: this.timesheetService.formatDateInRequiredFormat(this.selectedDate, "yyyy-MM-dd"), notes: null });
  }

  removeProject(index) {
    this.selectedTimeSheet?.timesheet?.projects?.splice(index, 1);
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


  editTimesheet(timesheet) {
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
    let isValid = true;
    let total = 0;
    let uniqueValues: any = [];
    this.selectedTimeSheet?.timesheet?.projects?.forEach(project => {
      uniqueValues.push(project?.project_name);
      if (!project?.project_name || !project?.hours) {
        this.alert.error("Please provide valid Data ");
        isValid = false;
        return;
      }
      else {
        total += parseFloat(project?.hours);
        if (total > 24) {
          isValid = false;
          this.alert.error("Total hours cannot be more than 24 hours");
          return;
        }
      }
    });
    uniqueValues = new Set(uniqueValues);
    if (isValid && uniqueValues.size < this.selectedTimeSheet?.timesheet?.projects.length) {
      this.alert.error("Please provide valid Data ");
      isValid = false;
      return;
    }
    if (isValid) {
      this.save.emit(this.selectedTimeSheet);
      document.body.classList.remove("no-pointer");
    }


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

  deleteTimesheet() {
    this.confirmBox = true;
  }

  confirmDelete() {
    this.selectedTimeSheet.delete = true;
    this.save.emit(this.selectedTimeSheet);
    document.body.classList.remove("no-pointer");
  }

  cancelDelete() {
    this.confirmBox = false;
  }

  calculateHours(data) {
    if (data?.check_in && data?.check_out) {
      // const check_in_date= this.timesheetForm.get('check_in_date')?.value || this.selectedDate;
      // const check_out_date= this.timesheetForm.get('check_out_date')?.value || this.selectedDate;
      return null;
      //return this.calculateDifference(data?.check_in, data?.check_out, this.format(check_in_date), this.format(check_out_date));
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

  cancelDayTimesheet(emitData) {
    this.selectedTimeSheet = {};
    this.onClose.emit(emitData);
    document.body.classList.remove("no-pointer");
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
                      this.selectedTimeSheet.timesheet.document = data?.data;
                      this.alert.success('File uploaded successfully');
                    }
                  }
                  , error: (err) => {
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


  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
