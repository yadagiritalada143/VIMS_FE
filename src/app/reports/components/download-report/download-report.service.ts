import { Injectable } from '@angular/core';
import { IProgram } from '../../../expense/interfaces/expense.interfaces';
import { HttpService } from '../../../core/services/http.service';
import { StorageKeys, StorageService } from '../../../core/services/storage.service';
import { ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { IReportDetailConfig, ISavedReportData } from '../../pages/reports-details/reports-details.interfaces';
import { ExcelFormats } from '../../enums/report.enums';
import { ISavedDefaultReportData } from '../../pages/reports-details/reports-details.interfaces';
import { ConfigurationLoader } from 'src/app/configuration/configuration-loader.service';
import { environment } from 'src/environments/environment';

enum DataType {
  Filtered = 'filtered',
  All = 'all',
}

@Injectable({
  providedIn: 'root',
})
export class DownloadReportService {
  public downloadReportFormats = [
    {
      name: 'Excel',
      format: 'xls',
      icon: '/assets/images/file-types/excel.svg',
      type: 'application/vnd.ms-excel',
      display: true,
    },
    {
      name: 'CSV',
      format: 'csv',
      icon: '/assets/images/file-types/csv.svg',
      type: 'application/vnd.csv',
      display: true,
    },
    // {
    //   name: 'PDF',
    //   format: 'pdf',
    //   icon: '/assets/images/file-types/pdf.svg',
    //   type: 'application/vnd.pdf',
    //   display: true,
    // },
  ];

  public downloadReportForm: UntypedFormGroup;
  public programId: string;
  public reportKey: string;
  public defaultColumnList: any;
  public savedReportData: ISavedReportData;
  public reportConfigData: IReportDetailConfig;
  public defaultSavedReportData: ISavedDefaultReportData = {
    reportName: '',
    filterData: {},
    columnList: [],
    };

  private _currentProgram: IProgram;
  public reportApi;

  constructor(
    private _http: HttpService,
    private _route: ActivatedRoute,
    private _formBuilder: UntypedFormBuilder,
    private _storageService: StorageService,
    private ConfigurationLoader: ConfigurationLoader,
  ) {
    this._currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = this._currentProgram.id;
    this.reportApi = environment?.REPORT_API_ENDPOINT;
  }

  public initForm() {
    this._currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = this._currentProgram.id;
    this.downloadReportForm = this._formBuilder.group({
      data: [DataType.Filtered],
      format: [this.downloadReportFormats[0]],
    });
    if (this.reportConfigData?.show_filter_in_download && this.reportConfigData?.filter_in_download?.column_name === 'start_date') {
      this.downloadReportForm.addControl('start_date', new UntypedFormControl('', Validators.required));
      this.downloadReportForm.addControl('end_date', new UntypedFormControl('', Validators.required));
    }
  }

  public initDefaultDownloadData(DefaultReportData) {
    this._currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = this._currentProgram.id;
    this.downloadReportForm = this._formBuilder.group({
      data: [DefaultReportData.dataType],
      format: [DefaultReportData.format],
    });
  }

  updateFilterData(filterData) {
    const { column_name } = this.reportConfigData?.filter_in_download || {};
    if (this.reportConfigData?.show_filter_in_download && column_name && this.savedReportData?.downloadFilterData?.[column_name]) {
      if (!filterData) {
        filterData = {};
      }
      filterData[column_name] = this.savedReportData.downloadFilterData[column_name];
    }
    return filterData;
  }

  public downloadReport(): Observable<any> {
    let blob;
    let filename: string;
    let columnList: string[] = [];
    let filterData: any;
    let reportName = this.savedReportData?.reportName ? this.savedReportData?.reportName : this.reportKey;


    const form = this.downloadReportForm.value;

    if (form.data === DataType.All) {
      columnList = this.defaultSavedReportData?.columnList ? this.defaultSavedReportData?.columnList : this.defaultColumnList;
      filterData = {};
    } else {
      columnList = this.savedReportData?.columnList.length ? this.savedReportData?.columnList : this.defaultSavedReportData?.columnList ? this.defaultSavedReportData?.columnList : this.defaultColumnList;
      const { column_name } = this.reportConfigData?.filter_in_download || {};
      if (!(this.reportConfigData?.show_filter_in_download && column_name && this.savedReportData?.downloadFilterData?.[column_name])) {
        filterData = this.savedReportData?.filterData ? this.savedReportData?.filterData : this.defaultSavedReportData?.filterData ? this.defaultSavedReportData?.filterData : {};
      }
    }
    filterData = this.updateFilterData(filterData);

    const payLoad = {
      chart_by: 'Category',
      chart_image: '',
      report_columns: columnList.length ? columnList : this.defaultColumnList,
      report_data_type: form.data ? form.data : DataType.All,
      report_filters: filterData,
      report_format: form.format.format ? form.format.format : form.format,
      report_name: this.reportKey ? this.reportKey : this.defaultSavedReportData?.reportName ? this.defaultSavedReportData?.reportName : '',
    };
    const base_url = this.ConfigurationLoader?.getConfiguration()?.REPORT_API_ENDPOINT || environment.REPORT_API_ENDPOINT;
    return this._http.downloadPostBlob(`/report/programs/${this.programId}/downloadreport`, payLoad, base_url).pipe(
      tap(data => {
        const isDownloadRoute = this._route.snapshot.queryParams['download'];
        blob = new Blob([data], { type: form.format.type });
        filename = reportName + '.' + (data?.type?.toLowerCase()?.trim() === ExcelFormats?.xlsxFormat?.toLowerCase() ? 'xlsx' : (data?.type?.toLowerCase()?.trim() === ExcelFormats?.xlsxFormat?.toLowerCase() ? 'xls' : form?.format?.format));
        const link = document.createElement('a');
        document.body.appendChild(link);
        const blobData = window.URL.createObjectURL(blob);
        link.href = blobData;
        link.style.display = 'none';
        link.download = filename;
        link.click();
        setTimeout(() => {
          // For Firefox it is necessary to delay revoking the ObjectURL
          window.URL.revokeObjectURL(blobData);
          if (isDownloadRoute) {
            window.close();
          }
        }, 100);
      }),
    );
  }

  public downloadExpenseReport(): Observable<any> {
    const form = this.downloadReportForm.value;
    let extension = form.format.format;
    return this._http.post(`/expense/programs/${this.programId}/download-expense-sheet/${this.reportKey}/${extension}`, {});
  }

  downloadInvoiceListReportAsExcel(): Observable<any> {
    let url = `/invoice/programs/${this.programId}/invoice-to-consolidate-download?type=auto`;
    return this._http.get(url);
  }

  public downloadExpenseApprovedReport(expenseType): Observable<any> {
    return this._http.get(`/expense/programs/${this.programId}/${expenseType}/download-expense`);
  }

  public sendMail(): Observable<any> {
    let columnList: string[] = [];
    let filterData: any;

    const form = this.downloadReportForm.value;

    if (form.data === DataType.All) {
      columnList = this.defaultColumnList;
      filterData = {};
    } else {
      columnList = this.savedReportData.columnList.length ? this.savedReportData.columnList : this.defaultColumnList;
      const { column_name } = this.reportConfigData?.filter_in_download || {};
      if (!(this.reportConfigData?.show_filter_in_download && column_name && this.savedReportData?.downloadFilterData?.[column_name])) {
        filterData = this.savedReportData.filterData ? this.savedReportData.filterData : {};
      }
    }
    filterData = this.updateFilterData(filterData);

    const payLoad = {
      chart_by: 'Category',
      chart_image: '',
      report_columns: columnList,
      report_data_type: form.data,
      report_filters: filterData,
      report_format: form.format.format,
      report_name: this.reportKey,
      sendmail: 1,
    };
    const base_url = this.ConfigurationLoader?.getConfiguration()?.REPORT_API_ENDPOINT || environment.REPORT_API_ENDPOINT;
    return this._http.post(`/report/programs/${this.programId}/downloadreport`, payLoad, base_url);
  }
}
