import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { TimesheetConstants, TimesheetStatus } from '../../../timesheet.enums';
import { TimesheetService } from '../../../timesheet.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-timesheet-action-flyout',
  templateUrl: './timesheet-action-flyout.component.html',
  styleUrls: ['./timesheet-action-flyout.component.scss']
})
export class TimesheetActionFlyoutComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  panelVisibility: string = "hidden";
  public actionForm: UntypedFormGroup;
  reasonList: any = undefined;
  isSubmitted: boolean = false;
  reason_parent: string = undefined;
  action: string = undefined;
  actionName: string = undefined;
  logs: Log = undefined;

  constructor(private storageService: StorageService, private fb: UntypedFormBuilder, private timesheetService: TimesheetService,
    private resonCodesService: ReasonCodesService, private router: Router,
    private alert: AlertService, private eventStream: EventStreamService) { }

  ngOnInit(): void {
    this.actionForm = this.fb.group({
      reason: [null, Validators.required],
      note: [null]
    });
    // this.getReasonCodeActions();
    this.subscriptions.push(this.eventStream.on(Events.TIMESHEET_ACTION_FLYOUT).subscribe((data) => {
      this.logs = undefined;
      if (data?.showPanel) {
        this.action = data.action;
        if (data.action) {
          this.actionName = data.action.replace("_TIMESHEET", "");
          this.getReasonCodeActions(data.action);
        }
        this.panelVisibility = 'visible';
      } else {
        this.panelVisibility = 'hidden';
      }
    }));
  }

  getReasonCodeActions(action) {
    this.subscriptions.push(
      this.resonCodesService.getResoncodesFor(action).subscribe(data => {
        this.reasonList = data.reason_codes;
        this.reason_parent = data.resonCodeID;
      })
    )
  }

  submitAction() {
    this.logs = undefined;
    if (this.actionForm?.valid) {
      const payload = this.actionForm?.value;
      payload.reason_parent = this.reason_parent;
      this.isSubmitted = true;

      const timesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
      const timesheetId = timesheetData?.timesheet_uuid || timesheetData?.timesheet_id;
      if (this.action === "MODIFY_TIMESHEET") {
        this.modifyTimesheet(timesheetId, payload);
      } else if (this.action === "DELETE_TIMESHEET") {
        this.deleteTimesheet(timesheetId, payload);
      }
      else if (this.action === "WITHDRAW_TIMESHEET") {
        this.withdrawTimesheet(timesheetId, payload);
      }
    } else {
      // this.alert.error('Please fill the required details.');
      this.logs = {
        type: LOG_TYPE.ERROR, heading: 'Please fill the required details.', messages: [], autoClose: true, isShown: true
      };
    }
  }

  withdrawTimesheet(timesheetId, payload) {
    this.logs = undefined;
    this.subscriptions.push(this.timesheetService.withdrawTimesheet(timesheetId, payload).subscribe(
      {
        next: data => {
          if (data) {
            this.isSubmitted = false;
            this.alert.success('Timesheet withdrawn successfully');
            this.router.navigate([`/timesheet/list/${TimesheetStatus.WITHDRAWN}`]);

          }
        }, error: (err) => {
          this.isSubmitted = false;
          //this.getErrorAlert(err);
          this.showError(err);
        }
      }
    ));

  }

  deleteTimesheet(timesheetId, payload) {
    this.logs = undefined;
    this.subscriptions.push(this.timesheetService.deleteTimesheet(timesheetId, payload).subscribe(
      {
        next: data => {
          if (data) {
            this.isSubmitted = false;
            this.alert.success('Timesheet deleted successfully');
            this.router.navigate([`/timesheet/list/all`]);

          }
        }, error: (err) => {
          this.isSubmitted = false;
          // this.getErrorAlert(err);
          this.showError(err);
        }
      }
    ));
  }

  modifyTimesheet(timesheetId, payload) {
    this.logs = undefined;
    this.subscriptions.push(this.timesheetService.modifyHourlyTimesheet(timesheetId, payload).subscribe(
      {
        next: (data: any) => {
          if (data?.data) {
            this.isSubmitted = false;
            this.alert.success(`Timesheet modified successfully.`);
            let timesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
            timesheetData.status = TimesheetStatus.DRAFT;
            timesheetData.timesheet_uuid = data?.data.timesheet_id;
            timesheetData.timesheet_id = data?.data.timesheet_id;
            this.storageService.set(TimesheetConstants.TIMESHEET, timesheetData, true);
            this.panelVisibility = 'hidden';
            this.eventStream.emit(new EmitEvent(Events.TIMESHEET_ACTION_FLYOUT, { showPanel: false, reloadCalendar: true, action: 'MODIFY_TIMESHEET' }));
          }
        }, error: (err) => {
          //this.getErrorAlert(err);
          this.showError(err);
          this.isSubmitted = false;
        }
      }
    ));


  }

  getErrorAlert(err) {
    if (err?.error?.error?.errors?.length > 0 && err?.error?.error?.errors[0]?.message) {
      this.alert.error(err?.error?.error?.errors[0]?.message);
    } else if (err?.error?.error?.non_field_errors?.length) {
      this.alert.error(err?.error?.error?.non_field_errors[0]);
    } else if (err?.error?.error) {
      this.alert.error(err?.error?.error);
    } else {
      this.alert.error(errorHandler(err));
    }
  }
  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }
  sidebarClose() {
    this.panelVisibility = "hidden";
    this.actionForm.reset();
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

}
