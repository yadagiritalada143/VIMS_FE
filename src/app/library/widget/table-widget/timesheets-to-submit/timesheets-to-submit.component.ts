import { Component, Injector, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TimesheetConstants } from 'src/app/wipro-timesheet/timesheet.enums';
import { TableWidgetComponent } from '../table-widget.component';
import { TimesheetService } from '../../../../wipro-timesheet/timesheet.service';

@Component({
  selector: 'app-timesheets-to-submit',
  templateUrl: './timesheets-to-submit.component.html',
  styleUrls: ['./timesheets-to-submit.component.scss'],
})
export class TimesheetsToSubmitComponent extends TableWidgetComponent implements OnInit {
  @Input() isTimesheetEnable: boolean;
  constructor(injector: Injector, private router: Router, private timesheetService: TimesheetService) {
    super(injector);
  }

  ngOnInit() {
    this.isDataLoading = true;
    this.initWidget();
  }
  onOpenTimesheet(event: any) {
    if (this.editMode) {
      return;
    }
    const timesheetData = this.modifiedTimesheetData(event);
    this.storageService.set(TimesheetConstants.TIMESHEET, timesheetData, true);
    const route = this.timesheetService.getTimesheetNavigationRoute({}, timesheetData);
    this.router.navigate([route]);
  }

  modifiedTimesheetData(data) {
    if (data) {
      const modifiedData = { ...data, assignment_id: data.assignment_uuid };
      delete modifiedData.assignment_uuid;
      return modifiedData;
    } else {
      return data;
    }
  }
}
