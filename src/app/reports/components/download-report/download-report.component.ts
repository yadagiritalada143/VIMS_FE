import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UntypedFormGroup } from '@angular/forms';
import { DownloadReportService } from './download-report.service';
import { AlertService } from '../../../core/components/alert/alert.service';
import { IReportDetailConfig, ISavedReportData } from '../../pages/reports-details/reports-details.interfaces';
import { LOG_TYPE } from 'src/app/library/logs/logs.model';
import { ReportKeys } from '../../enums/report.enums'; 
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import moment from 'moment';
@Component({
  selector: 'app-download-report',
  templateUrl: './download-report.component.html',
  styleUrls: ['./download-report.component.scss'],
})
export class DownloadReportComponent implements OnInit, AfterViewInit {
  @Input() isexpenseReport: boolean = false;
  logs: any;

  @Input() set reportKey(value: string) {
    this._downloadReportService.reportKey = value;
  }

  @Input() set defaultColumnList(value: string[]) {
    this._downloadReportService.defaultColumnList = value;
  }

  @Input() set savedReportData(value: ISavedReportData) {
    this._downloadReportService.savedReportData = value;
  }

  @Input() set reportConfigData(value: IReportDetailConfig) {
    this._downloadReportService.reportConfigData = value;
  }

  public showProgress: boolean;
  public sendToMail: boolean = false;
  _reportConfigData = null;
  datepickerOptions: any = {
    start_date: {
      language: 'English',
      timepicker: true,
      format12h: true,
      range: false,
      enabledDateRanges: [{ end: Date.now() }],
    },
    end_date: {
      language: 'English',
      timepicker: true,
      format12h: true,
      range: false,
      enabledDateRanges: [{ end: Date.now() }],
    }
  }
  dateFormat = '';
  maxPeriodNote = '';
  hasDateFilterError = false;
  constructor(public activeModal: NgbActiveModal, private _alert: AlertService, private _downloadReportService: DownloadReportService, private localStorage: StorageService) {
    this.dateFormat = this.localStorage.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat?.toUpperCase();
  }

  ngOnInit(): void {
    this._reportConfigData = this._downloadReportService?.reportConfigData;
    this._downloadReportService.initForm();
    this.disableCsvOption();
  }

  ngAfterViewInit(): void {
    const { filter_in_download, show_filter_in_download } = this._reportConfigData || {};
    const { max_months, max_days, column_name } = filter_in_download || {};
    if (show_filter_in_download) {
      const { filterData } = this._downloadReportService.savedReportData || {};
      if (filterData?.[column_name]?.length) {
        this.downloadReportForm?.get('start_date')?.setValue(filterData?.[column_name][0]);
        this.downloadReportForm?.get('end_date')?.setValue(filterData?.[column_name]?.[1] || '');
        this.validateDateFilter('start_date');
      }
      if (max_months) {
        this.maxPeriodNote = `Please ensure correct date range is selected and with ${max_months} month${max_months > 1 ? 's': ''}`;
      } else if (max_days) {
        this.maxPeriodNote = `Please ensure correct date range is selected and with ${max_days} day${max_days > 1 ? 's' : ''}`;
      }
    }
  }

  validateDateFilter(type?: string) {
    const { start_date } = this.downloadReportForm?.value;
    if (start_date && type === 'start_date') {
      const startRange = new Date(start_date);
      startRange.setDate(startRange.getDate());
      this.datepickerOptions.end_date = {
        ...this.datepickerOptions.end_date,
        enabledDateRanges: [{ start: startRange, end: Date.now() }],
      }
    }
  }

  disableCsvOption(){
    this._downloadReportService?.downloadReportFormats.forEach(reportFormat => {
      if(this._downloadReportService?.reportKey == ReportKeys?.VendorCompliancePendencyExlReport && reportFormat?.format?.toLowerCase() == 'csv' ){
        reportFormat.display = false;
      }else{
        reportFormat.display = true;
      }
    });
  }

  public get downloadReportForm(): UntypedFormGroup {
    return this._downloadReportService.downloadReportForm;
  }

  public get downloadReportFormats(): Array<object> {
    return this._downloadReportService?.downloadReportFormats;
  }

  public get formcontrol() {
    return this.downloadReportForm.controls;
  }

  public hideModal(): void {
    if (this._reportConfigData?.show_filter_in_download) {
      this._downloadReportService.savedReportData.downloadFilterData = null;
      this._downloadReportService.downloadReportForm?.removeControl('start_date');
      this._downloadReportService.downloadReportForm?.removeControl('end_date');
    }
    this.activeModal.close(false);
  }

  public downloadReport(): void {
    if (this._reportConfigData?.show_filter_in_download) {
      const { start_date, end_date } = this.downloadReportForm?.value;
      const { max_months, max_days, column_name } = this._reportConfigData?.filter_in_download || {};
      if ((moment(end_date).diff(moment(start_date), 'months', true) > max_months) || (max_days > moment(end_date).diff(moment(start_date), 'days'))) {
        this.hasDateFilterError = true;
        return;
      } else {
        this._downloadReportService.savedReportData.downloadFilterData = {
          [column_name]: [moment(start_date).format('YYYY-MM-DD'), moment(end_date).format('YYYY-MM-DD')]
        }
        this.hasDateFilterError = false;
      }
    }
    this.showProgress = true;
    if (this.sendToMail) {
      this._downloadReportService.sendMail().subscribe({next:
        (res:any) => {
          this.showProgress = false;
          this.hideModal();
          this._alert.success(res.message);
        },error:
        err => {
          this.showProgress = false;
          // this._alert.error('Something went wrong with Download Report!', err);
          this.showError('Something went wrong with Send Mail Report!');
        },
    });
      return;
    }
    if (this.isexpenseReport) {
      this._downloadReportService.downloadExpenseReport().subscribe({next:
        (res:any) => {
          let downloadLink = res.data.link;
          window.open(downloadLink, '_parent');
          this.showProgress = false;
          this.hideModal();
        },error:
        err => {
          this.showProgress = false;
          // this._alert.error('Something went wrong with Download Report!', err);
          this.showError('Something went wrong with Download Report!');
        },
    });
    } else {
      this._downloadReportService.downloadReport().subscribe({next:
        () => {
          this.showProgress = false;
          this.hideModal();
        },error:
        err => {
          this.showProgress = false;
          // this._alert.error('Something went wrong with Download Report!');
          this.showError('Something went wrong with Download Report!');
        },
    });
    }
  }

  showError(err) {
    this.logs = {
      type: LOG_TYPE.ERROR,
      heading: err?.error?.error?.message ? err?.error?.error?.message : err,
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
  }
}
