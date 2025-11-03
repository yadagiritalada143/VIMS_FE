import { Component, Injector, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { IWidgetDataItem, IWidgetUpdateData } from '../../../dashboard/dashboard.interfaces';
import { WidgetComponent } from '../widget.component';
import { IListWidget } from '../widget.interfaces';
import { WidgetsDataByRole } from '../widget.config';


@Component({
  selector: 'app-list-widget',
  templateUrl: './list-widget.component.html',
  styleUrls: ['./list-widget.component.scss']
})

export class ListWidgetComponent extends WidgetComponent implements OnInit {
  public widget: IListWidget;
  public pending: any[] = [];

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    this.initWidget();
  }

  assignWidget() {
    const widget: IWidgetDataItem = this._widget;
    this.widget = { ...WidgetsDataByRole.lists[this._widget?.name] };
    if (widget?.label) {
      this.widget.label = widget?.label;
    }

    if (widget?.options) {
      this.widget.options = widget?.options;
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
      if (data?.options !== undefined) {
        this.widget.options = data?.options;
      }
    }
    this.getData();
  }

  openEditWidgetModal() {
    this.emitOpenEditWidgetModal(this.widget);
  }

  getData() {
    let counterApi: any;
    let permitedApis: any = {};
    this.pending = [];

    if (this.widget.apis && this.widget.apis[0]) {
      const totalWidgetApis = this.widget.apis[0];
      if (this.widget?.options !== undefined) {
        // set only permited apis
        for (let i = 0; i < this.widget?.options.length; ++i) {
          const option = this.widget?.options[i];
          permitedApis[option] = totalWidgetApis[option];
        }
      } else {
        // if options undefined, then set all apis
        permitedApis = { ...totalWidgetApis };
      }

      for (const item in permitedApis) {
        permitedApis[item].api = this.apiPreProcessing(permitedApis[item].api);
        this.pending.push(permitedApis[item]);
      }

      this.pending.forEach(p => {
        if (p?.api) {
          if(p?.is_target=='sow'){
            counterApi = this.dashboardService.getSOW(`${p?.api}`);
          }else{
            counterApi = this.dashboardService.get(`${p?.api}`);
          }
          forkJoin(counterApi).subscribe(res => {
            const response = JSON.parse(JSON.stringify(res));
            if (response[0]?.onboarding_task_stats) {
              p.count = response[0]?.onboarding_task_stats?.pending;
            }
            if (response[0]?.onboarding_background_checklist_stats) {
              p.count = response[0]?.onboarding_background_checklist_stats?.pending;
            }
            if (response[0]?.data) {
              p.count = response[0]?.data[0]?.count;
            }
            if (response[0]?.data?.count) {
              p.count = response[0]?.data?.count;
            }
            if (response[0]?.total_records) {
              p.count = response[0]?.total_records;
            }
            if (response[0]?.count) {
              p.count = response[0]?.count;
            }
            p.loaded = true;
          }, err => {
            // this._alert.error(errorHandler(err));
          });
        }
      });
    }
  }
}
