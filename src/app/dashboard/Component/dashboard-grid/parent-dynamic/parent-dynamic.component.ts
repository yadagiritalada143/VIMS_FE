import { Component, Input, OnInit } from '@angular/core';
import { Widgets } from '../../../../library/widget/widget.types';
import { widgetTypes } from '../../../dashboard.config';
import { IWidgetDataItem, IWidgetGridItem } from '../../../dashboard.interfaces';
import { DashboardGridService } from '../dashboard-grid.service';

@Component({
  selector: 'app-parent-dynamic',
  template:
    `<ng-template
      [ngComponentOutlet]="component"
      [ndcDynamicInputs]="inputs"
      [ndcDynamicOutputs]="outputs">
    </ng-template>`
})
export class ParentDynamicComponent implements OnInit {
  public component: any;
  public inputs: any = {};
  public outputs = {};

  private _widget: IWidgetDataItem;
  private _assignmentID: string;
  private _isTimesheetEnable: boolean;
  private _workerID: string;
  constructor(private dashboardGridService: DashboardGridService) {}


  @Input() set editMode(value: boolean) {
    this.inputs = {
      ...this.inputs,
      editMode: value
    };
  }

  @Input() set assignmentID(value: any) {
    this._assignmentID = value;
    this.inputs = {
      ...this.inputs,
      assignmentID: value
    };
  }

  @Input() set isTimesheetEnable(value: any) {
    this._isTimesheetEnable = value;
    this.inputs = {
      ...this.inputs,
      isTimesheetEnable: value
    };
  }

  @Input() set workerID(value: any) {
    this._workerID = value;
    this.inputs = {
      ...this.inputs,
      workerID: value
    };
  }

  @Input() set orgID(value: any) {
    this.inputs = {
      ...this.inputs,
      orgID: value
    };
  }

  @Input() set widget(item: IWidgetGridItem) {
    this._widget = this.dashboardGridService.getWidgetDataItem(item.name);
    this.inputs = {
      ...this.inputs,
      widget: this._widget,
      deleted: item?.deleted
    };
    this.setComponentByType(item.name);
  }

  ngOnInit(): void {
    this.inputs = {
      ...this.inputs,
      widgetData: this._widget,
      assignmentID: this._assignmentID,
      workerID: this._workerID,
      isTimesheetEnable: this._isTimesheetEnable
    };
  }

  setComponentByType(type: Widgets) {
    this.component = widgetTypes[type];
  }
}
