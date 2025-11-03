import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Subject, Subscription, debounceTime, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { ITableOptions, IAdvanceFilterConfig, ITableHeaderConfig, ITablePaginationConfig, IColoumnDefinition, IActionLinks, FilterType, ColumnType } from 'src/app/library/svms-table/svms-table.model';
import { NotificationConfigService } from 'src/app/program-setup/notification-config/notification-config.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';


interface EmailQuery {
  term: string,
  page: number,
}

@Component({
  selector: 'app-notification-log',
  templateUrl: './notification-log.component.html',
  styleUrls: ['./notification-log.component.scss']
})
export class NotificationLogComponent implements OnInit, OnDestroy {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('recipient', {static: true}) recipientTemplate: TemplateRef <any>;
  @ViewChild('status', {static: true}) statusTemplate: TemplateRef <any>;
  @ViewChild('subject', {static: true}) subjectTemplate: TemplateRef <any>;
  @ViewChild('traceId', {static: true}) traceTemplate: TemplateRef <any>;

  private subscriptions: Array<Subscription> = [];
  private emailSubject: Subject<any> = new Subject<any>();
  private prevEmailQuery: EmailQuery = { term: '', page: 1 };

  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];
  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;
  public actionLinks: Array<IActionLinks> = [];

  public showPopup: boolean = false;
  public subjectCache: string = null;
  public emailCache: string = null;
  public filterQuery: any = null;
  public dateFormat:any;
  currentProgram:any;

  constructor(
    private notificationService: NotificationConfigService,
    private storageService: StorageService,
    private loader: LoaderService,
    private alert: AlertService,
    private datePipe: LocalDateFormatPipe
  ) { }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.dateFormat = this.currentProgram.defaultDateFormat.toUpperCase();
    this.initializeTable();

    // Initialize jnotification tracker
    this.notificationService.loadNotificationAuthDetails().subscribe((res: any) => {
      this.initializeAPI();
      this.emailSubject.next(this.prevEmailQuery);
    });
  }

  initializeTable = (): void => {

    this.tableFilterConfig = [{
      name: 'fullName',
      type: FilterType.TEXT,
      title: 'user',
      placeholder: 'Recipient Name/Email',
    }, {
      name: 'status',
      type: FilterType.SELECT,
      title: 'status',
      placeholder: 'Select Status',
      options: [
        { name: 'Success', value: 'COMPLETED' },
        { name: 'Failure', value: 'ERROR,FAILED' },
        { name: 'Blocked', value: 'BLOCKED' },
      ],
    }, {
      name: 'newNotificationDate',
      type: FilterType.DATEPICKER,
      title: 'date_range',
      placeholder: 'Last 7 Days',
      config: {
        language: 'English',
        format12h: true,
        range: true,
      },
      dateChanged: this.dateChanged
    }, {
      name: 'groupName',
      type: FilterType.TEXT,
      title: 'module',
      placeholder: 'Module Name',
    }, {
      name: 'subject',
      type: FilterType.TEXT,
      title: 'subject',
      placeholder: 'Subject Description',
    }, {
      name: 'traceId',
      type: FilterType.TEXT,
      title: 'trace_id',
      placeholder: 'Tracking ID',
    }];

    this.tableHeaderConfig = {
      title: 'Notification Log',
      searchAllowed: false,
      showAddBtn: false,
      advanceFilter: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onColumnFilter
    };

    // Pagination configuration
    this.tablePaginationConfig = {
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged
    };

    this.tableColumnConfig = [
      { field: 'fullName', header: 'Recipient', width: 24, primary: true, order: 1, sortable: true, templateRef: this.recipientTemplate },
      { field: 'status', header: 'Status', width: 6, primary: false, order: 2, sortable: true, templateRef: this.statusTemplate },
      { field: 'newNotificationDate', header: 'Sent', width: 6, primary: false, order: 3, sortable: true, type: ColumnType.DATETIME },
      { field: 'groupName', header: 'Module', width: 6, primary: false, order: 4, sortable: true },
      { field: 'subject', header: 'Subject', width: 8, primary: false, order: 5, sortable: true, templateRef: this.subjectTemplate },
      { field: 'traceId', header: 'Tracking ID', width: 6, primary: false, order: 5, sortable: true, templateRef: this.traceTemplate },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Notification Logs Found",
      actionLinks: this.actionLinks,
      enableColumnFilter: true
    };
  }

  onPaginationClick = (page: number) => {
    this.emailSubject.next({ ...this.prevEmailQuery, page });
  }

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.emailSubject.next({ ...this.prevEmailQuery, page: 1 });
  }

  onColumnFilter = (evt: any) => {
    this.filterQuery = evt;
    this.emailSubject.next({ term: '', page: 1 });
  }

  initializeAPI() {
    this.subscriptions.push(
      this.emailSubject.pipe(
        debounceTime(400),
        switchMap((res: any) => {

          const term: string = res?.term ?? '';
          const page: number = res?.page ?? 1;
          this.prevEmailQuery = { term, page };

          if (this.vmsTable?.currentPage) {
            this.vmsTable.currentPage = page;
          }

          // TODO: Initialize Request
          this.loader.show();
          let url: string = `/notification-config/programs/${this.programId}/notification-tracker/admin/search`;

          let query: any = {
            size: this.itemsPerPage,
            page: page-1,
            sortAscending: "false",
            sortingField: 'notificationDate',
            isAdmin: "true"
          };

          // Admin filter
          if(!this.isSimplifyUser) {
            query = {
              ...query,
              isAdmin: "false",
              entityRefID: this.programId
            }
          }

          // Column filter
          if(this.filterQuery) {
            if('newNotificationDate' in this.filterQuery) {
              query['fromDate'] = this.datePipe.transform(new Date(this.filterQuery['newNotificationDate']?.[0]), DATE_FORMAT?.FORMATYMD, null, null, true);
              const endDate = new Date (this.filterQuery['newNotificationDate']?.[1]);
              endDate.setDate(endDate?.getDate()-1);
              query['toDate'] = this.datePipe.transform(endDate, DATE_FORMAT?.FORMATYMD, null, null, true);
            }

            if('fullName' in this.filterQuery) {
              query['emailOrUserName'] = this.filterQuery['fullName'];
            }

            if('status' in this.filterQuery) {
              query['status'] = (this.filterQuery['status'] ?? "")?.split(',')?.join('&status=');
            }

            if('traceId' in this.filterQuery) {
              query['trackingId'] = this.filterQuery['traceId'];
            }

            if('subject' in this.filterQuery) {
              query['subject'] = this.filterQuery['subject'];
            }

            if('groupName' in this.filterQuery) {
              query['groupName'] = this.filterQuery['groupName'];
            }
          } else {
            query['status'] = 'COMPLETED,ERROR,FAILED,BLOCKED';
          }

          return this.notificationService.getEmailNotificationLog(url, query);
        })
      ).subscribe({
        next: (data: any) => {
          if (data?.content) {
            this.loader.hide();
            this.totalRecords = data?.totalElements;

            // Guess timezone if not found in user account
            this.vmsData = (data?.content ?? [])?.map((entry: any) => {
              return {
                ...entry,
                newNotificationDate: this.datePipe.transform(entry?.['notificationDate'], DATE_FORMAT?.FORMATDDMMYY) + ' ' + this.datePipe.transform(entry?.['notificationDate'],'hh:mm a z')
              };
            });
          }
        }, error: (err: Error | any) => {
          console.error(err);
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      })
    )
  }

  // Utility methods
  getStatusClass(item: string = '') {
    let result: string = 'inactive';
    switch (item) {
      case 'COMPLETED':
        result = 'active';
        break;
      case 'FAILED':
      case 'ERROR':
        result = 'failed';
        break;
    }

    return result;
  }

  getDisplayValue(item: string = '') {
    let result: string = '';
    switch(item) {
      case 'COMPLETED':
        result = 'Success';
        break;
      case 'FAILED':
      case 'ERROR':
        result = 'Failure';
        break;
      case 'BLOCKED':
        result = 'Blocked';
        break;
      default:
        result = item;
        break;
    }

    return result;
  }
  openDialog(row: any) {
    this.subjectCache = (row?.subject ?? '');
    this.showPopup = true;
    const id = row?.id;
    this.notificationService.getHtmlResponse(`/notification-config/notification-tracker/download/content/${id}`, {responseType: 'text'}).subscribe((res: any)=> {
      if(res){
        this.emailCache = res;
      }
    })
  }

  copyText(data: any) {
    if ('clipboard' in navigator) {
      navigator.clipboard.writeText(data).then((res: any) => {
        this.alert.info('Tracking ID copied to clipboard');
      }, (err: any) => {
        console.error(err);
        this.alert.error('Error encountered while copying text');
      })
    } else {
      this.alert.error('Clipboard API not supported');
    }
  }

  dateChanged = (evt: any) => {
    if (evt) {
      const { startDate } = evt;
      if ('config' in this.tableFilterConfig?.[2])
        this.tableFilterConfig[2].config = {
          ...this.tableFilterConfig[2].config,
          enabledDateRanges: [{
            end: (new Date(startDate))?.setFullYear(startDate?.getFullYear() + 1)
          }]
        }
    }
  }

  get itemsPerPage() {
    return this.tablePaginationConfig?.itemsPerPage ?? 10;
  }

  set itemsPerPage(count: any) {
    if (this.tablePaginationConfig)
      this.tablePaginationConfig.itemsPerPage = count;
  }

  get totalRecords() {
    return this.tableOptions?.totalRecords ?? 0;
  }

  set totalRecords(count: any) {
    if (this.tableOptions)
      this.tableOptions.totalRecords = count;
  }

  get isSimplifyUser() {
    return (this.storageService.get(StorageKeys.USER_TYPE) === 'SUPER_ORG');
  }

  get programId() {
    return this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    })
  }
}
