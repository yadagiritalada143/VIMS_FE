import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { StorageService } from 'src/app/core/services/storage.service';
import { TimesheetConstants, TimesheetType } from 'src/app/wipro-timesheet/timesheet.enums';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
@Component({
  selector: 'app-copy-timesheet-widget',
  templateUrl: './copy-timesheet-widget.component.html',
  styleUrls: ['./copy-timesheet-widget.component.scss']
})
export class CopyTimesheetWidgetComponent implements OnInit, OnDestroy {
  timeType = 'Hours';
  selectedTimesheet: any = undefined;
  @Input() showCopywidget;
  @Input() set config(value) {
    if (value) {
      if (value?.timesheet_type ? (value?.timesheet_type[0] === TimesheetType?.DAY) : '') {
        this.timeType = 'Days';
      } else {
        this.timeType = 'Hours';
      }
      this.getPreviousTimesheets(value);
    }
  };
  @Output() copiedTimesheet = new EventEmitter();
  previousTimesheets: any = undefined;
  private subscriptions: Subscription[] = [];
  logs: Log = undefined;

  constructor(public storageService: StorageService,
    private timesheetService: TimesheetService) { }

  ngOnInit(): void { }

  getPreviousTimesheets(config) {
    const currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
    this.subscriptions.push(this.timesheetService.getTimesheetsForCopy(currentTimesheetData?.assignment_id, currentTimesheetData?.start_date,
      currentTimesheetData?.end_date).subscribe(
        {
          next: (res: any) => {
            if (res?.data) {
              res?.data?.forEach(timesheet => {
                timesheet.duration = this.timesheetService.getFormattedDate(timesheet?.start_date, timesheet?.end_date, config?.work_week?.period);
              });
              this.previousTimesheets = res.data;
              if (this.previousTimesheets?.length > 0) {
                this.copiedTimesheet.emit({ showCopyButton: true });
              }
            }
          }, error: err => {
            // this.alert.error(errorHandler(err));
          }
        }
      ));
  }

  copyTimesheetInSelectedWeek(isCopied) {
    this.logs = undefined;
    if (isCopied && !this.selectedTimesheet) {
      // this.alert.error("Please select timesheet to Copy.!");
      this.showError("Please select timesheet to Copy.!");
      return;
    }
    this.copiedTimesheet.emit({ timesheet: this.selectedTimesheet });
    this.selectedTimesheet = undefined;
  }

  showError(err) {
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

}
