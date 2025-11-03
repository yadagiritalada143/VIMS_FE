import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Log } from 'src/app/library/logs/logs.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { getDateFromString } from 'src/app/wipro-timesheet/timesheet.utils';

@Component({
  selector: 'app-timesheet-actions-alerts',
  templateUrl: './timesheet-actions-alerts.component.html',
  styleUrls: ['./timesheet-actions-alerts.component.scss']
})
export class TimesheetActionsAlertsComponent implements OnInit {
  private subscriptions: Subscription[] = [];
  @Input() timeSheet;
  @Input() isAssignmentClosed;
  @Input() isTimesheetEnabled;
  logs: Log = undefined;
  constructor(private eventStream: EventStreamService, private datePipe: LocalDateFormatPipe) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.UPDATE_CURRENT_TIMESHEET_DETAILS).subscribe((data: any) => {
      if (data?.timesheet) {
        this.timeSheet = data?.timesheet;
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.SHOW_TIMESHEET_LOGS).subscribe((logs) => {
      this.logs = logs;
    }));
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
    const formatted_date = getDateFromString(date);
    return this.datePipe.transform(formatted_date);
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

}
