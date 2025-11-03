import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { ReportService } from '../../services/report.service';
import {  ISavedReportData } from '../reports-details/reports-details.interfaces';
import { ReportsDetailsService } from '../reports-details/reports-details.service';
import { ColumnOptions, ISavedReportItemModel, ISavedReportTableItem } from './reports-saved.interfaces';
import { ReportsSavedItemTableModel, ReportsSavedTableModel } from './reports-saved-table-model';
import { Params, Router } from '@angular/router';
import { NavigationPaths } from '../../enums/report.enums';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';

@Injectable()

export class ReportsSavedService {

  public reportsData: ISavedReportItemModel[] = [];
  public reportKey: string;
  public tableConfig: VMSConfig;
  public subTableConfig: VMSConfig;
  public totalRecords: number = 0;
  public limitRecords: number = 10;
  public currentPage: number = 1;
  public isDataLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  logs:Log=undefined;

  constructor(
    private _reportDetailsService: ReportsDetailsService,
    private _reportService: ReportService,
    private _router: Router,
    private eventStreamService:EventStreamService,
    private localStorage: StorageService,
    private datePipe: LocalDateFormatPipe,
  ){}

  public initReports(routeParams: Params) {
    this.isDataLoading.next(true);
    this.reportKey = routeParams.key ? routeParams.key : null;
    if (this.reportKey) {
      const subReportName = routeParams.name ? routeParams.name : null;
      this.setSubTableConfig(subReportName);
      this.getSavedReports({ limit: this.limitRecords, page: this.currentPage, report_id: this.reportKey});
    } else {
      this.setTableConfig();
      this.getSavedReports({ limit: this.limitRecords, page: this.currentPage });
    }
  }

  public setTableConfig(): void {
    this.tableConfig = ReportsSavedTableModel;
    //this.changeColumnOptions();
  }

  public changeColumnOptions(subTable?: boolean) {
    const tableConfig = subTable ? this.subTableConfig : this.tableConfig;
    for (let i = 0; i < tableConfig?.columnList?.length; ++i) {
      let column = tableConfig?.columnList[i];
      if (column.name === 'report_name') {
        for (let j = 0; j < column.options?.length; ++j) {
          let option = column.options[j];
          if (option.name === ColumnOptions.NewSchedule) {
            option['isVisible'] = this.isScheduledOptionVisible;
          } else if (option.name === ColumnOptions.ScheduleReport) {
            option['isVisible'] = this.isNoScheduledOptionVisible;
          }
        }
      }
    }
  }

  public setSubTableConfig(name): void {
    this.subTableConfig = ReportsSavedItemTableModel;
    this.subTableConfig.subTitle = name;
    this.changeColumnOptions(true);
  }

  public getSavedReports(params) {
    this._reportService.getSavedReports(params).subscribe({next:
      (res:any) => {
        //if (res.data?.length) {
          this.reportsData = this.customReportData(res.data);
          this.limitRecords = res.per_page;
          this.totalRecords = res.total;
        //}
        this.isDataLoading.next(false);
      },error: 
      error => {
        // this._alertService.error('Something went wrong with getting report!');
        let log = this.showError('Something went wrong with getting report!');
        this.emitLogs(log);
      }
  });
  }

  public customReportData(items: any): any {
    const currentProgram = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
    const dateFormat = currentProgram.defaultDateFormat ?? currentProgram?.config?.preferred_date_format ?? DATE_FORMAT.FORMATMDY;
    return items.map((item: ISavedReportItemModel) => {
      return {
        report_name: this.toTitleCase(item.report_name),
        base_report: item.base_module,
        report_creator: item.report_creator,
        created_on: item.created_on ? this.datePipe.transform(item.created_on, dateFormat + ' hh:mm:ss a z') : '--',
        last_updated_on: item.last_updated_on ? this.datePipe.transform(item.last_updated_on, dateFormat + ' hh:mm:ss a z') : '--',
        last_run_on: item.last_updated_on ? this.datePipe.transform(item.last_updated_on, dateFormat + ' hh:mm:ss a z') : '--',
        schedule_status: item.schedule_status,
        report_id: item.report_id,
        table_fields: item.table_fields,
        filter_fields: item.filter_fields,
        report_uuid: item.report_uuid,
        is_report: item.is_report
      } as ISavedReportTableItem;
    });
  }

  toTitleCase(str) {
    if (!str) {
      return;
    }
    return str.replace(
      /\w\S*/g,
      function (txt) {
        return txt?.charAt(0)?.toUpperCase() + txt?.substr(1)?.toLowerCase();
      }
    );
  }

  public updateSavedReport(data: ISavedReportData) {
    localStorage.setItem(data.reportUUID, JSON.stringify(data));
    this._router.navigate([NavigationPaths.details(data.reportUUID)], {queryParams: {applyFilters: true, isSavedReport: true}});
  }

  public initFilterModal(reportData: ISavedReportTableItem) {
    this._reportDetailsService.initReport(reportData.report_uuid, '','',null,{isRemote: true, isFullInit: false});
  }

  public isScheduledOptionVisible(item: ISavedReportItemModel) {
    return item?.schedule_status === 'Scheduled';
  }

  public isNoScheduledOptionVisible(item: ISavedReportItemModel) {
    return item?.schedule_status === 'Not Scheduled';
  }
 
  public clearSavedReportData() {
    this._reportDetailsService.clearReportData();
  }
  showError(err){
    window.scrollTo(0,0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
      err?.error?.error?.errors?.forEach(msg => {      
        if (msg?.message) {      
          this.logs.messages.push(msg?.message);
        }
      });
      return this.logs;
  }
  emitLogs(logs){
    // this.eventStreamService.emit()
    this.eventStreamService.emit(new EmitEvent(Events.SAVED_REPORT_LIST, logs));    
  }
}
