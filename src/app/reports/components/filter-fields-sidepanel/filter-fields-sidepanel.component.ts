import { Component, OnInit, Output, EventEmitter, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReportsDetailsService } from '../../pages/reports-details/reports-details.service';
import {
  ComparisonMode,
  ComparisonTypes,
  IColumnItem,
  FieldMode,
  FilterViewMode,
  IFilterValue,
} from './filter-fields-sidepanel.interfaces';
import { FilterService } from './filter-fields-sidepanel.service';
import { DndDropEvent } from 'ngx-drag-drop';
import { ISavedReportData } from '../../pages/reports-details/reports-details.interfaces';
import { ReportService } from '../../services/report.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ClonerService } from 'src/app/core/services/cloner.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DownloadReportService } from '../download-report/download-report.service';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { DATE_FORMAT } from 'src/app/wipro-timesheet/timesheet.enums';
@Component({
  selector: 'app-filter-fields-sidepanel',
  templateUrl: './filter-fields-sidepanel.component.html',
  styleUrls: ['./filter-fields-sidepanel.component.scss'],
  providers: [FilterService],
})
export class FilterFieldsSidepanelComponent implements OnInit, OnDestroy {
  public headerTitle = 'Filter & Fields';
  public fieldMode: FieldMode = FieldMode.ViewAll;
  public isConversion: boolean = false;
  public selectedConversion: string;
  public reportName: string;
  public isLoading: boolean;
  public loaderMessage: string = 'Filters are loading...';
  private programId: string;
  private currentProgram;

  private subscriptions: Subscription[] = [];
  logs: Log = undefined;
  searchValue: string = '';
  searchSubscription: Subscription;
  searchedFilteredData: any[];
  datepickerOptions: any = [];
  downloadOption: boolean = false;
  // defaultReportColumnList: any;
  reportKeyParam: any;
  reportColumnList: any = [];
  visibleColumnsList: any = [];
  dateFormat: string = DATE_FORMAT.FORMATMDY;

  constructor(
    private _filterService: FilterService,
    private _reportsDetailsService: ReportsDetailsService,
    private _reportService: ReportService,
    private storageService: StorageService,
    private _cloneService: ClonerService,
    private _loader: LoaderService,
    private datePipe: LocalDateFormatPipe,
    private _downloadReportService: DownloadReportService,
    private route: ActivatedRoute,
  ) {}

  @Input() set viewMode(value: FilterViewMode) {
    this._filterService.viewMode = value;
    if (value === FilterViewMode.View) {
      this.fieldMode = FieldMode.ViewActive;
    }
  }
  @Input() reportKey: any;
  @Input() saveReport: boolean = false;
  @Output() onApply = new EventEmitter();
  @Output() onSave = new EventEmitter();
  @Output() onUpdate = new EventEmitter();
  @Output() onClose = new EventEmitter();

  get reportFilterData() {
    return this._filterService.baseReportFilterData;
  }

  // get reportColumnList() {
  //   return this._filterService.baseReportColumnList;
  //   // return this._filterService.defaultColumnList;
  // }

  get viewMode() {
    return this._filterService.viewMode;
  }

  get isNewFeatureAllowed() {
    return environment?.newReportFeatureAllowed;
  }

  ngOnInit(): void {
    this.dateFormat = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat ?? this.dateFormat;
    this.subscriptions.push(
      this.route.paramMap.subscribe(param => {
        this.reportKeyParam = param.get('report');
      }),
    );

    this.isLoading = true;

    //  Keep this Code till UAT for Report Filter New UI  changes
    this.subscriptions.push(
      this._reportsDetailsService.columnListLoaded.subscribe((isColumnListLoaded: boolean) => {
        if (isColumnListLoaded) {
          this.isLoading = false;
          this.reportColumnList = this._filterService.initDefaultColumnListData();
          // this.defaultReportColumnList = this._filterService.defaultColumnList;
        }
      }),
    );
    // End of Code

    this.subscriptions.push(
      this._reportsDetailsService.isReportLoaded.subscribe((isReportLoaded: boolean) => {
        if (isReportLoaded) {
          this.isLoading = false;
          if (this.isNewFeatureAllowed) {
            if (this.reportKeyParam.length === 36) {
              this._filterService.initData();
              this.reportColumnList = this._filterService.baseReportColumnList;
            }
          } else {
            this._filterService.initData();
            this.reportColumnList = this._filterService.baseReportColumnList;
          }
        }
      }),
    );

    this.updateCurrentProgram();
    // this.setDownloadReportData();
  }

  setDownloadReportData() {
    this._downloadReportService.reportKey = this.reportKey;
    // this._downloadReportService.defaultColumnList = this.defaultReportColumnList;
    this._downloadReportService.defaultSavedReportData.columnList = this._filterService.getDefaultVisibleColumns(this.reportColumnList);
    this._downloadReportService.defaultSavedReportData.filterData = this._filterService.getFilterData(this.reportColumnList);
    this._downloadReportService.defaultSavedReportData.reportName = this.reportName;
  }


  downloadReport(format: string = 'CSV') {
    this.downloadOption = false;
    this.isLoading = true;
    this.loaderMessage = 'Downloading Report...';
    // Set default data for download report
    this.setDownloadReportData();
    const currentFormat = this._downloadReportService.downloadReportFormats.find(item => item.format === format);

    // Check downloadReportService.defaultSavedReportData.filterData has values or not
    const defaultReportData = {
      dataType: Object.keys(this._downloadReportService.defaultSavedReportData.filterData).length > 0 ? 'filtered' : 'all',
      format: currentFormat,
    };

    this._downloadReportService.initDefaultDownloadData(defaultReportData);
    this._downloadReportService.downloadReport().subscribe({
      next: () => {
        // this.downloadOption = true;
        this.isLoading = false;
        this.loaderMessage = 'Filters are loading...';
      },
      error: err => {
        // this.downloadOption = true;
        this.isLoading = false;
        this.showError('Something went wrong with Download Report!');
      },
    });
  }



  updateCurrentProgram() {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = this.currentProgram.id;
  }
  public comparisonOperators(type: string) {
    return this._filterService.getComparisonOperatorsByType(type as ComparisonTypes);
  }

  public filterDataByColumn(columnName: string) {
    return this._filterService.getFilterDataByColumn(columnName);
  }

  public isComparisonMode(column: IColumnItem, mode: string) {
    return column.comparisonMode === (mode as ComparisonMode);
  }

  public isComparisonType(column: IColumnItem, type: string) {
    // var datecolumns = ['start_date', 'end_date', 'hiring_close_date', 'worker_start_date', 'assignment_start_date', 'assignment_end_date', 'termination_date', 'closed_date', 'period_ending_date', 'interview_date', 'offer_start_date', 'offer_end_date', 'timesheet_start_date', 'timesheet_end_date', 'expense_start_date', 'expense_end_date', 'expense_item_start_date', 'expense_item_end_date', 'invoice_start_date', 'invoice_end_date', 'invoice_created_date', 'invoice_date', 'consolidate_invoice_date', 'voucher_date', 'cheque_date', 'task_start_date', 'task_due_date', 'original_start_date', 'week_ending', 'sow_start_date', 'sow_end_date', 'milestone_start_date', 'milestone_end_date', 'estimated_start_date', 'duration_start_date', 'duration_end_date', 'date_created', 'submitted_date', 'last_spend_date', 'date', 'job_creation_date', 'interview_completion_date', 'job_released_date', 'job_fill_date'];
    // var datecolumnsSet = new Set(datecolumns);
    // if (type == 'date' && datecolumnsSet.has(column.name)) {
    //   return true;
    // } else {
    //   return false;
    // }
    // //return column.comparisonType === type as ComparisonTypes;
    return this._filterService.isComparisonType(column, type);
  }

  public isViewMode(mode: string) {
    return this.viewMode === (mode as FilterViewMode);
  }

  public onDateChange(event, column) {
    const startRange = new Date(event);
    startRange.setDate(startRange.getDate());
    this.datepickerOptions[column.name] = {
      language: 'English',
      timepicker: true,
      format12h: true,
      range: false,
      enabledDateRanges: [{ start: startRange }],
    };
    this._filterService.changeFilterDateValue(this.datePipe.transform(event, '', '', '', true), column, 0);
  }

  public onendDateChange(event, column) {
    this._filterService.changeFilterDateValue(this.datePipe.transform(event, '', '', '', true), column, 1);
  }

  public onMoved(column: IColumnItem) {}

  public onDragEnd(event) {}

  public onDropColumn(event: DndDropEvent) {
    if (event.data && typeof event.index !== undefined) {
      this._filterService.setColumnInPosition(event.data, event.index);
    }
  }


  public onFieldMode(value: string) {
    this.fieldMode = value as FieldMode;
    // this.onApplyFilter();
  }

  public isFieldMode(value: string) {
    return this.fieldMode === (value as FieldMode);
  }

  public onSaveMode(value: boolean) {
    value ? (this.viewMode = FilterViewMode.Save) : (this.viewMode = FilterViewMode.Full);
  }

  public onConversion() {
    this.isConversion = !this.isConversion;
  }

  public onChangeFilterValue(values: IFilterValue[], column: IColumnItem) {
    this._filterService.changeFilterValues(values, column);
  }

  public onDeleteColumnValue(column: IColumnItem, value: IFilterValue) {
    this._filterService.deleteFilterValue(column, value);
  }

  public onDeleteDateColumnValue(column: IColumnItem, value: IFilterValue) {
    this._filterService.deleteDateFilterValue(column, value);
  }

  public onApplyFilter(event?) {
    this.onApply.emit({
      reportName: this.reportName,
      filterData: this._filterService.getFilterData(this.reportColumnList),
      columnList: this._filterService.getVisibleColumns(),
    } as ISavedReportData);

    if (event) {
      this.onClose.emit(event);
    }
  }

  public isString(val): boolean {
    return typeof val === 'string';
  }
  public onUpdateFilter() {
    this.onUpdate.emit({
      reportName: this._filterService.getSavedReportName(),
      reportId: this._filterService.getSavedReportId(),
      reportUUID: this._filterService.getSavedRepotUUID(),
      filterData: this._filterService.getFilterData(),
      columnList: this._filterService.getVisibleColumns(),
    } as ISavedReportData);
  }

  public onSaveReport() {
    this.onSave.emit({
      reportName: this.reportName,
      filterData: this._filterService.getFilterData(),
      columnList: this._filterService.getVisibleColumns(),
    } as ISavedReportData);
  }

  public onCloseSidebar(event) {
    this.onClose.emit(event);
  }

  getOnClickFilterData(f) {

    this._loader.show();
    if (!f.isFilterVisible) {
      let payLoad = {
        report_name: this.reportKey,
        filter_name: [f.name],
        search: {
          column_item: f.name,
          text: '',
        },
      };
      let _url = `/report/programs/${this.programId}/get-report-filters`;
      this._reportService.post(_url, payLoad).subscribe({
        next: (data: any) => {
          if (data) {
            this._reportsDetailsService.reportFilters.push(data?.data?.report_filters[f.name]);
            this._filterService.baseReportFilterData = this._cloneService.deepClone(this._reportsDetailsService.reportFilters);
            this._filterService.defaultColumnList = this._cloneService.deepClone(this._reportsDetailsService.reportFilters);
            this._downloadReportService.defaultSavedReportData.filterData = this._cloneService.deepClone(
              this._reportsDetailsService.reportFilters,
            );
            this._loader.hide();
            f.isFilterVisible = !f.isFilterVisible;
          }
        },
        error: err => {
          this.showError(err);
        },
      });
    } else {
      this._loader.hide();
      f.isFilterVisible = !f.isFilterVisible;
    }
  }
  showError(err) {
    // window.scrollTo(0,0);
    this.logs = {
      type: LOG_TYPE.ERROR,
      heading: err?.error?.error?.message,
      messages: [],
      autoClose: true,
      isShown: true,
      showReportButton: err?.status == 500,
      additionalInfo: { trace_id: err?.error?.trace_id },
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
    this._loader.hide();
  }
  searchRequiredId(event: any, columnName: any) {
    this.searchValue = event.target.value;
    if (this.searchValue.length >= 3) {
      if (this.searchSubscription) {
        this.searchSubscription.unsubscribe();
      }
      this._reportsDetailsService.reportFilters = [];
      if (!columnName.filter_data) {
        this._loader.show();
        let payLoad = {
          report_name: this.reportKey,
          filter_name: [columnName.name],
          search: {
            column_item: columnName.name,
            text: this.searchValue,
          },
        };

        let _url = `/report/programs/${this.programId}/get-report-filters`;
        this.searchSubscription = this._reportService.post(_url, payLoad).subscribe({
          next: (data: any) => {
            if (data) {
              this.searchedFilteredData = data?.data?.report_filters[columnName.name].filter_data;
              this._loader.hide();
            }
          },
          error: err => {
            // this._alert.error(errorHandler(err));
            this.showError(err);
          },
        });
      } else {
        this._loader.hide();
        columnName.isFilterVisible = !columnName.isFilterVisible;
      }
    }
  }
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  chooseDownloadType(eve) {
    eve.stopPropagation();
    this.downloadOption = !this.downloadOption;

    // $event.target.textContent will contain the button text.
    // You can use this to decide which report to download
    if (eve.target.textContent == 'Download Excel') {
      this.downloadReport('xls');
    } else if (eve.target.textContent == 'Download CSV') {
      this.downloadReport('csv');
    }
  }
}
