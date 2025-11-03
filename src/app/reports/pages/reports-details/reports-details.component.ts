import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { DownloadReportComponent } from '../../components/download-report/download-report.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReportsDetailsService } from '../reports-details/reports-details.service';
import { ConfirmationType, IDimensionData, ISavedReportData } from '../reports-details/reports-details.interfaces'
import { fromEvent, Observable, Subscription } from 'rxjs';
import { ChartTypes } from 'src/app/library/widget/widget.types';
import { FilterViewMode } from '../../components/filter-fields-sidepanel/filter-fields-sidepanel.interfaces';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { NavigationPaths } from '../../enums/report.enums';
import { ReportService } from '../../services/report.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Log } from 'src/app/library/logs/logs.model';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-reports-details',
  templateUrl: './reports-details.component.html',
  styleUrls: ['./reports-details.component.scss']
})
export class ReportsDetailsComponent implements OnInit, OnDestroy {
  scheduleVisibility = 'hidden';
  isOptionsMenu = false;
  isScheduleMenu = false;
  programId: string;
  isTableLoaded: boolean;
  isDataLoading: boolean;
  showDrop = false;
  selectedChart: ChartTypes;
  currentPageNumber = 1;
  isFilterSidebarActive = false;
  filterViewMode: FilterViewMode = FilterViewMode.Full;
  isFilterInfo = false;
  isSaveFilterMode = false;
  isScoreSidebarActive=false;
  reportName: string;
  resizeObservable$: Observable<Event>;
  reportCustomName: string;
  sortBy:string;
  sortType:string;
  public reportKeyParam: string;
  private isApplyFilterInit = false;
  private subscriptions: Subscription[] = [];
  logs:Log=undefined;

  constructor(
    private reportDetailsService: ReportsDetailsService,
    private reportService: ReportService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private loader: LoaderService,
    private _eventStrem:EventStreamService
  ) {
  }

  get tableConfig() {
    const config = this.reportDetailsService.tableConfig;
    const finalConfig = this.reportCustomName ? { ...config, title: this.reportCustomName } : config;
    // if (finalConfig?.title)
    //   finalConfig.title = this.formatTitle(finalConfig.title);
    return finalConfig;
  }

  get is_reportStatus() {
    return this.reportDetailsService.showOptions;
  }

  get tableData() {
    return this.reportDetailsService.reportData?.table_data;
  }

  get totalRecords() {
    return this.reportDetailsService.totalRecords;
  }

  get reportData() {
    return this.reportDetailsService.reportData;
  }

  get reportDimension() {
    return this?.reportDetailsService?.dimensionData[0]?.dimension_label;
  }

  get reportKey() {
    return this.reportDetailsService.reportKey;
  }

  get reportFilters() {
    return this.reportDetailsService.reportFilters;
  }

  get reportColumnList() {
    return this.reportDetailsService.getReportColumnList();
  }

  get chartData() {
    return this.reportDetailsService.chartData;
  }

  get dimensionData() {
    return this.reportDetailsService.dimensionData;
  }

  get searchTerm() {
    return this.reportDetailsService.searchTerm;
  }

  get itemsPerPage() {
    return this.reportDetailsService.itemsPerPage;
  }

  get selectedDimension() {
    return this.reportDetailsService.selectedDimension;
  }

  get isBaseReport() {
    return this.reportDetailsService.isBaseReport;
  }

  get isConfirmed() {
    return this.reportDetailsService.confirmationStatus.isConfirmed;
  }

  get confirmationMainMessage() {
    return this.reportDetailsService.confirmationStatus.mainMessage;
  }

  get confirmationSubMessage() {
    return this.reportDetailsService.confirmationStatus.subMessage;
  }

  get reportConfigData() {
    return this.reportDetailsService.reportConfigData;
  }

  set itemsPerPage(value: number) {
    this.reportDetailsService.itemsPerPage = value;
  }

  set searchTerm(value: string) {
    this.reportDetailsService.searchTerm = value;
  }

  set selectedReportFilters(value) {
    this.reportDetailsService.savedReportData.filterData = value;
  }

  set selectedDimension(value: IDimensionData) {
    this.reportDetailsService.selectedDimension = value;
  }

  ngOnInit(): void {
    this.reportCustomName = this.route.snapshot.queryParams.name;
    this.reportDetailsService.isSavedReport = !!this.route.snapshot.queryParams?.isSavedReport;
    this.reportService.updateCurrentProgram();
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (programDetails) {
      this.programId = programDetails.id;
    }
    this.subscriptions.push(this.route.paramMap.subscribe(param => { this.reportKeyParam = param.get('report') }));
    this.subscriptions.push(this.route.queryParams.subscribe(this.onQueryParamsHandler.bind(this)));

    this.subscriptions.push(this.reportDetailsService.isTableLoaded.subscribe(this.onTableLoadHandler.bind(this)));
    this.subscriptions.push(this.reportDetailsService.isDataLoading.subscribe(this.onDataLoadHandler.bind(this)));
    this.subscriptions.push(this.reportDetailsService.defaultDimension.subscribe(this.onSetDefaultDimentionHandler.bind(this)));


    // Report Filter New UI Changes
    if(this.reportKeyParam?.length != 36  &&  environment?.newReportFeatureAllowed ){
      this.reportDetailsService.getReportDataDefaultColumnList(this.reportKeyParam);
      this.onOpenFilterSidebar();
    }
    // end of Report Filter New UI Changes



    if (!this.isApplyFilterInit) {
      this.reportDetailsService.initReport(this.reportKeyParam);
    } else {
      this.isApplyFilterInit = false;
    }

    this.resizeObservable$ = fromEvent(window, 'resize');
    this.subscriptions.push(this.resizeObservable$.subscribe());
    this._eventStrem.on(Events.REPORT_DETAILS_LOGS).subscribe((data:any)=>{
      this.logs=data
    });
  }

  private onTableLoadHandler(value: boolean) {
    this.isTableLoaded = value;
    if (this.reportConfigData?.report_filters && typeof this.reportConfigData?.report_filters === 'object' && Object.keys(this.reportConfigData?.report_filters).length > 0)
      this.isFilterInfo = true;
  }

  private onDataLoadHandler(value: boolean) {
    this.isDataLoading = value;
  }

  private onSetDefaultDimentionHandler(value: IDimensionData) {
    if (value?.dimension_id) {
      this.selectedDimension = value;
      this.selectedChart = value.default_chart_type as ChartTypes;
    }
  }

  private onQueryParamsHandler(routeParams: Params) {
    if (routeParams.applyFilters) {
      this.isApplyFilterInit = true;
      this.isFilterInfo = true;
      this.reportDetailsService.applyReportFilterFromOutside(this.reportKeyParam);
    } else if (routeParams.showConfirmation) {
      this.reportDetailsService.showConfirmation(
        'Report Saved Successfully',
        'Your Report has been saved successfully, Now you can Schedule your Report',
        ConfirmationType.Save
      );
    }
    this.reportDetailsService.clearQueryParams(routeParams);
  }

  onViewSchedules() {

    const key = this.reportKeyParam;
    this.router.navigate([NavigationPaths.allScheduled()], { queryParams: { name: key, key } });
  }

  onSelectDimention(dimension: IDimensionData) {
    this.selectedDimension = dimension;
    if (this.selectedDimension?.dimension_id) {
      this.reportDetailsService.getChartData(this.reportKey, this.selectedDimension);
    }
  }

  resetDimension() {
    this.reportDetailsService.resetDimension();
  }

  isDimensionSelected() {
    return this.selectedDimension && this.selectedDimension.dimension_id;
  }

  onPaginationClick(pageNumber: number) {
    this.currentPageNumber = pageNumber;
    this.isDataLoading = true;
    this.reportDetailsService.getReportData(this.reportKey, this.currentPageNumber);
  }

  onChangeRecords(itemsPerPage: number) {
    this.itemsPerPage = itemsPerPage;
    this.isDataLoading = true;
    this.reportDetailsService.getReportData(this.reportKey, this.currentPageNumber);
  }

  onSearch(term) {
    if (term !== this.searchTerm) {
      this.searchTerm = term;
      this.isDataLoading = true;
      this.reportDetailsService.getReportData(this.reportKey);
    }
  }

  onClickedOutside(e) { }

  onOpenFilterSidebar(viewMode?: FilterViewMode) {
    if (viewMode) {
      this.filterViewMode = viewMode;
    } else {
      this.filterViewMode = FilterViewMode.Full;
    }
    this.isFilterSidebarActive = true;
  }
  onOpenScoreSidebar(){
    this.isScoreSidebarActive=true;
  }

  onCloseFilterSidebar(event?: any) {
    this.isFilterSidebarActive = false;
    if(event === false && environment?.newReportFeatureAllowed){
    this.router.navigate([NavigationPaths.root()]);
    }
  }


  onCloseScoreSidebar(){
    this.isScoreSidebarActive = false;
  }
  onSaveScoreConfiguration(){
    this.reportDetailsService.initReport(this.reportKeyParam);
    this.isScoreSidebarActive = false;
  }

  onApplyReportFilter(data: ISavedReportData) {
    this.onCloseFilterSidebar();
    this.isFilterInfo = true;
    this.reportDetailsService.applyReportFilter(data, this.reportKey);
  }

  onViewActiveFilters() {
    this.onOpenFilterSidebar(FilterViewMode.Full);
  }

  onClearAllFilters() {
    this.isFilterInfo = false;
    this.reportDetailsService.clearReportFilter(this.reportKey, this.reportConfigData?.has_chart ?? false);
  }

  onSaveMode() {
    this.reportName = null;
    this.isSaveFilterMode = !this.isSaveFilterMode;
  }

  onSaveClick() {
    if (this.reportName) {
      this.loader.show('Creating your custom report');
      const savedReportData: ISavedReportData = {
        reportName: this.reportName,
        columnList: this.reportDetailsService.savedReportData.columnList,
        filterData: this.reportDetailsService.savedReportData.filterData
      };
      this.onSaveReport(savedReportData);
      this.isSaveFilterMode = false;
    }
  }

  onSaveReport(reportData: ISavedReportData) {
    this.isFilterInfo = false;
    this.reportDetailsService.saveReport(this.reportKey, reportData);
    this.onCloseFilterSidebar();
  }

  onUpdateReport() {
    this.loader.show('Updating your custom report');
    this.reportDetailsService.updateReport();
    this.isFilterInfo = false;
  }

  onHideConfirmation() {
    this.reportDetailsService.hideConfirmation();
  }

  isConfirmationType(type: string) {
    return this.reportDetailsService.confirmationStatus.type === type as ConfirmationType;
  }

  closeScheduleView() {
    this.scheduleVisibility = 'hidden';
  }

  onClickView() { }


  onSortClick(ev) {
    if (ev) {
      this.sortBy = ev?.name;
      this.sortType = ev?.order;
      let filter=this.reportDetailsService.savedReportData.filterData  ? this.reportDetailsService.savedReportData.filterData : null ;
      this.reportDetailsService.initReport(this.reportKeyParam,this.sortBy,this.sortType,filter);
    }
  }




  onCreateClick() { }

  setActiveChart(chart: string) {
    this.selectedChart = chart as ChartTypes;
  }

  isChartVisible(chart: string) {
    const selectedChart = chart as ChartTypes;
    return this.selectedDimension.chart_types?.indexOf(selectedChart) !== -1 ? true : false;
  }

  isChartSelected(chart: string) {
    return this.selectedChart === chart as ChartTypes;
  }

  openDropdown() { }

  showDropdown() {
    this.showDrop = !this.showDrop;
  }
  onClickedOutsideDropdown(e) {
    this.showDrop = false;
  }

  onOptionsClick() {
    this.isOptionsMenu = !this.isOptionsMenu;
  }

  onScheduleClick() {
    this.isScheduleMenu = !this.isScheduleMenu;
  }

  onClickOutside(type: string) {
    if (type === 'schedule') {
      this.isScheduleMenu = false;
    } else if (type === 'options') {
      this.isOptionsMenu = false;
    }
  }

  onSaveClickOutside(event) {
    if (event) {
      let noReaction = false;
      const id = event?.target?.id;
      if (id
        && id === 'report-save-container'
        || id === 'report-save-input'
        || id === 'report-save-button'
      ) {
        noReaction = true;
      }
      if (!noReaction) {
        this.isSaveFilterMode = false;
      }
    }
  }

  openDownloadReportModal() {
    const modalRef = this.modalService.open(DownloadReportComponent);
    modalRef.componentInstance.reportKey = this.reportKey;
    modalRef.componentInstance.defaultColumnList = this.reportDetailsService.reportConfigData?.list_default_columns;
    modalRef.componentInstance.savedReportData = JSON.parse(JSON.stringify(this.reportDetailsService.savedReportData));
    modalRef.componentInstance.reportConfigData = this.reportDetailsService.reportConfigData;
  }

  formatTitle(title: any): any {
    title = title?.replaceAll('_', ' ').trim();
    return title?.split(' ')?.map(word => word?.charAt(0)?.toUpperCase() + word?.substr(1))?.join(' ');
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.reportDetailsService.clearReportData();
  }
}
