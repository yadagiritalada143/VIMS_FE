import { Component, Injector, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TimesheetConstants } from 'src/app/wipro-timesheet/timesheet.enums';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { TableWidgetComponent } from '../table-widget.component';

@Component({
  selector: 'app-timesheets-rejected',
  templateUrl: './timesheets-rejected.component.html',
  styleUrls: ['./timesheets-rejected.component.scss']
})
export class TimesheetsRejectedComponent extends TableWidgetComponent implements OnInit {
  @Input() isTimesheetEnable: boolean;
  constructor(injector: Injector,
    private _router: Router,
    private _timesheetService: TimesheetService
  ) {
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
    this.storageService.set(TimesheetConstants.TIMESHEET, event, true);
    const route = this._timesheetService.getTimesheetNavigationRoute({}, event);
    this._router.navigate([route]);
  }
}
