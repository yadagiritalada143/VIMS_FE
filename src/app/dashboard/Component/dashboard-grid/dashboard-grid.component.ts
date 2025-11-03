import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { IEditModeData, IWidgetData, IWidgetGridItem } from '../../dashboard.interfaces';
import { DashboardGridService } from './dashboard-grid.service';
 export enum grideName{
  QUICK_CREATE_TIMESHEET = 'quick_create_timesheet',
  QUICK_VIEW_ALL_TIMESHEETS = 'quick_view_all_timesheets'
 }
@Component({
  selector: 'app-dashboard-grid',
  templateUrl: './dashboard-grid.component.html',
  styleUrls: ['./dashboard-grid.component.scss']
})
export class DashboardGridComponent implements OnInit, OnDestroy {
  @Input() public assignmentID: string;
  @Input() public workerID: string;
  @Input() public orgID: string;
  public _isTimesheetEnable: boolean;
  public grideName = grideName;
  @Input() set isTimesheetEnable(data) {
    this._isTimesheetEnable = data;
  }
  @Input() set widgetGridItems(items: IWidgetGridItem[]) {
    this.gridStackService.widgetGridItems = items;
  }
  @Input() set widgetsData(data: IWidgetData) {
    this.gridStackService.widgetsData = data;
  }

  private _editMode: boolean = false;
  private _editSubscription: Subscription;

  constructor(
    private gridStackService: DashboardGridService,
    private eventStreamService: EventStreamService
  ) { }

  get editMode() {
    return this._editMode;
  }

  get gridOptions() {
    return this.gridStackService.gridOptions;
  }

  get widgetGridItems(): IWidgetGridItem[] {
    if(this.gridStackService.widgetGridItems)
      return Object.values(this.gridStackService.widgetGridItems).filter(item => !item['hidden']);
    else
     return [];
  }

  ngOnInit(): void {
    this._editSubscription = this.eventStreamService.on(Events.DASHBOARD_ON_EDIT).subscribe(this.onEditMode.bind(this));
    this.gridStackService.onGridEditMode(this._editMode);
  }

  showToolTip(data) {
    if((!this._isTimesheetEnable) && (data?.name === grideName?.QUICK_CREATE_TIMESHEET || data?.name === grideName?.QUICK_VIEW_ALL_TIMESHEETS)) {
      return 'User doesn’t have access to the Timesheet module.';
    }
  }

  onEditMode(data: IEditModeData) {
    if (!data.onlyForWidgets) {
      this._editMode = data.editMode;
      this.gridStackService.onGridEditMode(data.editMode);
    }
  }

  ngOnDestroy() {
    this._editSubscription?.unsubscribe();
  }
}
