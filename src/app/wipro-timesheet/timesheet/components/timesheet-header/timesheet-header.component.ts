import { Component, Input, OnInit, Output, EventEmitter, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { LoaderService } from '../../../../core/components/loader/loader.service';
import { AlertService } from '../../../../core/components/alert/alert.service';
import { errorHandler } from '../../../../shared/util/error-handler';
import { TimesheetService } from '../../../timesheet.service';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageKeys, StorageService } from '../../../../core/services/storage.service';
import { TimesheetConstants } from 'src/app/wipro-timesheet/timesheet.enums';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-timesheet-header',
  templateUrl: './timesheet-header.component.html',
  styleUrls: ['./timesheet-header.component.scss']
})
export class HourlyTimesheetHeaderComponent implements OnInit {
  private subscriptions: Subscription[] = [];
  _locationData: any = [];
  selectedLocation: string = undefined;
  timesheetData: any = {};
  _timesheetLeaveDetails: any = {};
  assignmentName: string = undefined;
  accountDetails: any = undefined;
  currentProgram: any = undefined;
  @Input() sourcing_model: any;
  @Input() timesheetStatus;
  @Input() set selectedWorkLocation(data) {
    this.selectedLocation = data;
    this.changeLocation(this.selectedLocation);
  };
  get selectedWorkLocation() {
    return this.selectedLocation;
  }
  @Input() set currentTimesheetData(data) {
    if (this.timesheetId && (data?.timesheet_uuid !== this.timesheetId)) {
        this.timesheetId = data?.timesheet_uuid;
        this.basicDetails.manager = data?.timesheet_manager
    }
  }

  @Input() set timesheetLeaveDetails(data) {
    this._timesheetLeaveDetails = data;
  };
  get timesheetLeaveDetails() {
    return this._timesheetLeaveDetails;
  }
  @Input() set locationData(locations) {
    this._locationData = locations;
    // if (this.locationData?.length > 0) {
    //   this.selectedLocation = this.locationData[0].label;
    //   this.changeLocation(this.selectedLocation);
    // }
  }
  get locationData() {
    return this._locationData;
  }

  @Output() onChange = new EventEmitter();
  @Output() earnLeaveCount = new EventEmitter();
  @Output() locationType = new EventEmitter();
  @Output() openAssignmentPanel = new EventEmitter();

  assignmentId;
  timesheetId;
  basicDetails;
  showHideManagerList : boolean = false;
  @ViewChild('managerCount', { read: ElementRef, static: false }) managerCount: ElementRef;
  @ViewChild('managerNameDropdown', { read: ElementRef, static: false }) managerNameDropdown: ElementRef;
  constructor(
    private eventStream: EventStreamService,
    private loader: LoaderService,
    private alert: AlertService,
    private timesheetService: TimesheetService,
    private router: Router,
    private route: ActivatedRoute,
    private storageService: StorageService,
    private render: Renderer2

  ) {
    this.render.listen('window', 'click', (e: Event) => {
      if (
        (this.managerCount && this.managerCount.nativeElement.contains(e.target) && !this.showHideManagerList) ||
        (this.managerNameDropdown && this.managerNameDropdown.nativeElement.contains(e.target)) 
      ){
        const buttonPosition = this.managerCount.nativeElement.getBoundingClientRect();
        this.showHideManagerList = true;
        this.managerNameDropdown.nativeElement.style.top = `${buttonPosition.top + buttonPosition.height}px`;
        this.managerNameDropdown.nativeElement.style.left = `${buttonPosition.left}px`;
        this.render.addClass(document.body, 'manager-dropdown-overflow');
      }
      
      else {
        this.showHideManagerList = false;
        this.render.removeClass(document.body, 'manager-dropdown-overflow');
      }
    });
  }

  ngOnInit(): void {
    let timesheetData = this.storageService.get(TimesheetConstants.TIMESHEET) || {};
    this.timesheetData = timesheetData;
    const timesheetId = this.route.snapshot.queryParams['timesheetId'];
    if (timesheetData?.assignment_id || timesheetId) {
      this.assignmentId = timesheetData?.assignment_id;
      this.timesheetId = timesheetId || timesheetData?.timesheet_uuid || timesheetData?.id || timesheetData?.timesheet_id;
      this.getBasicInfo(timesheetData);
      this.showAssignmentId();
    } else {
      this.router.navigate(['/timesheet/list/all']);
    }
    this.subscriptions?.push(this.eventStream.on(Events.UPDATE_CURRENT_TIMESHEET_DETAILS)?.subscribe((data) => {
      if (!this.basicDetails?.manager && data?.timesheet?.data?.timesheet_manager) {
        this.basicDetails.manager = data?.timesheet?.data?.timesheet_manager;
      }
    }));
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.accountDetails = this.storageService.get(StorageKeys.CURRENT_ACCOUNT);
  }

  checkForStatus(status) {
    return (this.timesheetStatus?.toLowerCase() === status);
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

  getBasicInfo(timesheetData) {
    let earnLeaves = 0;
    const start_date = timesheetData?.start_date;
    const end_date = timesheetData?.end_date;
    this.timesheetService.getBasicInfo(this.assignmentId, this.timesheetId, start_date, end_date).subscribe(
      {next :  (data: any) => {
        if (data) {
          this.basicDetails = data?.data;
          this.timesheetData.assignment_title = data?.data?.assignment_title;
          this.timesheetData.status = data?.data?.status;
          this.showAssignmentId();
          this.storageService.set(TimesheetConstants.TIMESHEET, this.timesheetData);
          this.eventStream.emit(new EmitEvent(Events.UPDATE_CURRENT_TIMESHEET_DETAILS, undefined));
          this.basicDetails?.leave_details?.forEach(bl => {
            if (bl?.type === "earned_leave") {
              earnLeaves = bl.balance;
            }
          });
          this.earnLeaveCount.emit(earnLeaves);
          this.locationType.emit(this.basicDetails?.work_location_type);
        }
      },error :  (err) => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
      }}
     );
  }

  capitalizeWords(string) {
    return string?.replace(/(?:^|\s)\S/g, function (a) { return a?.toUpperCase(); });
  };

  changeLocation(e) {
    this.onChange.emit(e)
  }

  openAssignmentDetailPanel() {
    this.openAssignmentPanel.emit(true);
  }

  get profileImageHide() {
    return (this.currentProgram?.config?.is_candidate_image_hidden && this.accountDetails?.role?.name?.toLowerCase().includes(TimesheetConstants.HIRING_MANAGER_ROLE));
  }
}
