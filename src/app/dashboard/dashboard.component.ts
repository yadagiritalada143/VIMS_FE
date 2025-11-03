import { Component, OnDestroy, OnInit } from '@angular/core';
import { DashboardDataService } from './services/dashboard.data.service';
import { ConfirmationDialogService } from '../shared/components/confirmation-dialog/confirmation-dialog.service';
import { Events, EventStreamService } from '../core/services/event-stream.service';
import { ClonerService } from '../core/services/cloner.service';
import { Subscription } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { StorageKeys, StorageService } from '../core/services/storage.service';
import { AlertService } from '../core/components/alert/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Log } from '../library/logs/logs.model';
import { AuthorizationService } from '../core/services/authorize.service';
import { errorHandler } from '../shared/util/error-handler';
import { BuildVersionService } from '../build-version.service';
import { NavigationService } from '../core/services/navigation.service';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private subscrptions: Subscription[] = [];
  public calenderAccessToken = true;
  public isTimesheetEnabled: any;
  programDetails: any;
  logs:Log=undefined;
  discardedTimesheetData: any = {};
  isAssignmentUUID: any;
  constructor(
    private dashboardDataService: DashboardDataService,
    private confirmService: ConfirmationDialogService,
    private clonerService: ClonerService,
    private _eventStrem: EventStreamService,
    private dashboardService: DashboardService,
    private storageService: StorageService,
    private alertService: AlertService,
    private router: Router,
    private authorizationService: AuthorizationService,
    private buildVersionService:BuildVersionService,
    private route: ActivatedRoute,
    private navigationService: NavigationService,
  ) {}

  get widgetItemsToShow() {
    return this.dashboardDataService.widgetGridItems;
  }

  get hasNoProgram() {
    return this.dashboardDataService.hasNoProgram;
  }

  get assignment() {
    return this.dashboardDataService.assignment;
  }

  get assignmentId() {
    return this.dashboardDataService.assignmentId;
  }

  get widgetsData() {
    return this.dashboardDataService.widgetsData;
  }

  get workerId() {
    return this.dashboardDataService.workerId;
  }

  get programId() {
    const program = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    return program?.id;
  }

  get orgId() {
    return this.storageService.get(StorageKeys.ORGANIZATION_ID);
  }

  ngOnInit(): void {
    this.buildVersionService.checkAndUpdateClientVersion();
    this.navigationService.loadNavigationHistory();
    this.storageService.set(StorageKeys.CONTROL_PANEL_VISITED, true, true);
    if(this.storageService.get(StorageKeys.USER_TYPE) == "VENDOR"){
      this.dashboardService.get(`/configurator/programs/${this.programId}/vendors/${this.storageService.get('ORG_ID')}`)
      .subscribe((res:any) => {
        if(!res.program_vendor?.is_msa_signed){
          this.router.navigate([`/vendor-managment/setup`]);
        }
      })
    }
    this.subscrptions.push(this._eventStrem.on(Events.DASHBOARD_DELETE_WIDGET).subscribe(this.onDeleteWidget.bind(this)));
    this.subscrptions.push(this._eventStrem.on(Events.DASHBOARD_UNDO_WIDGET).subscribe(this.onUndoWidget.bind(this)));
    this.dashboardDataService.onDashboardInit();
    this._eventStrem.on(Events.SHOW_DASHBOARD_LOGS).subscribe((data:any)=>{
      this.logs=data;
      window.scrollTo(0,0);
    });
    // New Event added
    // this.isAssignmentUUID = this.route?.snapshot?.queryParams['assignment-uuid'];
    this.isAssignmentUUID = this.storageService.get('assignment_uuid');
    this._eventStrem.on(Events.SELECTED_ASSIGNMENT).subscribe((data:any)=>{
        this.isAssignmentUUID = data?.assignment_uuid || this.route?.snapshot?.queryParams['assignment-uuid'];
        this.setAssignmentUUID(this.isAssignmentUUID);
     });
    //  End
     this.programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);

    if (!this.isOutlookDisabled) {
      this.dashboardService.getClanederPlatformToken(this.programId).subscribe({next:
        (data:any) => {
          if (!data?.data[0]?.access_token) {
            this.calenderAccessToken = false;
          }
        }, error:
        err => {
          // this.alertService.error('Something went wrong with outlook service! Please try again later');
          // let logs=this.dashboardDataService.showError('Something went wrong with outlook service! Please try again later');
          // this.dashboardDataService.emitLogs(logs);
        },
    });
    }

  }

  setAssignmentUUID(id) {
    let assignmentID = this.isAssignmentUUID || id;
    this.getDiscardedTimesheet(assignmentID);
    this.dashboardDataService.assignmentId = assignmentID;
    if (this.dashboardDataService?.assignment && this.dashboardDataService?.assignment?.length > 0 ) {
      this.dashboardDataService?.assignment?.forEach(a => {
        if(a?.assignment_uuid == assignmentID){
        this.isTimesheetEnabled = a?.is_timesheet_enabled;
        }
      });
    }
  }

  get isOutlookDisabled() {
    return this.programDetails?.config?.submission?.is_outlook_disabled || !this.authorizationService.authorize("view_outlook_configuration");
  }

  onClickSetting(event) {
    if (event) {
      this.dashboardDataService.copiedWidgetGridItems = this.clonerService.deepClone(this.dashboardDataService.widgetGridItems);
      this.dashboardDataService.copiedWidgetsData = this.clonerService.deepClone(this.dashboardDataService.widgetsData);
    } else {
      this.dashboardDataService.widgetGridItems = this.clonerService.deepClone(this.dashboardDataService.copiedWidgetGridItems);
      this.dashboardDataService.copiedWidgetGridItems = [];
      this.dashboardDataService.widgetsData = this.clonerService.deepClone(this.dashboardDataService.copiedWidgetsData);
      this.dashboardDataService.copiedWidgetsData = {};
    }
  }

  onDelete() {
    this.confirmService
      .confirm('', `Clear the Dashboard?`, 'Yes', 'No')
      .then(confirmed => {
        if (confirmed) {
          this.dashboardDataService.widgetGridItems = [];
        }
      })
      .catch(() => {});
  }

  onSave() {
    if (!this.dashboardDataService.widgetGridItems.length) {
      this.confirmService
        .confirm('', `This Dashboard is empty! Are you sure you would not like to have any widgets?`, 'Yes', 'No')
        .then(confirmed => {
          if (confirmed) {
            this.dashboardDataService.deleteDashboard();
          } else {
            this.dashboardDataService.widgetGridItems = this.clonerService.deepClone(this.dashboardDataService.copiedWidgetGridItems);
          }
        })
        .catch(() => {});
    } else {
      this.dashboardDataService.saveDashboard();
    }
  }

  onReset() {
    this.confirmService
      .confirm('', `Are you sure you want to discard all your changes?`, 'Yes', 'No')
      .then(confirmed => {
        if (confirmed) {
          this.dashboardDataService.widgetGridItems = this.clonerService.deepClone(this.dashboardDataService.copiedWidgetGridItems);
        }
      })
      .catch(() => {});
  }

  onDeleteWidget(data) {
    if (data.value) {
      this.dashboardDataService.deleteWidget(data.value);
    }
  }

  onUndoWidget(data) {
    if (data.value) {
      this.dashboardDataService.undoWidget(data.value);
    }
  }

  getDiscardedTimesheet(assignmentID) {
    this.dashboardService.get(`/timesheet/programs/${this.programId}/assignment/${assignmentID}/timesheet/archived`).
    subscribe({next:
      (res:any) => {
        if(res?.data){
        this.discardedTimesheetData = res?.data;
        }
      },error:
      err => {
        this.alertService.error(errorHandler(err));
      },
  });
  }

  ngOnDestroy() {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
    this.dashboardDataService.emptyDashboardData();
  }

  outlookIntegration() {
    this.dashboardService.getClanederPlatformAuth(this.programId, []).subscribe({next:
      (data:any) => {
        console.log(data.data);
        if (data.data) {
          window.location.href = data.data.authUrl;
        }
      },error:
      err => {
        // this.alertService.error('Something went wrong with outlook auth! Please try again later');
        let logs=this.dashboardDataService.showError('Something went wrong with outlook auth! Please try again later');
        this.dashboardDataService.emitLogs(logs);
      },
  });
  }
}
