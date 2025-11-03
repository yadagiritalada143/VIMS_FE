import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';

@Component({
  selector: 'app-monthly-timesheet-header',
  templateUrl: './monthly-timesheet-header.component.html',
  styleUrls: ['./monthly-timesheet-header.component.scss']
})
export class MonthlyTimesheetHeaderComponent implements OnInit {
  _locationData: any = [];
  selectedLocation: string = undefined;
  timesheetData: any;
  _timesheetLeaveDetails: any = {};
  assignmentName: string = undefined;
  @Input() timesheetStatus;
  @Input() set selectedWorkLocation(data) {
    this.selectedLocation = data;
    this.changeLocation(this.selectedLocation);
  };
  get selectedWorkLocation() {
    return this.selectedLocation;
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
  constructor(
    private loader: LoaderService,
    private alert: AlertService,
    private timesheetService: TimesheetService,
    private router: Router,
    private route: ActivatedRoute,
    private storageService: StorageService,

  ) {
  }

  ngOnInit(): void {
    let timesheetData = this.storageService.get('timeSheetData');
    this.timesheetData = timesheetData;
    const timesheetId = this.route.snapshot.queryParams['timesheetId'];
    if (timesheetData?.assignment_id || timesheetId) {
      this.assignmentId = timesheetData.assignment_id;
      this.timesheetId = timesheetId || timesheetData.timesheet_uuid || timesheetData.id || timesheetData.timesheet_id;
      this.getBasicInfo(timesheetData);
      this.showAssignmentId();
    } else {
      this.router.navigate(['/timesheet/list/all']);
    }
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
      {
        next: (data: any) => {
          if (data) {
            this.basicDetails = data?.data;
            this.timesheetData.assignment_title = data?.data?.assignment_title;
            this.timesheetData.status = data?.data?.status;
            this.showAssignmentId();
            this.storageService.set('timeSheetData', this.timesheetData);
            this.basicDetails?.leave_details?.forEach(bl => {
              if (bl?.type === "earned_leave") {
                earnLeaves = bl.balance;
              }
            });
            this.earnLeaveCount.emit(earnLeaves);
            this.locationType.emit(this.basicDetails?.work_location_type);
          }
        }, error: (err) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      }
      ,
    );
  }

  changeLocation(e) {
    this.onChange.emit(e)
  }

  openAssignmentDetailPanel() {
    this.openAssignmentPanel.emit(true);
  }

}
