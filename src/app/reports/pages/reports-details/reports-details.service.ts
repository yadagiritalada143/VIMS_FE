import { Injectable } from '@angular/core';
import { ReportService } from '../../services/report.service';
import { ReportsDetailsColumnModel, ReportsDetailsTableModel } from './reports-details-table-model';
import { getDateFromString } from '../../reports.utils';
import {
  IDimensionData,
  IReportData,
  IReportDetailConfig,
  IReportDataPayload,
  IChartDataPayload,
  IReportFilterPayload,
  ICustomReportPayload,
  ISavedReportData,
  IColumn,
  ConfirmationType,
  IRemoteInit,
} from './reports-details.interfaces';
import { VMSConfig } from '../../../library/smartTable/table/table.model';
import { BehaviorSubject } from 'rxjs';
import { ClonerService } from '../../../core/services/cloner.service';
import { IColumnItem } from '../../components/filter-fields-sidepanel/filter-fields-sidepanel.interfaces';
import { ISavedReportItemModel } from '../reports-saved/reports-saved.interfaces';
import { Params, Router } from '@angular/router';
import { NavigationPaths } from '../../enums/report.enums';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { HttpService } from 'src/app/core/services/http.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { map } from 'rxjs/operators';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { UtilityService } from 'src/app/shared/service/utility/utility.service';

@Injectable({
  providedIn: 'root'
})
export class ReportsDetailsService {
  tableConfig: VMSConfig;
  reportConfigData: IReportDetailConfig;
  reportData: IReportData;
  reportFilters: any[] = [];
  reportKey: string;
  reportName: string;
  chartData: any[] = [];
  dimensionData: IDimensionData[] = [];
  totalRecords = 0;
  searchTerm: string;
  public programId: string;
  private currentProgram;
  isTableLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isDataLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isReportLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  defaultDimension: BehaviorSubject<IDimensionData> = new BehaviorSubject<IDimensionData>({
    chart_types: [],
    default_chart_type: null,
    dimension_id: null,
    label: null,
    x_axis_label: null,
  y_axis_label: null
  });
  selectedDimension: IDimensionData;
  reportOrderBy;
  reportOrderType;
  itemsPerPage = 10;
  savedReportData: ISavedReportData = { // current column and filter state
    columnList: [],
    filterData: [],
    reportName: null,
    reportId: null,
    reportUUID: null
  };
  reportColumn:any;
  isBaseReport = false;
  confirmationStatus = {
    isConfirmed: false,
    mainMessage: null,
    subMessage: null,
    type: null
  }

  defaultColumnList ;
  defaultReportData;
  // columnListLoaded : Subject<boolean> = new Subject<boolean>();
  columnListLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  showOptions : boolean = false;

  private _baseColumnList: string[]; // base column state (use for restore after apply custom filter)
  private _baseFilterData: any; // base filter state (use for restore after apply custom filter)
  private _remoteInit = {
    isRemote: false,
    isFullInit: false
  };
  private _reportLoadingStatus = {
    reportDataLoaded: false,
    reportFilterLoaded: false
  }
  logs:Log=undefined
  isSavedReport: boolean = false;

  constructor(
    private _reportService: ReportService,
    private _clonerService: ClonerService,
    private _router: Router,
    private _loader: LoaderService,
    private _http: HttpService,
    private datePipe: LocalDateFormatPipe,
    private storageService: StorageService,
    private eventStreamService:EventStreamService,
    private utilityService:UtilityService,
  ) {
    this.updateCurrentProgram();
  }

  updateCurrentProgram() {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = this.currentProgram.id;
    this.getReportColumn();
  }

  getReportColumn(){
    this._reportService.getReportColumn(this.programId).subscribe({next:
      (data) => {
        if (data) {
          this.reportColumn = data;
        }
      },error:
      err => {
        let log=this.showError('Something went wrong with getting report');
        this.emitLogs(log);
      }
    })
  }

  public initReport(reportKey: string,sortBy?: string,sortType?: string, savedfiltres ? :any, isRemoteInit?: IRemoteInit) {
    this.searchTerm='';
    if (this._isUUID(reportKey)) {
      this._reportService.getSavedReportById(reportKey).subscribe({next:
        (data: ISavedReportItemModel) => {
          if (data) {
            if(savedfiltres){
              this._baseFilterData = this.cleanFilterKeys(savedfiltres);
            }else{
              this._baseFilterData = this.cleanFilterKeys(data.filter_fields);
            }
            this._baseColumnList = data.table_fields as string[];
            const reportData: ISavedReportData = {
              reportName: data.report_name,
              reportId: data.report_id,
              reportUUID: data.report_uuid,
              filterData: this._baseFilterData,
              columnList: this._baseColumnList
            }
            this.reportName = data.report_name;
            this.reportKey = reportData.reportId;
            this.showOptions = data.is_report.toLocaleUpperCase() == 'SHARED' ? true : false;

            this.initSavedReport(reportData, isRemoteInit,sortBy,sortType);
          }
        },error:
        err => {
          // this._alert.error('Something went wrong with getting report');
          let log=this.showError('Something went wrong with getting report');
          this.emitLogs(log);
        }
    })
    } else {
      this.reportKey = reportKey;
      this.initBaseReport(reportKey,sortBy,sortType);
    }
  }

  public initBaseReport(reportKey: string,sortBy: string,sortType: string) {
    this.isBaseReport = true;
    this.tableConfig = this._clonerService.deepClone(ReportsDetailsTableModel);
    this.getReportConfig(reportKey,sortBy,sortType);
  }

  public initSavedReport(reportData: ISavedReportData, remoteInit: IRemoteInit,sortBy?:string,sortType?:string) {
    this.isBaseReport = false;
    this._remoteInit = remoteInit;
    if (this._remoteInit?.isRemote) {
      this.reportKey = reportData.reportId;
    }
    this.savedReportData = reportData;
    this.tableConfig = this._clonerService.deepClone(ReportsDetailsTableModel);
    this.getReportConfig(this.reportKey,sortBy,sortType);
  }

  public getReportDataDefaultColumnList (reportKey) : any {
    // Default column list
    let table_columns = [
      'job_code',
      'title',
      'hierarchy_name',
      'category',
      'job_manager',
      'location_name',
      'positions',
      'estimate_budget',
      'hiring_close_date',
      'start_date',
      'end_date',
      'date_created',
      'number_of_openings',
      'job_level',
      'source',
      'status',
    ];

    this._reportService
      .post(`/report/programs/${this.programId}/get-fields-filters`, {
        report_id: reportKey,
        table_columns: table_columns,
      })
      .subscribe((res: any) => {
        this.defaultColumnList = res.data;
        // Enabling this.showOptions for saved reports Just for me later on add this to API
        this.showOptions = false;
        this.columnListLoaded.next(true);
      });
      return this.defaultColumnList;
  }

  public getReportConfig(reportKey: string,sortBy?: string,sortType?: string) {
    this.startDataLoading();
    this._reportService.getReportConfigById(reportKey).subscribe({next:
      (data: IReportDetailConfig) => {
        if (data) {
          this.reportConfigData = data;
          if(sortBy){
            this.reportOrderBy=sortBy;
          }
          if(sortType){
            this.reportOrderType=sortType;
          }

          this.tableConfig.title = this.reportName || this.reportConfigData.report_title || 'Reports';
          this.reportName = null;
          this._setDimensionData(this.reportConfigData.chart_dimensions);

          this.getReportData(reportKey);
          if (this.defaultDimension.value?.dimension_id
            && (!this._remoteInit?.isRemote
              || (this._remoteInit?.isRemote
                && this._remoteInit?.isFullInit)
            )
          ) {
            this.getChartData(reportKey, this.defaultDimension.value);
          }
        }
      },error: err => {
        this.stopDataLoading();
        // this._alert.error('Something went wrong with getting report config!');
        let log=this.showError('Something went wrong with getting report config!');
        this.emitLogs(log);
      }
    });
  }

  private _setColumnData(columnData: IColumn[], mappedColumnList: any) {
    if (columnData && columnData.length) {
      if (columnData.length > 7) {
        this.tableConfig.tableWidth = columnData.length * 200 + 'px';
      } else {
        this.tableConfig.tableWidth = '100%';
      }
      const column_width = (100 / columnData.length);

      const newColumnList = [];
      for (let i = 0; i < columnData.length; ++i) {
        const column = columnData[i];
        newColumnList.push({
          ...ReportsDetailsColumnModel,
          name: column.column_name,
          title: column.column_title ? column.column_title : this._checkColumnTitle(column.column_name, mappedColumnList),
          width: column_width
        });
      }

      this.tableConfig = { ...this.tableConfig, columnList: newColumnList };
      this.isTableLoaded.next(true);
    }
  }

  private _checkColumnTitle(columnName: string, mappedColumnList: any) {
    return mappedColumnList.hasOwnProperty(columnName) ? mappedColumnList[columnName] : columnName;
  }

  private _setDimensionData(dimensionData: any) {
    if (dimensionData) {
      const dimensionKeys = Object.keys(dimensionData);

      for (let i = 0; i < dimensionKeys.length; ++i) {
        const dimension: IDimensionData = dimensionData[dimensionKeys[i]];
        this.dimensionData.push(dimension);

        if (this.reportKey === 'assignment_end_report' && dimension?.dimension_id === 'days_range') {
          this.defaultDimension.next(dimension);
        } else if (i === 0) {
          this.defaultDimension.next(dimension);
        }
      }
    }
  }

  public resetDimension() {
    this.defaultDimension.next(null);
  }

  public getReportData(reportKey: string, pageNumber: number = 1, isSavedReport?: boolean) {
    const payload: IReportDataPayload = {
      report_id: reportKey,
      page: pageNumber,
      per_page: this.itemsPerPage,
      default_filters: null,
      report_filters: ((isSavedReport || this.isSavedReport) && this.savedReportData?.filterData && Object.keys(this.savedReportData.filterData || {}).length ? this.savedReportData.filterData : this.reportConfigData?.report_filters) || {},
      table_columns: this.savedReportData.columnList.length ? this.savedReportData.columnList : this.reportConfigData.list_default_columns,
      order_by: this.reportOrderBy,
      order_type: this.reportOrderType,
      search_text: decodeURIComponent(this.searchTerm),
    };

    // To Add Date and Time to the date and datetime fields just append the field name to the set
    const dateTimeColumn = new Set(['created_at']);

    Object.keys(payload.report_filters)
      .filter(x => dateTimeColumn.has(x))
      .forEach(item => {
        if (payload?.report_filters?.[item]?.[0]) payload.report_filters[item][0] += ' 00:00:00';

        if (payload?.report_filters?.[item]?.[1]) payload.report_filters[item][1] += ' 23:59:59';
      });

    this._reportService.getReportData(payload).subscribe({next:
      (data: IReportData) => {
        if (data) {
          this.reportData = {
            ...data,
            table_data: [...data.table_data].map(item => ({ ...item, onboarding_status: item?.onboarding_status?.replace('_', ' ') })),
          };
          this.tableConfig.formatColumns.numericTypeColumns = this.reportColumn?.numeric_columns;
          this.tableConfig.formatColumns.amountTypeColumns = this.reportColumn?.amount_columns;
          // For applying date format to the table data for the date fields
          this.reportColumn?.date_columns.forEach(field => {
              if (this.reportData.table_data) {
              for (let i = 0; i < this.reportData.table_data.length; ++i) {
                const date = this.reportData.table_data[i][field];
                this.reportData.table_data[i][field] = this.dateFormat(date);
              }
            }
        });

            this.reportColumn?.datetime_columns.forEach(dtfield => {
            if (this.reportData.table_data) {
              for (let i = 0; i < this.reportData.table_data.length; ++i) {
                const dtdate = this.reportData.table_data[i]?.[dtfield];
                this.reportData.table_data[i][dtfield] = this.dateTimeFormat(dtdate);
              }
            }
          });

          this.reportData.table_data = this.utilityService.removeHtmlTags(this.reportData.table_data, 'job_description');
          this.checkStatusField(this.reportData.table_data);

          if(!this.isBaseReport){
            this.getFilteredData(reportKey);
          }


          this._setColumnData(this.reportData.selected_columns, this.reportConfigData.list_column_mapping);
          this.totalRecords = this.reportData.paging?.total_records ? this.reportData.paging?.total_records : 0;
          this._setReportDataLoaded();
          this.stopDataLoading();
        }
      },error: err => {
        this.stopDataLoading();
        // this._alert.error('Something went wrong with getting report!');
        let log=this.showError('Something went wrong with getting report!');
        this.emitLogs(log);

      }});
  }

  public getFilteredData(reportKey) {
    let filter_columns :any=this.reportData?.table_columns.map(column => column.column_name);
    if(!this.isBaseReport){
      filter_columns=Object.keys(this.savedReportData.filterData);
    }
    if(filter_columns && filter_columns?.length > 0){
      const payLoad: IReportFilterPayload = {
        report_name: reportKey,
        filter_name: filter_columns
      };

      this._reportService.getReportFilter(payLoad).subscribe({next:
        (data:any) => {
          if (data && data.report_filters) {
            const reportFilterKeys = Object.keys(data.report_filters);
            for (let i = 0; i < reportFilterKeys.length; ++i) {
              this.reportFilters.push(data.report_filters[reportFilterKeys[i]]);
            }
          }
          this._setFilterDataLoaded();
        },error: err => {
          this.stopDataLoading();
          // this._alert.error('Something went wrong with getting report filter!');
          let log=this.showError('Something went wrong with getting report filter!');
          this.emitLogs(log);
        }});
    }
  }

  public getChartData(reportKey: string, dimension: IDimensionData, isSavedReport?: boolean) {
    const payLoad: IChartDataPayload = {
      report_id: reportKey,
      dimension: dimension?.dimension_id,
      report_filters: ((isSavedReport || this.isSavedReport) && this.savedReportData?.filterData && Object.keys(this.savedReportData.filterData || {}).length ? this.savedReportData.filterData : this.reportConfigData?.report_filters) || {},
    };
    this._reportService.getChartData(payLoad).subscribe({next:
      (data:any) => {
        this.chartData = data?.length ? data : ['no_data'];
      },error:
      err => {
        // this._alert.error('Something went wrong with getting chart data!');
        this.chartData = ['error'];
        let log = this.showError('Something went wrong with getting chart data!');
        this.emitLogs(log);
      },
  });
  }

  public saveReport(reportKey: string, reportData: ISavedReportData) {
    const payload: ICustomReportPayload = {
      report_name: reportKey,
      reportData: {
        reportName: reportData.reportName,
        report_filters: reportData.filterData,
        table_columns: reportData.columnList
      }
    };
    this._reportService.saveCustomReport(payload).subscribe({next:
      (data:any) => {
        if (data?.report_id) {
          this._router.navigateByUrl('/', { skipLocationChange: true })
            .then(() =>
              this._router.navigate([NavigationPaths.details(data.report_id)], { queryParams: { showConfirmation: true, isSavedReport: true } })
            );
        }
        this._loader.hide();
      },error:
      err => {
        this._loader.hide();
      }
    });
  }

  public updateReport() {
    const payload: ICustomReportPayload = {
      report_name: this.savedReportData.reportId,
      reportData: {
        reportName: this.savedReportData.reportName,
        report_filters: this.savedReportData.filterData,
        table_columns: this.savedReportData.columnList
      }
    }
    this._reportService.updateCustomReport(payload, this.savedReportData.reportUUID).subscribe({next:
      (res:any) => {
        this._loader.hide();
        this.showConfirmation(
          'Report Updated Sucessfully',
          'Your report has been updated sucessfully',
          ConfirmationType.Update
        );
      },error:
      err => {
        this._loader.hide();
        console.log(err);
      }
    })
  }

  public applyReportFilter(data: ISavedReportData, reportKey: string) {
    // This function is called when user clicks on apply filter button will update filter and visible columns data
    this.startDataLoading();
    this.savedReportData.columnList = data.columnList;
    this.savedReportData.filterData = data.filterData;
    this.getReportData(reportKey, null, true);

    if(this.reportConfigData.has_chart){
      this.getChartData(reportKey, this.selectedDimension, true);
    }
  }

  public applyReportFilterFromOutside(reportUUID: string) {
    if (reportUUID) {
      const savedReportData: ISavedReportData = JSON.parse(localStorage.getItem(reportUUID));
      localStorage.removeItem(reportUUID);
      this.initSavedReport(savedReportData, { isRemote: true, isFullInit: true });
    }
  }

  public clearReportFilter(reportKey: string, clearChartData?: boolean) {
    this.startDataLoading();
    this.savedReportData.columnList = this._baseColumnList?.length ? this._baseColumnList : [];
    this.savedReportData.filterData = this._baseFilterData ? this._baseFilterData : [];
    this.reportConfigData.report_filters = [];
    this.getReportData(reportKey);
    if (clearChartData) this.getChartData(reportKey, this.selectedDimension);
  }

  public getReportColumnList() {
    if (this.tableConfig?.columnList?.length) {
      return this.tableConfig.columnList.map(column => {
        return { name: column.name, title: column.title }
      });
    } else {
      return [];
    }
  }

  public getReportDefaultColumnList() {
    const columnList: IColumnItem[] = [];
    const columns = [];
    for (let i = 0; i < this.reportData?.selected_columns?.length; ++i) {
      const column = this.reportData.selected_columns[i];
      columns.push(column.column_name)
      columnList.push({ name: column.column_name, title: column.column_title });
    }

    for (let i = 0; i < this.reportData?.table_columns?.length; ++i) {
      const column = this.reportData.table_columns[i];
      if(columns.indexOf(column.column_name) < 0){
        columnList.push({ name: column.column_name, title: column.column_title });
      }
    }
    return columnList;
  }

  public loadDefaultColumnList() {
    const columnList: IColumnItem[] = [];
    const columns = [];

    for (let i = 0; i < this.defaultColumnList?.selected_columns?.length; ++i) {
      const column = this.defaultColumnList.selected_columns[i];
      columns.push(column.column_name)
      columnList.push({ name: column.column_name, title: column.column_title });
    }

    for (let i = 0; i < this.defaultColumnList?.table_columns?.length; ++i) {
      const column = this.defaultColumnList.table_columns[i];
      if(columns.indexOf(column.column_name) < 0){
        columnList.push({ name: column.column_name, title: column.column_title });
      }
    }
    return columnList.filter(column => column.name);
  }

  public startDataLoading() {
    this.isDataLoading.next(true);
  }

  public stopDataLoading() {
    this.isDataLoading.next(false);
  }

  public showConfirmation(message: string, subMessage: string, type: ConfirmationType) {
    this.confirmationStatus.isConfirmed = true;
    this.confirmationStatus.mainMessage = message;
    this.confirmationStatus.subMessage = subMessage;
    this.confirmationStatus.type = type;
    setTimeout(() => {
      this.hideConfirmation();
    }, 10000);
  }

  public hideConfirmation() {
    this.confirmationStatus.isConfirmed = false;
    this.confirmationStatus.mainMessage = null;
    this.confirmationStatus.subMessage = null;
    this.confirmationStatus.type = null;
  }

  public clearQueryParams(routeParams: Params) {
    let params = [];
    const keyParams = Object.keys(routeParams);
    for (let i = 0; i < keyParams.length; ++i) {
      const key = keyParams[i];
      params[key] = null;
    }
    this._router.navigate([], { queryParams: params, queryParamsHandling: 'merge' });
  }

  private _setReportDataLoaded() {
    this._reportLoadingStatus.reportDataLoaded = true;
    this._checkReportLoadingStatus();
  }

  private _setFilterDataLoaded() {
    this._reportLoadingStatus.reportFilterLoaded = true;
    this._checkReportLoadingStatus();
  }

  private _checkReportLoadingStatus() {
    if (!this.isBaseReport) {
      this.isReportLoaded.next(true);
    } else {
      if (this._reportLoadingStatus.reportDataLoaded) { // && this._reportLoadingStatus.reportFilterLoaded
        this.isReportLoaded.next(true);
      }
    }
  }

  stringToTitle(str, data) {
    for (const [key, value] of Object.entries(data)) {
      if (str === `${key}`) {
        str = `${value}`;
        return str;
      }
    }
    if (!str) {
      return '';
    }
    str = str?.toLowerCase().split('_');
    for (let i = 0; i < str?.length; i++) {
      str[i] = str[i][0].toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
  }

  checkStatusField(tableData: any) {
    if (tableData) {
      for (let i = 0; i < tableData.length; ++i) {
        const tableColumn = tableData[i];
        if (tableColumn.status) {
          tableData[i].status = tableData[i].status.replaceAll('_', ' ');
        }
        if (tableColumn.job_status) {
          tableData[i].job_status = tableData[i].job_status.replaceAll('_', ' ');
        }
        if (tableColumn.project_status) {
          tableData[i].project_status = tableData[i].project_status.replaceAll('_', ' ');
        }
        if (tableColumn.submission_status) {
          tableData[i].submission_status = tableData[i].submission_status.replaceAll('_', ' ');
        }
      }
    }
  }

  dateFormat(value) {
    value = getDateFromString(value);
    if (value) {
      return this.datePipe.transform(value, null, null, null, true);
    }
  }

  dateTimeFormat(value) {
    if (value) {
      if(typeof value === 'string'){
        value += " UTC";
      }
      // value = getDateTimeFromString(value);
      return this.datePipe.transform(`${value}`) + ' ' + this.datePipe.transform(`${value}`, 'hh:mm a');
    }
  }

  private _isUUID(value: string) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return new RegExp(regex).test(value);
  }

  public cleanFilterKeys(object: any) {
    const cleanedObject: any = {};
    for (const value in object) {
      const key = this._cleanFilterKey(value);
      cleanedObject[key] = object[value];
    }
    return cleanedObject;
  }

  private _cleanFilterKey(value: string) {
    const removedValue = 'filter_';
    if (value.indexOf(removedValue) === 0) {
      return value.substring(removedValue.length, value.length);
    } else {
      return value;
    }
  }

  public clearReportData() {
    this.clearObject(this.reportConfigData);
    this.clearObject(this.reportData);
    this.clearObject(this.tableConfig);
    this.savedReportData = {
      columnList: [],
      filterData: [],
      reportName: null,
      reportId: null,
      reportUUID: null
    };
    this.reportFilters = [];
    this.chartData = [];
    this.dimensionData = [];
    this.reportKey = null;
    this._baseColumnList = [];
    this._baseFilterData = {};
    this.setDefaultInitValues();
  }

  setDefaultInitValues() {
    this.isReportLoaded.next(false);
    this._reportLoadingStatus = {
      reportDataLoaded: false,
      reportFilterLoaded: false
    };
    this.defaultDimension.next({
      chart_types: [],
      default_chart_type: null,
      dimension_id: null,
      label: null,
      x_axis_label: null,
      y_axis_label: null
    })
  }

  clearObject(object: any) {
    if (object) {
      const keys = Object.keys(object);
      for (var i = 0; i < keys.length; i++) {
        delete object[keys[i]];
      }
    }
  }

  post(url, payload) {
    return this._http.post(url, payload);
  }

  get(url) {
    return this._http.get(url);
  }

  saveScoreConfigration(payload) {
    const _url = `/report/programs/${this.programId}/updateScorecardReportConfig`;
    return this.post(_url, payload).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        // this._alert.error(`No data found.`);
        let log=this.showError('No data found');
        this.emitLogs(log);
      }
    }, (err) => {
      // this._alert.error(errorHandler(err));
      let log=this.showError(err);
        this.emitLogs(log);
    }));
  }

  getScoreConfigration() {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/report/programs/${this.programId}/scorecardReportConfig`;
    return this.get(_url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        // this._alert.error(`No data found.`);
        let log=this.showError('No data found');
        this.emitLogs(log);
      }
    }, (err) => {
      // this._alert.error(errorHandler(err));
      let log=this.showError(err);
        this.emitLogs(log);
    }));
  }
  showError(err){
    window.scrollTo(0,0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error ? err?.error?.error : err, messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
        }
      });
      return this.logs;
  }

  emitLogs(logs){
    // this.eventStreamService.emit()
    this.eventStreamService.emit(new EmitEvent(Events.REPORT_DETAILS_LOGS, logs));
  }
}
