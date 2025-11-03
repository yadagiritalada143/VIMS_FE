import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { NavigationPaths } from '../../enums/report.enums';
import { ISavedReportItemModel } from './reports-saved.interfaces';
import { ReportService } from '../../services/report.service';
import { ReportsDetailsService } from '../reports-details/reports-details.service';
import { ReportsSavedService } from './reports-saved.service';
import { FilterViewMode } from '../../components/filter-fields-sidepanel/filter-fields-sidepanel.interfaces';
import { ISavedReportData } from '../reports-details/reports-details.interfaces';
import { Subscription } from 'rxjs';
import { Log } from 'src/app/library/logs/logs.model';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'app-reports-saved',
  templateUrl: './reports-saved.component.html',
  styleUrls: ['./reports-saved.component.scss'],
  providers: [ReportsSavedService]
})
export class ReportsSavedComponent implements OnInit, OnDestroy {

  public isFilterViewVisibile = false;
  public filterViewMode: FilterViewMode;
  public dataVisibilitySchedule = 'hidden';
  public isAdvanceFilter: boolean = false;
  public limit = 10;
  public pageNo = 1;
  filter: any = {};
  public searchTerm: string;
  public filterParamsItem = {};
  public schedulePanelData: any;
  public isDataLoading: boolean;
  public scheduleReportName: string;
  public scheduleReportId: string;
  public showReportsShare: boolean;
  selectedReportId = '';

  private _subscriptions: Subscription[] = [];
  logs:Log=undefined;
  savedReportId: string;
  savedReportName: string;
  constructor(
    private reportDetailsService: ReportsDetailsService,
    private reportSavedService: ReportsSavedService,
    private reportService: ReportService,
    private router: Router,
    private route: ActivatedRoute,
    private alertService: AlertService,
    private eventStreamService:EventStreamService) { }

  get tableConfig() {
    return this.reportSavedService.tableConfig;
  }

  get subTableConfig() {
    return this.reportSavedService.subTableConfig;
  }

  get reportsData() {
    return this.reportSavedService.reportsData;
  }

  get reportKey() {
    return this.reportSavedService.reportKey;
  }

  set limitRecords(value: number) {
    this.reportSavedService.limitRecords = value;
  }

  get limitRecords() {
    return this.reportSavedService.limitRecords;
  }

  get totalRecords() {
    return this.reportSavedService.totalRecords;
  }

  ngOnInit(): void {
    this.reportService.updateCurrentProgram();
    this._subscriptions.push(this.reportSavedService.isDataLoading.subscribe(this.onDataLoading.bind(this)));
    this._subscriptions.push(this.route.queryParams.subscribe((routeParams: Params) => {
      this.reportSavedService.initReports(routeParams);
    }));
    this.eventStreamService.on(Events.SAVED_REPORT_LIST).subscribe((data:any)=>{
      this.logs=data
    });
  }

  public onDataLoading(value: boolean) {
    this.isDataLoading = value;
  }

  public onSearch(event): void {
    this.searchTerm = event ? decodeURIComponent(event) : '';
    this.reportSavedService.getSavedReports({ limit: this.limitRecords, page: 1, search_text: this.searchTerm });

  }

  public onPaginationClick(pageNo: number): void {
    this.pageNo=pageNo;
    if (!this.isAdvanceFilter) {
      this.reportSavedService.getSavedReports({ limit: this.limitRecords, page: pageNo });
     
    } else {
      this.onListFilter
    }
  }

  public onClickRecords(event): void {
    this.limitRecords = event;
    this.reportSavedService.getSavedReports({ limit: this.limitRecords, page: 1 });
  }

  public onTitleClick(event): void {
    if (event && this.reportKey) {
      this.router.navigate([NavigationPaths.allSaved()]);
    }
  }
  public onBaseReportClicked(event): void {
    if (event) {
      this.router.navigateByUrl(NavigationPaths.details(this.reportKey));
    }
  }

  public onClickView(event: ISavedReportItemModel): void {
    if (event) {
      if (event.column === 'report_name') {
        this.router.navigate([NavigationPaths.details(event.report_uuid)], { queryParams: { name: event.report_name, isSavedReport: true } });
      } else if (event.column === 'base_report') {
        this.router.navigate([NavigationPaths.allSaved()], { queryParams: { name: event.base_report, key: event.report_id } });
      }
    }
  }

  public onOptionClicked(event): void {
    if (event) {
      switch (event.option.name) {
        case 'View Filters & Fields': {
          if (event?.data?.report_id) {
            this.reportSavedService.initFilterModal(event.data);
            this.filterViewMode = FilterViewMode.View;
            this.isFilterViewVisibile = true;
          }
          break;
        }
        case 'Edit Filters & Fields': {
          this.reportSavedService.initFilterModal(event.data);
          this.selectedReportId = event.data.report_id;
          this.filterViewMode = FilterViewMode.Edit;
          this.isFilterViewVisibile = true;
          break;
        }
        case 'New Schedule': {
          this.dataVisibilitySchedule = 'visible';
          this.scheduleReportName = event.data.base_report;
          this.scheduleReportId = event.data.report_id;
          break;
        }
        case 'Schedule Report': {
          const selectedReport = this.reportsData.find(elem => elem.report_name === event.data.report_name);
          this.reportService.scheduleCustomReport(selectedReport).subscribe(
            () => this.alertService.success('Report has been scheduled successfully.')
          );
          break;
        }
        case 'View Schedules': {
          this.router.navigate([NavigationPaths.allScheduled()]);
          break;
        }
        case 'Share': {
          this.savedReportId = this.reportsData.find(elem => elem.report_name === event.data.report_name)?.report_uuid;
          this.savedReportName = event.data.report_name;
          this.showReportsShare = true;
        }
      }
    }
  }
  onListFilter(event) {
    
    this.filter.limit=this.limit;
    this.filter.page=this.pageNo;
    if (event) {
      this.isAdvanceFilter = true;
      if (event.hasOwnProperty('is_enabled')) {
        if (event.is_enabled) {
          this.filter.is_enabled = true;
        } else {
          this.filter.is_enabled = false;
        }
      }
      if (event.name) {
        this.filter.name = event.name;
      } else {

        delete this.filter.name;
      }
      if (event.hasOwnProperty('report_name')) {
        this.filter.report_name = event.report_name;
      }

      if (event.hasOwnProperty('report_creator')) {
        this.filter.report_creator = event.report_creator;
      }

      if (event.hasOwnProperty('created_on')) {
        this.filter.created_on_start = event.created_on[0];
        this.filter.created_on_end = event.created_on[1];
      }
      if (event.hasOwnProperty('last_run_on')) {
        this.filter.last_run_on_start = event.last_run_on[0];
        this.filter.last_run_on_end = event.last_run_on[1];
      }


      this.reportSavedService.getSavedReports(this.filter);
    } else {
      this.filter = {};
      this.reportSavedService.getSavedReports(this.filter);
    }
  }
  public updateReportFilter(data: ISavedReportData): void {
    this.closeFilterAndFields();
    this.reportSavedService.updateSavedReport(data);
  }

  public closeFilterAndFields(): void {
    this.reportDetailsService.clearReportData();
    this.isFilterViewVisibile = false;
  }
  public closeSchedule(): void {
    this.dataVisibilitySchedule = 'hidden';
  }

  public getScheduleReportData(data) {
    return {
      end_after_occurence: '0',
      end_date: '2021-05-30',
      format: 'Excel',
      frequency: 'Weekly - MONDAY,FRIDAY',
      is_schedule: '1',
      is_schedule_day: null,
      no_end_date: '1',
      occurence_number: null,
      reciver: `['çlient', 'hiring_manager', 'vendor']`,
      report_id: '5',
      report_name: data.report_name,
      role_type: 'role',
      run_day: 'Weekly',
      run_frequency: ['MONDAY', 'FRIDAY'],
      run_time: '13:00:00',
      schedule_created_on: '2021-05-05 08:05:36',
      schedule_id: '5',
      schedule_updated_on: '2021-05-10 07:47:30',
      schedule_uuid: '11edcd21-2c44-4fc8-b2fe-a82f9e961b2d',
      scheduler: 'Test job Report',
      start_date: '2021-04-08',
      time_zone: 'EST5EDT',
    };
  }
  public onSortClick(event): void {
    if (event) {
      this.reportSavedService.getSavedReports({ limit: this.limitRecords, page: 1, key: event?.name, order_by: event?.order?.toLowerCase() });
    }
  }

  finishEditing({ message, showMessage }) {
    this.closeEditView();
    if (showMessage) {
      this.reportSavedService.getSavedReports({ limit: this.limitRecords, page: 1 });
      this.alertService.success(message);
    }
  }

  closeEditView() {
    this.dataVisibilitySchedule = 'hidden';
  }

  closeInviteDialog(event) {
    this.showReportsShare = event;
  }
  
  ngOnDestroy() {
    this._subscriptions.forEach(sub => sub.unsubscribe());
    this.reportSavedService.clearSavedReportData();
  }
}
