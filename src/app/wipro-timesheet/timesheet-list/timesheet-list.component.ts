import { Component, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { TimesheetService } from '../timesheet.service';
import { StorageKeys, StorageService } from '../../core/services/storage.service';
import { LoaderService } from '../../core/components/loader/loader.service';
import { AlertService } from '../../core/components/alert/alert.service';
import { errorHandler } from '../../shared/util/error-handler';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { TimesheetStatus, TimesheetConstants, UsersType } from '../timesheet.enums';
import { HttpService } from 'src/app/core/services/http.service';
import { environment } from 'src/environments/environment';
import { ConfigurationLoader } from 'src/app/configuration/configuration-loader.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/shared/enums';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
enum DataType {
  Filtered = 'filtered',
  All = 'all',
}
@Component({
  selector: 'app-timesheet-list',
  templateUrl: './timesheet-list.component.html'
})
export class TimesheetListComponent implements OnInit {
  subHeaderActionButtons= [
    { name: '', title: 'Bulk Approval', icon: '',  disabled: true },
  ];
  public isAllRecordsSelected: boolean  = false;
  public selectedTimesheetCount: number = 0;
  public excludeTimesheetIds = [];
  public selectedAllRecordsPage: number = 0;
  public selectPageData: boolean = false;
  public vmsData: any;
  dataLoading = true;
  public tableLoaded = false;
  public status: any;
  public totalRecords = 0;
  public itemPerPage = 10;
  enterTimesheet = 'hidden';
  timesheetData;
  searchTerm: '';
  configData: any = {};
  countData: number [];
  selectedTab: string = undefined;
  selectedTimesheets: any = [];
  selectedTimesheetData: any = [];
  selectedTimesheetIds:any = [];
  selectedRecords: any;
  pageNo: number = 0;
  public availableCountForSelect = 0;
  @Output() openSidePanel = new EventEmitter();
  private accountDetails = this.storageService.get('account');
  @ViewChild('timesheetTableRef') timesheetTableRef;
  sortObj: any;
  accuracyConfig = AccuracyConfigEnum;
  logs: Log= undefined; 
  private timesheetListSubscription: any;
  public downloadReportFormats = 
    {
      name: 'CSV',
      format: 'csv',
      icon: '/assets/images/file-types/csv.svg',
      type: 'application/vnd.csv',
      display: true,
      fileName: "timesheet_report",
    };
  public report_columns = ["timesheet_code", "assignment_code", "worker_name", "worker_id","start_date", "end_date", "location", "month", "number_of_days_worked", "total_hours", "submitted_date", "approved_reject_date", "status", "vendor", "timesheet_manager"];

  constructor(
    private _http: HttpService,
    private eventStream: EventStreamService,
    private timesheetService: TimesheetService,
    private storageService: StorageService,
    private loader: LoaderService,
    private alert: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private accuracyPipe: AccuracyPipe,
    private authorizationService: AuthorizationService,
    private confirmService: ConfirmationDialogService,
    private ConfigurationLoader: ConfigurationLoader,
    private localdatePipe: LocalDateFormatPipe
  ) { }
  tableConfig: VMSConfig = {
    permission: 'create_timesheet',
    title: 'Timesheet List',
    columnList: [],
    tabsList: ['All', 'Pending Approval', 'Approved', 'Rejected', 'Draft', 'Withdrawn', 'History', 'In-Progress'],
    showTabs: true,
    isExpand: false,
    isFilter: false,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isSelectSubmitButton: false,
    isSelectSubmitButtonName: 'Approve Timesheet',
    subHeaderActionButtons: this.subHeaderActionButtons,
    isCheckboxOption: false,
    selectAllRecordsFromBar: true,
    isDownloadButton: false,
    downloadOptions: { csvOption: false, excelOption: false, pdfOption: false}, //new flag
    isPendingReportButton: false,
    routeLinkOption: 'Pending Timesheet Report',
    routeLinkText: '/reports/details/pending_timesheet_report',
    isCreate: true,
    density: 'COMFORTABLE',
    tableWidth: '100%',
    advanceFilter: [
      { name: 'worker_name', title: 'Worker', filterType: 'TEXT' },
      {
        name: 'status', title: 'Status', filterType: 'SELECT', multiSelectData: [
          { name: 'APPROVED', value: 'Approved' },
          { name: 'PENDING', value: 'Pending' },
          { name: 'REJECTED', value: 'Rejected' },
          { name: 'DRAFT', value: 'Draft' },
          { name: 'WITHDRAWN', value: 'Withdrawn' },
          // { name: 'DEFERRED', value: 'Deferred' },
        ]
      },
      {
        name: 'assignment', title: 'Assignment Id', filterType: 'TEXT'
      },
      {
        name: 'work_period', title: 'Work Period', filterType: 'TEXT'
      },
    ]
    // tableWidth: '100%'
  };
  ngOnInit(): void {
    this.getAllCount();
    this.getConfigDetails();
    this.route.paramMap.subscribe(param => {
      let status = param.get('status') || 'all';
      if (status.toLowerCase() === TimesheetStatus.PENDING?.toLowerCase()) {
        this.status = 'pending approval';
        this.selectedTab = 'Pending Approval';
        this.tableLoaded = true;
        // this.tableConfig.isCheckboxOption = true;
      } else if (status.toLowerCase() === 'archive') {
        this.status = 'archive';
        this.selectedTab = 'History';
        this.tableLoaded = true;
      } else {
        if (status === 'create') {
          this.selectedTab = 'all';
          this.status = 'all';
          this.tableLoaded = true;
          setTimeout(() => {
            this.onCreateClick(true);
          }, 100);
        } else {
          const index = this.tableConfig?.tabsList?.findIndex(item => status?.toLowerCase() === item.toLowerCase());
          if (index === -1) {
            status = 'all';
          }
          this.selectedTab = status;
          this.status = status;
          this.tableLoaded = true;
        }
      }
    });
    this.addColumns(this.selectedTab);
  }

  hasTimesheetAccess(event){
    if(event){
      this.tableLoaded= false;
      this.logs = { type: LOG_TYPE.WARNING, heading: "User doesn’t have access to the Timesheet module.",  isShown: true, hideClose: true };
    }else{
      this.logs= undefined;
      this.tableLoaded= true;
    }
  }
  getAllCount() {
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const programId = programDetails?.id;
    const url = `/timesheet/programs/${programId}/timesheet/counts${this.searchTerm ? ('?search=' + this.searchTerm) : ''}`;
    this.timesheetService.get(url).subscribe(
      (data:any) => {
        // data?.data?.push({status: "in-progress", status_count: 1});
        this.countData = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        let allCount = 0;
        data?.data?.forEach(c => {
          const statusСount = parseInt(c?.status_count);
          if (c?.status?.toLowerCase() === TimesheetStatus?.BULK_PENDING) {
            this.availableCountForSelect = statusСount;
          }
          allCount += statusСount;
          this.tableConfig?.tabsList.forEach((tl, i) => {
            if (tl === 'Pending Approval') {
              tl = 'Pending';
            } else if (tl === 'History') {
              tl = 'archive';
            }
            if (tl?.toLowerCase() === c?.status?.toLowerCase()) {
              this.countData.splice(i, 1, statusСount);
            }
          });
        });
        // this.countData[0] = allCount;
        // hide In Prgress tab if status In Prgress not coming in response.
        const progressIndex = data?.data?.findIndex((e) => e?.status?.toLowerCase() === TimesheetStatus?.IN_PROGRESS);
        const progressCount = data?.data?.find((ip) => ip?.status?.toLowerCase() === TimesheetStatus?.IN_PROGRESS)?.status_count;
        if (progressIndex === -1 || !progressCount) {
          const tabIndex = this.tableConfig?.tabsList?.findIndex((e) => e?.toLowerCase() === TimesheetStatus?.IN_PROGRESS);
          if (tabIndex !== -1) {
            this.tableConfig?.tabsList.splice(tabIndex, 1);
            this.countData?.splice(tabIndex, 1);
          }
        }

        // hide draft tab if status draft not coming in response.
        const statusIndex = data?.data?.findIndex((e) => e?.status?.toLowerCase() === TimesheetStatus?.DRAFT);
        if (statusIndex === -1) {
          const tabIndex = this.tableConfig?.tabsList?.findIndex((e) => e?.toLowerCase() === TimesheetStatus?.DRAFT);
          if (tabIndex !== -1) {
            this.tableConfig?.tabsList.splice(tabIndex, 1);
            this.countData?.splice(tabIndex, 1);
          }
        }
      });
  }

  onSortClick(event) {
    if (!!event) {
      this.sortObj = event;
      this.getTimesheetList(1);
    }
  }

  // added for V2M-28485
  updateColumnProperties(column, isBulkApprovalAllowed) {
    if (column) {
      column.isPending = isBulkApprovalAllowed;
      column.isDoNotRehire = isBulkApprovalAllowed;
      column.toolTipVisibility = !isBulkApprovalAllowed;
    }
  }

  getTimesheetList(pageNo = 1) {
    // this.loader.show();
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const programId = programDetails.id;
    let url = '';
    if (this.status && this.status !== undefined && this.status?.length > 0 && this.status?.toLowerCase() !== 'all') {
      this.status = this.status.toLowerCase();
      if (this.status === 'pending approval') {
        this.status = 'pending';
      } else if (this.status === 'history') {
        this.status = 'archive';
      }
      url = `/timesheet/programs/${programId}/timesheet?${this.status ? ('status=' + this.status) : ''}&page=${pageNo}&limit=${this.itemPerPage}${this.searchTerm ? ('&search=' + this.searchTerm) : ''}`;
    } else {
      url = `/timesheet/programs/${programId}/timesheet?page=${pageNo}&limit=${this.itemPerPage}${this.searchTerm ? ('&search=' + this.searchTerm) : ''}`;
    }
    if (this.sortObj) {
      url += `${(this.sortObj.order) ? this.sortObj.order === 'DESC' ? '&order_by=desc' : '&order_by=asc' : ""}`;
      url += this.sortObj.name ? `&key=${this.sortObj.name}` : "";
    }
    if (this.timesheetListSubscription) {
      this.timesheetListSubscription.unsubscribe();
    }
    this.timesheetListSubscription = this.timesheetService.get(url).subscribe((data:any) => {
      if (data) {
        // this.loader.hide();
        this.dataLoading = false;
        let timesheets = [];
        // Show checkboxes and mass approval button
        const timesheetWorkerColumn = this.tableConfig.columnList.find(column => column?.name === 'worker_name');
        if (data?.data?.actions_allow?.bulk_approval?.is_allow === true) {
          this.updateColumnProperties(timesheetWorkerColumn, true);
          this.tableConfig.isCheckboxOption = true;
          this.subHeaderActionButtons = [{ name: '', title: 'Bulk Approval', icon: '', disabled: true }]
        } else {
          this.updateColumnProperties(timesheetWorkerColumn, false);
          this.tableConfig.isCheckboxOption = false;
          this.subHeaderActionButtons = [];
        }
        // End
        if (data?.data?.timesheet) {
          if(this.availableCountForSelect){
            this.availableCountForSelect = this.availableCountForSelect;
          }
          this.totalRecords = data.data?.pagination?.total_records ? data.data?.pagination?.total_records : 0;
          this.timesheetData = data?.data?.timesheet;
          data?.data?.timesheet?.forEach((item,i) => {
            let title: string = item?.assignment_title || '';
            if (item?.assignment_code) {
              title += ' (' + item?.assignment_code + ')';
            }
            if(item?.status === 'in-progress'){
              item.status = 'in progress';
            }
            const work_period = this.timesheetService?.getFormattedDate(item?.start_date, item?.end_date, item?.meta_data?.layout?.duration);
            const consolidated_date = item?.consolidated_date ? this.localdatePipe.transform(item?.consolidated_date,'','','',true) : item?.consolidated_date;
            // Tooltip and checkbox disable
            item.disableCheckbox = (item?.actions?.mass_approval && !item?.actions?.mass_approval?.can_process) || false;
            item.tooltip = item?.actions?.mass_approval?.reason || '';

            const timesheet = {
              ...item,
              code: item?.code,
              timesheet_manager_name: item?.timesheet_manager?.name ?
                this.removeUnwanted(item?.timesheet_manager?.name)
                : item?.timesheet_manager?.name,
                worker_name: (this.tableConfig.isCheckboxOption && item?.actions?.mass_approval) ? {
                  name: this.capitalizeWords(this.removeUnwanted(item?.user?.name)),
                  hasNotification: (item?.actions?.mass_approval && !item?.actions?.mass_approval?.can_process),
                  do_not_re_hire: (item?.actions?.mass_approval && !item?.actions?.mass_approval?.can_process),
                  pendingRequestType: item?.actions?.mass_approval?.reason || '',
                  icon: 'info',
                  tooltipPlacement: 'right'
              } : this.capitalizeWords(this.removeUnwanted(item?.user?.name)) || '',
              id: item?.id,
              work_period,
              consolidated_date,
              assignment: title,
              days: item?.total_days,
              total_hours: item?.total_hours ? this.accuracyPipe?.transform(item?.total_hours,this.accuracyConfig.HOUR) : '0',
              total_billable_amount: item?.total_amount ? this.accuracyPipe?.transform(item?.total_amount,this.accuracyConfig.AMOUNT, {currencyCode: item?.currency}) : '-',
              manager: item?.timesheet_manager
            };
            timesheets.push(timesheet);

          });
        }
      // check uncheck timesheet
      let count = 0;
      this.selectedTimesheets?.forEach((timesheet_uuid) => {
        timesheets?.forEach((timesheetDetail) => {
          if (timesheetDetail?.timesheet_uuid === timesheet_uuid) {
            count = count + 1;
          } else if (this.selectedTimesheets?.length) {
            this.selectedTimesheets?.forEach((timesheet) => {
              timesheets?.forEach((timesheetIds) => {
                if (timesheetIds?.timesheet_uuid === timesheet?.timesheet_uuid) {
                  if(!timesheetIds?.disableCheckbox){
                    timesheetIds.isChecked = true;
                  }
                }
              });
            });
          }
        })
      })
      if (this.selectedRecords) {
        let count = this.selectedRecords - ((this.pageNo - 1) * this.itemPerPage)
        if(this.selectPageData) count = this.itemPerPage;
        if(this.selectedAllRecordsPage !== this.pageNo && this.selectPageData) return;
        timesheets?.forEach((timesheetDetail, ind) => {
          if (this.excludeTimesheetIds?.length) {
              let timesheetCount = 0;
              this.excludeTimesheetIds?.forEach((id, ind) => {
                if (id === timesheetDetail?.timesheet_uuid) {
                  timesheetCount = timesheetCount + 1;
                }
                if (!timesheetCount && (ind + 1) === this.excludeTimesheetIds?.length) {
                  if(!timesheetDetail?.disableCheckbox){
                    timesheetDetail.isChecked = true;
                  }
                } else {
                  timesheetDetail.isChecked = false;
                }
              })
          } else if ((ind < count) || (this.isAllRecordsSelected && this.excludeTimesheetIds?.length === 0)) {
            if(!timesheetDetail?.disableCheckbox){
              timesheetDetail.isChecked = true;
            }
          }
        });
      } else if (this.selectedTimesheets?.length) {
        this.selectedTimesheets?.forEach((timesheet_uuid) => {
          timesheets?.forEach((timesheetIds) => {
            if (timesheetIds?.timesheet_uuid === timesheet_uuid) {
              if(!timesheetIds?.disableCheckbox){
                timesheetIds.isChecked = true;
              }
            }
          });
        });
      }

        this.vmsData = { timesheet: timesheets };
        const timesheetRouteId = this.route?.snapshot?.params.timesheetId;
        if (timesheetRouteId) {
          const event = timesheets.find(elem => elem?.timesheet_uuid === timesheetRouteId);
          this.onClickView(event);
        }
        const isCreation = this.route?.snapshot?.params?.isCreation;
        if (isCreation) {
          this.onCreateClick(isCreation)
        }
        this.tableLoaded = true;
        if (this.status === TimesheetStatus.PENDING && this.vmsData?.timesheet?.length > 0 && (this.accountDetails?.organization?.category?.toUpperCase() === 'CLIENT' || this.accountDetails?.organization?.category?.toUpperCase() === 'SUPER_ORG')) {
          // Commented due to backed Dependancy
          // this.tableConfig.isCheckboxOption = true;
          this.tableConfig.isDownloadButton = true;
          this.tableConfig.downloadOptions = { csvOption: true, excelOption: false, pdfOption: false}, //new flag
          this.tableConfig.isPendingReportButton = true;
        } else {
          // this.tableConfig.isCheckboxOption = true;
          this.tableConfig.isDownloadButton = false;
          this.tableConfig.isPendingReportButton = false;
        }
        if(this.status === TimesheetStatus?.APPROVED && (this.accountDetails?.organization?.category?.toUpperCase() === UsersType?.MSP || this.accountDetails?.organization?.category?.toUpperCase() === UsersType?.CLIENT)){
          this.tableConfig.isDownloadButton = true;
          this.tableConfig.downloadOptions = { csvOption: true, excelOption: false, pdfOption: false}, //new flag
          this.tableConfig.isPendingReportButton = false;
          this.tableConfig.isCheckboxOption = false;
        }

        if (this.selectedRecords && this.isAllRecordsSelected && this.excludeTimesheetIds) {
          this.excludeTimesheetIds?.forEach((timesheet) => {
            timesheets?.forEach((timesheetIds) => {
              if (timesheetIds?.timesheet_uuid === timesheet) {
                timesheetIds.isChecked = false;
              }
            });
          });
        }

        // if (this.selectedRecords) {
        //   let count = this.selectedRecords;
        //   timesheets?.forEach((timesheetIds, ind) => {
        //       if (ind < count) {
        //         timesheetIds.isChecked = true;
        //       }
        //     });
        // }



      }


    },
      (err) => {
        // this.loader.hide();
        this.dataLoading = false;
        this.alert.error(errorHandler(err));
      });
  }

  onSelectedAllRecordsPage(event) {
    this.selectedAllRecordsPage = event;
  }


  onselectAllClick(event) {
    // this.selectedTimesheets = new Array();
    if (event?.selected?.filter((val) => !val?.disableCheckbox && val?.isChecked === false).length == this.vmsData?.timesheet.filter(x => !x?.disableCheckbox).length) {
      let timesheetIds = event?.selected?.filter(x => this.selectedTimesheets?.includes(x.timesheet_uuid));
      timesheetIds?.forEach((id) => this.selectedTimesheets?.splice(id, 1));
      let allTimesheetIds = event?.selected?.filter(t => !t.disableCheckbox)?.map(x => x?.timesheet_uuid);
      allTimesheetIds?.forEach((allTimesheetId) => {
        if (this.isAllRecordsSelected) {
          if (this.excludeTimesheetIds?.indexOf(allTimesheetId) === -1) {
            this.excludeTimesheetIds = [...this.excludeTimesheetIds, allTimesheetId];
          }
        }
        this.selectedTimesheets?.splice(this.selectedTimesheets?.findIndex(ts => ts?.timesheet_uuid == allTimesheetId), 1);
        this.selectedTimesheetIds?.splice(allTimesheetId, 1)
      })
      // this.selectedTimesheetCount = this.selectedTimesheets?.filter((val) => val?.isChecked === true)?.length;
      this.selectedTimesheetCount = event?.selected?.filter((val) => val?.isChecked === true)?.length;
    }
    else {
      if (typeof (event?.selected[0]) === 'object') {
        let timesheets = event?.selected.map(x => !x?.disableCheckbox  ? x : undefined).filter((val) => !!val);
        timesheets?.forEach((timesheet) => {
          if (this.isAllRecordsSelected) {
            if (this.excludeTimesheetIds?.indexOf(timesheet?.timesheet_uuid) === -1) {
              if (timesheet?.disableCheckbox === false && timesheet?.isChecked === false) {
                this.excludeTimesheetIds = [...this.excludeTimesheetIds, timesheet?.timesheet_uuid];
              }
            } else {
              this.excludeTimesheetIds?.splice(this.excludeTimesheetIds?.indexOf(timesheet?.timesheet_uuid), 1);
            }
            // this.excludeTimesheetIds.splice(this.excludeTimesheetIds.indexOf(timesheet?.timesheet_uuid), 1);
          }
          if (this.selectedTimesheets?.findIndex(selected=> selected?.timesheet_uuid === timesheet?.timesheet_uuid) === -1) {
            this.selectedTimesheets = [...this.selectedTimesheets, timesheet];
            this.selectedTimesheets = [...new Map(this.selectedTimesheets?.map((item) => [item["timesheet_uuid"], item])).values()]; // to take unique
            this.selectedTimesheetIds = [...this.selectedTimesheets?.map(ts=> ts?.timesheet_uuid)];
          } else {
            if (event?.selected?.filter((val) => val?.isChecked).length > this.itemPerPage) {
              this.selectedTimesheets?.splice(this.selectedTimesheets?.findIndex(ts => ts?.timesheet_uuid == timesheet?.timesheet_uuid), 1);
              this.selectedTimesheetIds?.splice(this.selectedTimesheetIds?.indexOf(timesheet?.timesheet_uuid), 1);
            }
          }
        })
        // let allTimesheetIds = event?.selected?.map(x => x?.timesheet_uuid);
        // allTimesheetIds?.forEach((allTimesheetId) => {
        //   allTimesheetId?.forEach((id) => {
        //     if (this.excludeTimesheetIds.indexOf(id) !== -1 && this.isAllRecordsSelected) {
        //       this.excludeTimesheetIds.splice(this.excludeTimesheetIds.indexOf(id), 1);
        //     }
        //   })
        //   if (this.selectedTimesheetIds?.indexOf(allTimesheetId) === -1) {
        //     this.selectedTimesheetIds = [...this.selectedTimesheetIds, ...allTimesheetId];
        //   } else {
        //     if (event?.selected?.filter((val) => val?.isChecked).length > this.itemPerPage) {
        //       this.selectedTimesheetIds?.splice(this.selectedTimesheetIds?.indexOf(allTimesheetId), 1);
        //     }
        //   }
        // })

      }
      else {
        this.selectedTimesheetIds = this.selectedTimesheetIds?.filter(x => event?.selected?.includes(x));
        this.selectedTimesheets = this.selectedTimesheets?.filter(x => event?.selected?.includes(x?.timesheet_uuid));
        this.excludeTimesheetIds = [];
      }
      if (typeof (this.selectedTimesheets[0]) === 'object') {
        this.selectedTimesheetCount = this.selectedTimesheets?.filter((val) => val?.isChecked === true)?.length;
      }
      else {
        // this.selectedTimesheetCount = this.selectedTimesheets?.length;
        this.selectedTimesheetCount = this.selectedTimesheets?.length;
      }
    }
    // if (this.selectedTimesheets?.length > 0) {
    //   this.subHeaderActionButtons.map(x => {
    //     if (x?.title?.toLowerCase() === IndividualInvoiceHeaderButton?.ConsolidateInvoice?.toLowerCase()) {
    //       x.disabled = false;
    //     }
    //     return x;
    //   });
    //   this.tableConfig.headerActionButtons = [...this.headerActionButtons];
    // } else {
    //   this.subHeaderActionButtons.map(x => {
    //     if (x?.title?.toLowerCase() === IndividualInvoiceHeaderButton?.ConsolidateInvoice?.toLowerCase()) {
    //       x.disabled = true;
    //     }
    //     return x;
    //   });
    //   this.tableConfig.headerActionButtons = [...this.headerActionButtons];
    // }
  }

  capitalizeWords(string) {
    return string?.replace(/(?:^|\s)\S/g, function (a) { return a?.toUpperCase(); });
  };

  onClickRecords(event) {
    this.dataLoading = true;
    this.itemPerPage = event;
    this.getTimesheetList();
  }

  removeUnwanted(str) {
    const regex = /\bMR\b|\bMrs\b|\bMr\b|\bMiss\b|\bDr\b|\bProf\b|\bMX\b|\bIND\b|\bMisc\b|\bJr\b|\bSr\b|\bIII\b|\bIV\b|\bV\b/g;
    str?.replace(regex, '');
    return str.replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
  }

  onPaginationClick(e) {
    this.dataLoading = true;
    this.pageNo = e;
    this.getTimesheetList(e);
  }

  onClickView(event) {
    this.storageService.set(TimesheetConstants.TIMESHEET, event, true);
    const route = this.timesheetService.getTimesheetNavigationRoute(this.configData, event);
    this.router.navigate([route]);
  }

  onCreateClick($event) {
    if ($event) {
      this.eventStream.emit(new EmitEvent(Events.ENTER_TIMESHEET, true));
    }
  }

  onSearch(term) {
    if (term !== this.searchTerm) {
      this.searchTerm = term;
      this.getTimesheetList();
      this.getAllCount();
    }
  }

  onTabClick(e) {
    this.resetData();
    if (e) {
      if (typeof (e) === 'object') {
        return;
      } else {
        let route = e?.toLowerCase();
        if (route === 'pending approval') {
          route = 'pending';
        } else if (route === 'history') {
          route = 'archive';
        }
        if (route === 'pending') {
          // this.tableConfig.isCheckboxOption = true;
        }
        else {
          this.tableConfig.isCheckboxOption = false;
        }
        this.dataLoading = true;
        this.addColumns(route);
        this.location.replaceState(`/timesheet/list/${route}`);
        this.status = e;
        this.getAllCount();
        // this.getTimesheetList();
        this.getConfigDetails();
      }
    }
  }
  addColumns(tab) {
    tab = tab?.toLowerCase();
    if(tab === 'all' || tab === 'approved') {
      this.tableConfig.columnList = [
        { name: 'worker_name', title: 'Worker Name', width: 20, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, toolTipVisibility: true },
        { name: 'status', title: 'Status', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
        { name: 'code', title: 'Timesheet ID', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
        { name: 'work_period', title: 'Work Period', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'assignment', title: 'Assignment Title(ID)', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isOpenView: true, permission: 'view_assignment' },
        { name: 'consolidated_code', title: 'Consolidated Code', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
        { name: 'consolidated_date', title: 'Consolidated Date', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
        { name: 'timesheet_manager_name', title: 'Timesheet Manager', width: 15, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, isManagerList:true },
        { name: 'days', title: 'Days', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'total_hours', title: 'Hours', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
        { name: 'total_billable_amount', title: 'Total Billable Amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
        { name: 'hierarchy.name', title: 'Hierarchy', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true },
        // { name: 'sourcing_model', title: 'Sourcing Model', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'work_location.name', title: 'Work Location', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true }
      ];
    } else {
      this.tableConfig.columnList = [
      { name: 'worker_name', title: 'Worker Name', width: 20, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, toolTipVisibility: true },
      { name: 'status', title: 'Status', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
      { name: 'code', title: 'Timesheet ID', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
      { name: 'work_period', title: 'Work Period', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'assignment', title: 'Assignment Title(ID)', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isOpenView: true, permission: 'view_assignment' },
      { name: 'timesheet_manager_name', title: 'Timesheet Manager', width: 15, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true,isManagerList: true },
      { name: 'days', title: 'Days', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'total_hours', title: 'Hours', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
      { name: 'total_billable_amount', title: 'Total Billable Amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
      { name: 'hierarchy.name', title: 'Hierarchy', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true },
      // { name: 'sourcing_model', title: 'Sourcing Model', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true },
      { name: 'work_location.name', title: 'Work Location', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true }
    ];
    }
  }

  getConfigDetails() {
    this.timesheetService.getConfigDetails(undefined).subscribe((data:any) => {
      if (data?.data) {
        this.getTimesheetList();
        this.configData = data.data;
        const amountIndex = this.tableConfig.columnList.findIndex((e) => e.name === 'total_billable_amount');
        const daysIndex = this.tableConfig.columnList.findIndex((e) => e.name === 'days');
        if (!this.configData?.is_enable_amount_visibility) {
          this.tableConfig.columnList.splice(amountIndex, 1);
        }
        if (!this.configData?.is_enable_day_visibility) {
          this.tableConfig.columnList.splice(daysIndex, 1);
        }
        if (!this.configData?.is_enable_hour_visibility) {
          const hoursIndex = this.tableConfig.columnList.findIndex((e) => e.name === 'total_hours');
          this.tableConfig.columnList.splice(hoursIndex, 1);
        }
      }
    },
      (err) => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
      });
  }


  viewSidePanel(ev) {
    if (this.authorizationService.authorize('view_assignment')) {
      this.eventStream.emit(new EmitEvent(Events.VIEW_ASSIGNMENT_TIMESHEET, { value: true, data: ev }));
    }
  }
  // on clicking select all not using
  /* selectAllClicked(data) {
    if (data.selected.filter((val) => val?.isChecked === false).length == this.vmsData?.timesheet?.length) {
      let timesheetIds = data.selected.filter(x => this.selectedTimesheets.map(x => x?.timesheet_uuid).includes(x?.timesheet_uuid));
      timesheetIds.forEach((timesheet) => {
        if (this.excludeTimesheetIds.indexOf(timesheet) === -1 && this.isAllRecordsSelected) {
          this.excludeTimesheetIds = [...this.excludeTimesheetIds, ...timesheet];
        }
        this.selectedTimesheets.splice(timesheet, 1)
      });
      timesheetIds.forEach((timesheet) => this.selectedTimesheetIds.splice(this.selectedTimesheetIds.findIndex(x => x === timesheet.timesheet_uuid).length, 1));
    }
    else {
      if (typeof (data.selected[0]) === 'object') {
        data.selected.forEach((timeSheet) => {
          if (this.selectedTimesheets.length) {
            if (this.selectedTimesheets.filter((val) => val.timesheet_uuid === timeSheet.timesheet_uuid).length === 0) {
              this.selectedTimesheets.push(timeSheet);
              this.selectedTimesheetIds.push(timeSheet.timesheet_uuid);
            }
            if (this.excludeTimesheetIds.indexOf(timeSheet) !== -1 && this.isAllRecordsSelected) {
              this.excludeTimesheetIds.splice(this.excludeTimesheetIds.indexOf(timeSheet), 1);
            }
          }
          else {
            this.selectedTimesheets.push(timeSheet);
            this.selectedTimesheetIds.push(timeSheet.timesheet_uuid);
          }
        })
      } else {
        this.selectedTimesheets = this.selectedTimesheets.filter((val) => data.selected.includes(val?.timesheet_uuid && !val?.disableCheckbox));
        this.selectedTimesheetIds = this.selectedTimesheetIds.filter(x => data.selected.includes(x));
      }
    }
    if (this.selectedTimesheets?.length > 0) {
      this.tableConfig.isSelectSubmitButton = false;
    } else {
      this.tableConfig.isSelectSubmitButton = false;
    }
  } */
  // on checking/ unchecking timesheet
  selectClicked(data) {
    const timesheetArr = [...this.selectedTimesheets];
    this.selectedTimesheetCount = data?.selected?.isChecked ? this.selectedTimesheetCount + 1 : this.selectedTimesheetCount - 1;
    if (!data?.selected?.isChecked && timesheetArr) {
      const item = timesheetArr?.filter((s) => s?.timesheet_uuid === data?.selected?.timesheet_uuid);
      if (item) {
        timesheetArr?.splice(timesheetArr?.findIndex(timesheet => timesheet?.timesheet_uuid === data?.selected?.timesheet_uuid), 1);
        if (this.isAllRecordsSelected) {
          if (this.excludeTimesheetIds?.findIndex(exId=> exId === data?.selected?.timesheet_uuid) === -1) {
            this.excludeTimesheetIds = [...this.excludeTimesheetIds, data?.selected?.timesheet_uuid];
          }
      }} else {
        timesheetArr.push(item);
        this.selectedTimesheets = timesheetArr;
      }
      // this.selectedTimesheets = timesheetArr;
        } else {
      timesheetArr?.push(data?.selected);
      this.selectedTimesheets = timesheetArr;
      // this.selectedTimesheets = [...this.selectedTimesheets, data?.selected];
      if (this.isAllRecordsSelected)
      {
        this.excludeTimesheetIds?.splice(this.excludeTimesheetIds?.findIndex(exId=> exId === data?.selected?.timesheet_uuid), 1);
      }
    }
    this.selectedTimesheets = timesheetArr;
    if (this.selectedTimesheets?.length > 0) {
      this.tableConfig.isSelectSubmitButton = false;
    } else {
      this.tableConfig.isSelectSubmitButton = false;
    }
    this.selectedTimesheetIds = [...this.selectedTimesheets.map(ts=> ts?.timesheet_uuid)];
  }
  onAllRecordsSelected(event){
    this.isAllRecordsSelected = event;
  }

  selectedRecord(event){
    this.isAllRecordsSelected = event;
    this.selectedRecords = event;
    this.selectedTimesheetCount = event;
  }

  /* onMassApproval(eve) {
    this.confirmService.confirm('', `Are you sure you want to approve selected timesheets ? `,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.loader.show();
          this.selectedTimesheets.forEach(element => {
            if (element?.isChecked) {
              this.selectedTimesheetData.push({ entity_id: element?.timesheet_uuid, status: TimesheetStatus.APPROVED?.toUpperCase() });
            }
          });
          // const payload = {
          //   approval_reason: null,
          //   approval_notes: null,
          //   entity_ids: this.selectedTimesheetData,
          //   status: TimesheetStatus.APPROVED
          // };
          this.timesheetService.massApproval(this.selectedTimesheetData).subscribe(data => {
            if (data) {
              this.loader.hide();
              this.alert.success('Approved Successfully');
              this.resetSelectedTimesheets();
            }
          },
            (err) => {
              this.loader.hide();
              if (err?.error?.error) {
                this.alert.error(err?.error?.error);
              } else {
                this.alert.error(errorHandler(err));
              }
              this.resetSelectedTimesheets();
            });
        } else {
          this.resetSelectedTimesheets();
        }
      })
      .catch(() => {

      });
  } */

  bulkApproval(value) {
    let payload = {
      "action": "APPROVED",
      "process": this.isAllRecordsSelected ? 'all' : 'uuids',
      "search": this.searchTerm || null,
      "filter": null,
      "timesheet_uuids": [],
      "exclude_timesheet_uuids": []
    }
    if (this.isAllRecordsSelected) {
      // payload.exclude_timesheet_uuids = this.excludeTimesheetIds?.map(data => data?.timesheet_uuid);
      payload.exclude_timesheet_uuids = this.excludeTimesheetIds;
      delete payload?.timesheet_uuids;
    } else {
      if (this.selectedTimesheets?.length) {
        let data: any = this.selectedTimesheets?.map(data => data?.timesheet_uuid || data);
        const timesheet_uuids = Array?.from(new Set(data?.map(a => a))).map(id => {
          return data?.find(a => a === id)
        })
        payload.timesheet_uuids = timesheet_uuids;
      }
      delete payload?.exclude_timesheet_uuids;
    }
    this.confirmService.confirm('', `Are you sure you want to proceed with bulk approval for the timesheet(s)?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.timesheetService.bulkApproval(payload).subscribe((data:any) => {
            if (data) {
              this.loader.hide();
              this.alert.success(data?.message);
              this.router.navigateByUrl('/RefreshComponent', { skipLocationChange: true }).then(() => {
                this.router.navigate(['timesheet/list/in-progress']);
              });
            }
          },
            (err) => {
              this.loader.hide();
              if (err?.error?.error) {
                this.alert.error(errorHandler(err));
              } else {
                this.alert.error(errorHandler(err));
              }
              this.resetSelectedTimesheets();
            });
        } else {
          // this.resetSelectedTimesheets();
        }
      })
      .catch(() => {

      });
  }

  resetSelectedTimesheets() {
    this.getTimesheetList();
    this.getAllCount();
    this.resetData();
  }
  resetData() {
    this.tableConfig.isSelectSubmitButton = false;
    this.selectedTimesheets = [];
    this.selectedTimesheetData = [];
    this.timesheetTableRef?.resetTimesheetCheckboxes();
  }

  public downloadReport() {
    let blob;
    let filename: string;
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const programId = programDetails.id;
    const payLoad = {
      chart_by: "Category",
      chart_image: "",
      report_columns: this.report_columns,
      report_data_type: DataType?.Filtered,
      report_filters: { "status": [TimesheetStatus.APPROVED?.toLowerCase()] },
      report_format: this.downloadReportFormats?.format,
      report_name: this.downloadReportFormats?.fileName
    };
    const base_url= this.ConfigurationLoader?.getConfiguration()?.REPORT_API_ENDPOINT || environment.REPORT_API_ENDPOINT;
    this._http.downloadPostBlob(`/report/programs/${programId}/downloadreport`, payLoad, base_url).subscribe(
      data => {
        const isDownloadRoute = this.route.snapshot.queryParams['download'];
        blob = new Blob([data], { type: this.downloadReportFormats?.format });
        filename = this.downloadReportFormats?.fileName + '.' + this.downloadReportFormats?.format;
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
      })
  }
  onDownloadClick(value) {
    if (value === this.downloadReportFormats?.format) {
      this.downloadReport();
    } else {
      const url = `/reports/details/pending_timesheet_report?download=${value}`;
      window.open(url, '_blank');
    }
  }
}
