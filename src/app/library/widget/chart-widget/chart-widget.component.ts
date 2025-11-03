import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { IWidgetDataItem, IWidgetUpdateData } from '../../../dashboard/dashboard.interfaces';
import { WidgetComponent } from '../widget.component';
import { IChartWidget } from '../widget.interfaces';
import { ChartTypes } from '../widget.types';
import {defaultChartTypes, WidgetsDataByRole} from '../widget.config';


@Component({
  selector: 'app-chart-widget',
  templateUrl: './chart-widget.component.html',
  styleUrls: ['./chart-widget.component.scss']
})

export class ChartWidgetComponent extends WidgetComponent implements OnInit {
  @ViewChild('fullChartContainer') fullChartContainer;
  public widget: IChartWidget;
  public chartData: any;
  chartTypes = defaultChartTypes;
  chartTypeSettingsOpened: boolean;
  headerHeight = 75;

  // hardcoded data for demo
  // will be remover after BE update
  chartStateData = [45, 34, 32, 34, 44, 34, 34, 23, 23, 34, 45, 34, 32, 34, 44, 34, 34, 23, 23, 34,
    45, 34, 32, 34, 44, 34, 34, 23, 23, 34, 45, 34, 32, 34, 44, 34, 34, 23, 23, 34,
    45, 34, 32, 34, 44, 34, 34, 23, 23, 34, 23];
      // hardcoded data for demo
  // will be remover after BE update
  chartDoubleData = [
    {
      headcount: 5,
      headcountAdditional: 3,
      name: 'Jan'
    },
    {
      headcount: 5,
      headcountAdditional: 3,
      name: 'Feb'
    },
    {
      headcount: 16,
      headcountAdditional: 5,
      name: 'Mar'
    },
    {
      headcount: 5,
      headcountAdditional: 4,
      name: 'Apr'
    },
    {
      headcount: 7,
      headcountAdditional: 13,
      name: 'May'
    },
    {
      headcount: 7,
      headcountAdditional: 13,
      name: 'Jun'
    },
    {
      headcount: 7,
      headcountAdditional: 13,
      name: 'Jul'
    },
    {
      headcount: 7,
      headcountAdditional: 13,
      name: 'Aug'
    }
  ];
  public readonly ChartTypes = ChartTypes;

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    this.initWidget();
  }

  get radiusSize() {
    return this.fullChartContainer.nativeElement.offsetWidth >= this.fullChartContainer.nativeElement.offsetHeight
      ? this.fullChartContainer.nativeElement.offsetHeight - this.headerHeight
      : this.fullChartContainer.nativeElement.offsetWidth - this.headerHeight;
  }

  get allowedChartTypes() {
    return this?.widget?.formData?.chartType?.values.split('|').map(item => defaultChartTypes.filter(type => type?.name === item)[0]);
  }

  assignWidget() {
    const widget: IWidgetDataItem = this._widget;
    this.widget = { ...WidgetsDataByRole.charts[this._widget?.name] };
    this.widget.api = this.apiPreProcessing(this.widget.api);
    if (widget?.label) {
      this.widget.label = widget?.label;
    }
    if (widget?.chartType) {
      this.widget.chartType = widget?.chartType;
    }
    if (widget?.dimension) {
      this.widget.dimension = widget?.dimension;
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
      if (data?.chartType !== undefined) {
        this.widget.chartType = data?.chartType;
      }
      if (data?.dimension !== undefined) {
        this.widget.dimension = data?.dimension;
      }
    }
  }

  openEditWidgetModal() {
    this.emitOpenEditWidgetModal(this.widget);
  }

  getData() {
    const payload = {
      widget_id: this.widget?.name,
      dimension: this.widget?.dimension
    };
    this.dashboardService.getChartData(this._programId, payload).subscribe({
      next: (response: any) => {
      if (response && response.data) {
        this.chartData = response.data;
      }
    },
    error: err => {
      this.onError(err);
  }});
  }

  toggleChartTypeSettingsOpened() {
    this.chartTypeSettingsOpened = !this.chartTypeSettingsOpened;
  }

  closeChartTypeSettingsOpened() {
    this.chartTypeSettingsOpened = false;
  }

  changeChartType(chartName) {
    this.closeChartTypeSettingsOpened();
    this.widget = {
      ...this.widget,
      chartType: chartName
    };
  }
}
