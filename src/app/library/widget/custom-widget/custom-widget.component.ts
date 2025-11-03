import { Component, Injector, OnInit } from '@angular/core';
import { IWidgetDataItem, IWidgetUpdateData } from 'src/app/dashboard/dashboard.interfaces';
import { WidgetComponent } from '../widget.component';
import { ICustomWidget } from '../widget.interfaces';
import {WidgetsDataByRole} from '../widget.config';
import { addDays } from '../widget.utils';

@Component({
  selector: 'app-custom-widget',
  templateUrl: './custom-widget.component.html',
  styleUrls: ['./custom-widget.component.scss']
})

export class CustomWidgetComponent extends WidgetComponent implements OnInit {
  public widget: ICustomWidget;
  public user: any;
  public assignmentDetails: any;
  public dataLoader = true;

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    this.initWidget();
  }

  assignWidget() {
    const widget: IWidgetDataItem = this._widget;
    this.widget = { ...WidgetsDataByRole.custom[this._widget?.name] };
    this.widget.api = this.apiPreProcessing(this.widget.api);
    this.user = this._user;
    if (widget?.label) {
      this.widget.label = widget?.label;
    }
  }
  onUpdateWidget(data: IWidgetUpdateData) {
    if (data?.name === this.widget?.name) {
      if (data.deleted !== undefined) {
        this._deleted = data.deleted;
      }
      if (data?.label !== undefined) {
        this.widget.label = data?.label;
      }
    }
  }

  onReloadWidget() {
    this.dataLoader = true;
    this.initWidget(true);
  }

  openEditWidgetModal() {
    this.emitOpenEditWidgetModal(this.widget);
  }
  getData() {
    if (this.widget.api) {
      /** START: Temporary fix, until the Login and Dashboard Page is revamped */
      if (this.user?.is_candidate && this.widget?.api?.indexOf('assignment/undefined') > -1)
        window.location.reload();
      /** END: Temporary fix, until the Login and Dashboard Page is revamped */
      this.dashboardService.get(`${this.widget.api}`)
        .subscribe({
          next: (response: any) => {
          this.dataLoader = false;
          if (response && response.data) {
            this.assignmentDetails = response?.data?.assignments;
          }
        },
        error: err => {
          this.onError(err);
        }});
    }
  }

  showDate(date) {
    return addDays(date)
  }
}