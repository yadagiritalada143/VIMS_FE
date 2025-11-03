import { Component, Injector, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { DashboardPermissionService } from 'src/app/dashboard/services/dashboard.permission.service';
import { StorageKeys, StorageService } from '../../core/services/storage.service';
import { IEditModeData, IWidgetDataItem, IWidgetUpdateData } from '../../dashboard/dashboard.interfaces';
import { DashboardService } from '../../dashboard/dashboard.service';
import { AlertService } from '../../core/components/alert/alert.service';
import { IWidget } from './widget.interfaces';


@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss']
})

export class WidgetComponent implements OnDestroy {
  protected _widget: IWidgetDataItem;
  protected _user: any;
  protected _editMode: boolean;
  protected _programId: string;
  protected _workerID: string;
  protected _assignmentID: string;
  protected _orgID: string;
  protected _deleted = false;
  protected _subscriptions: Subscription [] = [];

  protected dashboardService: DashboardService;
  protected storageService: StorageService;
  protected alertService: AlertService;
  protected eventStreamService: EventStreamService;
  protected permissionService: DashboardPermissionService;

  constructor(private injector: Injector) {
    this.dashboardService = this.injector.get(DashboardService);
    this.storageService = this.injector.get(StorageService);
    this.alertService = this.injector.get(AlertService);
    this.eventStreamService = this.injector.get(EventStreamService);
    this.permissionService = this.injector.get(DashboardPermissionService);
  }

  @Input() set assignmentID(id: string) {
    if(id){
    let onReload = false;
    if (this._assignmentID) {
      onReload = true;
    }
    this._assignmentID = id;

    if (onReload) {
      this.onReloadWidget();
    }
  }
  }

  @Input() set workerID(id: string) {
    this._workerID = id;
  }

  @Input() set orgID(id: string) {
    this._orgID = id;
  }

  @Input() set widgetData(widget: IWidgetDataItem) {
    this._widget = widget;
  }

  get editMode() {
    return this._editMode;
  }

  get deleted() {
    return this._deleted;
  }

  set deleted(value: boolean) {
    this._deleted = value;
  }

  initWidget(isReload?: boolean) {
    if (!isReload) {
      this._subscriptions.push(this.eventStreamService.on(Events.DASHBOARD_ON_EDIT).subscribe(this.onEditMode.bind(this)));
      this._subscriptions.push(this.eventStreamService.on(Events.DASHBOARD_UPDATE_WIDGET).subscribe(this.onUpdateWidget.bind(this)));
    }
    this._user = this.storageService.get('user');

    this.getEditModeState();
    this.getProgram();
    this.assignWidget();
    this.getData();

  }

  getProgram() {
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (programDetails) {
      this._programId = programDetails['id'];
    }
  }

  apiPreProcessing(api: string) {
    if (api){
      api = api.replace('<PROGRAM_ID>', this._programId);
      api = api.replace('<ASSIGNMENT_ID>', this._assignmentID);
      api = api.replace('<WORKER_ID>', this._workerID);
      api = api.replace('<ORG_ID>', this._orgID);
      return api;
    }
  }

  getData() { }
  assignWidget() { }
  onUpdateWidget(data: IWidgetUpdateData) { }
  openEditWidgetModal() { }
  onReloadWidget() { }

  onError(error: Error) {
    this.alertService.error(error.message);
  }

  onEditMode(data: IEditModeData) {
    this._editMode = data.editMode;
  }

  getEditModeState() {
    this.eventStreamService.emit(new EmitEvent(Events.DASHBOARD_GET_EDIT));
  }

  deleteWidget() {
    this.eventStreamService.emit(new EmitEvent(Events.DASHBOARD_DELETE_WIDGET, { value: this._widget?.name, }));
    this._deleted = true;
  }

  undoWidget() {
    this.eventStreamService.emit(new EmitEvent(Events.DASHBOARD_UNDO_WIDGET, { value: this._widget?.name, }));
    this._deleted = false;
  }

  emitOpenEditWidgetModal(widget: IWidget) {
    this.eventStreamService.emit(new EmitEvent(Events.DASHBOARD_OPEN_WIDGET_EDIT, widget));
  }

  ngOnDestroy() {
    this._subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
