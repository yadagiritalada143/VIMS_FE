import { Component, Injector } from '@angular/core';
import { IWidgetDataItem, IWidgetUpdateData } from 'src/app/dashboard/dashboard.interfaces';
import { WidgetComponent } from '../widget.component';
import { WidgetsDataByRole } from '../widget.config';
import { ITableWidget } from '../widget.interfaces';
import { ITableWidgetPagination } from './table-widget.interfaces';
import { MonthList } from 'src/app/wipro-timesheet/timesheet.utils';
@Component({
  selector: 'app-table-widget',
  templateUrl: './table-widget.component.html',
  styleUrls: ['./table-widget.component.scss'],
})
export class TableWidgetComponent extends WidgetComponent {
  public widget: ITableWidget;
  public tableData: any[] = [];
  public isDataLoading: boolean = false;
  public currentPage: number = 1;
  public itemsPerPage: number = 5;
  public maxPages: number;
  public isNextPage: boolean;
  public isPrevPage: boolean;

  constructor(injector: Injector) {
    super(injector);
  }

  assignWidget() {
    const widget: IWidgetDataItem = this._widget;
    this.widget = { ...WidgetsDataByRole.table[this._widget?.name] };

    if (widget?.label) {
      this.widget.label = widget?.label;
    }

    if (this.widget.api) {
      this.widget.api = this.apiPreProcessing(this.widget.api);
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
    this.getData();
  }

  onReloadWidget() {
    this.isDataLoading = true;
    this.initWidget(true);
  }

  openEditWidgetModal() {
    this.emitOpenEditWidgetModal(this.widget);
  }

  getData() {
    if (this.widget.api) {
      this.widget.api = this.queryModifier(this.currentPage, this.itemsPerPage);
      this.dashboardService.get(this.widget.api).subscribe({
        next: (response: any) => {
          if (response?.data?.timesheet) {
            this.tableData = [...response.data.timesheet];

            if (response?.data?.pagination) {
              const pagination: ITableWidgetPagination = response.data.pagination;
              this.currentPage = pagination.current_page;
              this.itemsPerPage = parseInt(pagination.per_page);
              this.isNextPage = pagination.next_page_url ? true : false;
              this.isPrevPage = pagination.prev_page_url ? true : false;
              this.maxPages = Math.round(pagination.total_records / this.itemsPerPage);
            }
          } else {
            this.tableData = [];
          }
          this.isDataLoading = false;
        },
        error: error => {
          this.isDataLoading = false;
        },
    });
    } else {
      this.isDataLoading = false;
    }
  }

  getFormattedDate(start_date, end_date, periodicity) {
    const startdate = start_date?.split('-');
    let work_period = '';
    if (startdate?.length === 3) {
      const start_date = new Date(parseInt(startdate[0]), parseInt(startdate[1]) - 1, parseInt(startdate[2]), 0, 0, 0, 0); //new Date(duration?.start_date+ " 00:00:00"); fixed for safari
      if (periodicity?.toLowerCase() != 'monthly') {
        const enddate = end_date?.split('-');
        end_date = new Date(parseInt(enddate[0]), parseInt(enddate[1]) - 1, parseInt(enddate[2]), 0, 0, 0, 0); //new Date(duration?.start_date+ " 00:00:00"); fixed for safari
        work_period =
          parseInt(startdate[2]) +
          ' ' +
          MonthList[start_date.getMonth()] +
          ' ' +
          start_date.getFullYear() +
          ' - ' +
          parseInt(enddate[2]) +
          ' ' +
          MonthList[end_date.getMonth()] +
          ' ' +
          end_date.getFullYear();
      } else {
        work_period = MonthList[start_date.getMonth()] + ' ' + start_date.getFullYear();
      }
    }
    return work_period;
  }

  queryModifier(page: number, limit: number) {
    let queryParams = new Map();
    let requestWithoutQuery: string;
    let newQueryString: string;
    const apiArr = this.widget.api.split('?');

    if (apiArr?.length) {
      requestWithoutQuery = apiArr[0];
      const query = apiArr[1];
      const queryParamsArr = query.split('&');
      if (queryParamsArr?.length) {
        queryParamsArr.forEach((param: string) => {
          const keyValueArr = param.split('=');
          if (keyValueArr?.length) {
            queryParams.set(keyValueArr[0], keyValueArr[1]);
          }
        });
      }
    }

    queryParams.set('page', this.currentPage);
    queryParams.set('limit', this.itemsPerPage);
    const queryKeys = queryParams.keys();

    for (let i = 0; i < queryParams.size; ++i) {
      const key = queryKeys.next().value;
      if (newQueryString) {
        newQueryString += '&' + key + '=' + queryParams.get(key);
      } else {
        newQueryString = '?' + key + '=' + queryParams.get(key);
      }
    }
    return requestWithoutQuery + newQueryString;
  }

  onChangeItemsPerPage(value: number) {
    this.itemsPerPage = value;
    this.isDataLoading = true;
    this.getData();
  }

  onChangePage(value: number) {
    this.currentPage = value;
    this.isDataLoading = true;
    this.getData();
  }
}
