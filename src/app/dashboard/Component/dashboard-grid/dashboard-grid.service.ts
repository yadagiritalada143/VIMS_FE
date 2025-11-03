import { Injectable } from '@angular/core';
import { GridsterConfig, GridsterItem } from 'angular-gridster2';
import { IWidgetData } from '../../dashboard.interfaces';
import { GridConfig } from './dashboard-grid.config';
import { Widgets } from '../../../library/widget/widget.types';

@Injectable({
  providedIn: 'root'
})
export class DashboardGridService {

  public widgetGridItems: GridsterItem [];
  public widgetsData: IWidgetData;

  private _gridOptions: GridsterConfig = GridConfig;

  constructor() {}

  get gridOptions() {
    return this._gridOptions;
  }

  public onGridEditMode(edit: boolean) {
    this._gridOptions.draggable.enabled = edit;
    this._gridOptions.resizable.enabled = edit;
    this.onGridOptionsChanged();
  }

  public onGridOptionsChanged() {
    this._gridOptions.api?.optionsChanged();
  }

  public onGridResize() {
    this._gridOptions.api?.resize();
  }

  public getWidgetDataItem(widget: Widgets) {
    return this.widgetsData[widget];
  }
}
