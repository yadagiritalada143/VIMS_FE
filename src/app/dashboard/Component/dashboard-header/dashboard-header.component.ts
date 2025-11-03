import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { StorageService } from 'src/app/core/services/storage.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DashboardWidgetSettingsComponent } from '../dashboard-widget-settings/dashboard-widget-settings.component';
import { Subscription } from 'rxjs';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { DashboardDataService } from '../../services/dashboard.data.service';


@Component({
  selector: 'app-dashboard-header',
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss']
})

export class DashboardHeaderComponent implements OnInit, OnDestroy {
  public editMode: boolean;
  public optionsOpened: boolean = false;
  public widget: boolean = false;
  public assignment_uuid: any;
  public _assignment: any;
  public user: any;

  @Input() set assignment(data) {
    this._assignment = data;
    this.assignment?.forEach(a => {
      if (a?.code) {
        a.bindLabel = `${a?.assignment_title?.title} (${a?.code})`;
      } else {
        a.bindLabel = a?.assignment_title?.title;
      }

    });
    if (this.assignment) {
      this.assignment_uuid = this.assignment[0]?.assignment_uuid;
      this.changeAssignment(this.assignment_uuid);
    }
  }
  @Output() onDelete = new EventEmitter();
  @Output() onSave = new EventEmitter();
  @Output() onReset = new EventEmitter();
  @Output() onAdd = new EventEmitter();
  @Output() onClickSetting = new EventEmitter();
  @Output() assignmentUUID = new EventEmitter();

  get assignment() {
    return this._assignment;
  }
  private subscrptions: Subscription[] = [];
  constructor(
    private _storageService: StorageService,
    private _modalService: NgbModal,
    private _eventStreamService: EventStreamService,
    private _dashboardDataService: DashboardDataService
  ) { }

  ngOnInit(): void {
    this.user = this._storageService.get('user');
    this.subscrptions.push(this._eventStreamService.on(Events.DASHBOARD_GET_EDIT).subscribe(this.sendEditModeState.bind(this)));
    this.subscrptions.push(this._eventStreamService.on(Events.DASHBOARD_OPEN_WIDGET_EDIT).subscribe(this.updateWidget.bind(this)));
  }

  changeAssignment(assignmentID) {
    this.assignmentUUID.emit(assignmentID);
  }

  showMenus() {
    this.onClickSetting.emit(true);
    this.editMode = true;
    this._eventStreamService.emit(new EmitEvent(Events.DASHBOARD_ON_EDIT, { editMode: true }));
  }

  toggleOptions() {
    this.optionsOpened = !this.optionsOpened;
  }

  hideMenus() {
    this.onClickSetting.emit(false);
    this._eventStreamService.emit(new EmitEvent(Events.DASHBOARD_ON_EDIT, { editMode: false }));
    this.optionsOpened = false;
    this.editMode = false;
  }

  showWidget() {
    this.widget = true;
  }

  editWidget() {
    const modalRef = this._modalService.open(DashboardWidgetSettingsComponent, {
      size: 'lg',
      centered: true,
      ariaLabelledBy: 'widget-modal',
      backdrop: true,
      keyboard: true
    });
    modalRef.componentInstance.dashboardDataService = this._dashboardDataService;
  }

  updateWidget(widget) {
    const modalRef = this._modalService.open(DashboardWidgetSettingsComponent, {
      size: 'lg',
      centered: true,
      ariaLabelledBy: 'widget-modal',
      backdrop: true,
      keyboard: true
    });
    modalRef.componentInstance.dashboardDataService = this._dashboardDataService;
    modalRef.componentInstance.updatedWidget = widget;
    modalRef.componentInstance.widgetModalUpdateView = true;
  }

  close(event) {
    this.widget = event;
    this.editMode = false;
  }

  sendEditModeState() {
    this._eventStreamService.emit(new EmitEvent(Events.DASHBOARD_ON_EDIT, { onlyForWidgets: true, editMode: this.editMode }));
  }

  deleteDashboard() {
    this.onDelete.emit();
    this.optionsOpened = false;
    // this.editMode = false;
  }

  saveDashboard() {
    this._eventStreamService.emit(new EmitEvent(Events.DASHBOARD_ON_EDIT, { editMode: false }));
    this.editMode = false;
    this.onSave.emit(true);
  }

  resetDashboard() {
    this.onReset.emit(true);
    this.optionsOpened = false;
    this.editMode = false;
    this._eventStreamService.emit(new EmitEvent(Events.DASHBOARD_ON_EDIT, { editMode: false }));
  }

  ngOnDestroy() {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
}
