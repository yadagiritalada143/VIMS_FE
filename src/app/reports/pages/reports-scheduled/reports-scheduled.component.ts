import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { ReportService } from '../../services/report.service';
import { IScheduledReport, ReportsScheduledTableModel, ReportsScheduledItemTableModel } from '../reports-scheduled/reporst-scheduled.model';
import { NavigationPaths } from '../../enums/report.enums';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';

@Component({
  selector: 'app-reports-scheduled',
  templateUrl: './reports-scheduled.component.html',
  styleUrls: ['./reports-scheduled.component.scss']
})
export class ReportsScheduledComponent implements OnInit {

  public hasReportKey: string;
  public dataLoading = true;
  public tableConfig: VMSConfig;
  public subTableConfig: VMSConfig;
  public vmsData: IScheduledReport[] = [];
  public totalRecords: number;
  public limitRecords: number;
  public currentPage: number;
  public searchTerm: string;
  public tableLoaded = false;
  public filterParamsItem = {};
  editVisibility = 'hidden';
  logs:Log=undefined;
  selectedReport;
  constructor(
    private reportService: ReportService,
    private router: Router,
    private route: ActivatedRoute,
    private loader: LoaderService,
    private datePipe: LocalDateFormatPipe,
    private localStorage: StorageService,
    private alertService: AlertService) { }

  ngOnInit(): void {
    this.reportService.updateCurrentProgram();
    this.currentPage = 1;
    this.limitRecords = 10;
    this.route.queryParams
      .subscribe((p: Params) => {
        this.hasReportKey = p.key || null;
        if (this.hasReportKey) {
          const subReportName = p.name || null;
          this.setSubTableConfig(subReportName);
          this.getScheduledReports({ limit: this.limitRecords, page: this.currentPage, report_id: this.hasReportKey });
        } else {
          this.setTableConfig();
          this.getScheduledReports({ limit: this.limitRecords, page: this.currentPage });
        }
      });

  }
  public getScheduledReports(params): void {
    this.loader.show();
    this.reportService.getScheduledReports(params).subscribe({next:(result:any) => {
      const currentProgram = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
      const dateFormat = currentProgram.defaultDateFormat ?? currentProgram?.config?.preferred_date_format ?? DATE_FORMAT.FORMATMDY;
      this.vmsData = result.data.map(report => ({
        ...report,
        schedule_created_on: report.schedule_created_on ? this.datePipe.transform(report.schedule_created_on, dateFormat + ' hh:mm:ss a z') : '--',
        start_date: report.start_date ? this.datePipe.transform(report.start_date, dateFormat, null, null, true) : '--',
        end_date: report.end_date ? this.datePipe.transform(report.end_date, dateFormat, null, null, true) : '--'
      }));
      this.limitRecords = result.per_page;
      this.totalRecords = result.total;
      this.dataLoading = false;
      this.loader.hide();
    },error: error => {
      this.loader.hide();
      // this.alertService.error(errorHandler(error));
      this.showError(error)
    }});
  }

  public setTableConfig(): void {
    this.tableConfig = ReportsScheduledTableModel;
  }
  public setSubTableConfig(name): void {
    this.subTableConfig = ReportsScheduledItemTableModel;
    this.subTableConfig.subTitle = name.toLocaleUpperCase().replace(/_/g, ' ');;
  }

  public onSearch(event): void {
    this.searchTerm = event ? decodeURIComponent(event) : '';
    this.getScheduledReports({ limit: this.limitRecords, page: 1, search: this.searchTerm });

  }

  public onPaginationClick(pageNo: number): void {
    this.getScheduledReports({ limit: this.limitRecords, page: pageNo });
  }

  public onClickRecords(event): void {
    this.limitRecords = event;
    this.getScheduledReports({ limit: this.limitRecords, page: 1 });
  }

  public onTitleClick(event): void {
    this.router.navigate([NavigationPaths.allScheduled()]);
  }
  public onBaseReportClicked(event): void {
    if (event) {
      if (!this.hasReportKey) {
        this.hasReportKey = event;
      }
      this.router.navigateByUrl(NavigationPaths.details(this.hasReportKey));
    }
  }

  public onClickView(report: IScheduledReport): void {
    if (report) {
      const key = report.report_name.toLocaleLowerCase().replace(' ', '_');
      this.router.navigate([NavigationPaths.allScheduled()], { queryParams: { name: report.report_name, key}});
    }
  }

  onEditClick(report) {
    this.editVisibility = this.editVisibility === 'hidden' ? 'visible' : 'hidden';
    this.selectedReport = report;
  }

  onViewScheduleClick(report) {
    this.selectedReport = report;
    this.editVisibility = 'visible';
  }

  onSortClick(event) {
    this.getScheduledReports({ limit: this.limitRecords, page: 1, key: event?.name, order_by: event?.order.toLocaleLowerCase() });
  }
  clickViewFilters(event) {
    // Method for adding functionality later
  }
  clickEditFilters(event) {
    // Method for adding functionality later
  }
  clickScheduleReport(event) {
    // Method for adding functionality later
  }
  closeEditView() {
    this.editVisibility = 'hidden';
  }
  finishEditing({ message, showMessage }) {
    this.closeEditView();
    if (showMessage) {
      this.getScheduledReports({ limit: this.limitRecords, page: this.currentPage, report_id: this.hasReportKey });
      this.alertService.success(message);
    }
  }
  get curentConfig() {
    return this.hasReportKey ? this.subTableConfig : this.tableConfig;
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
  }
}
