import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, Subscription, debounceTime, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { NotificationConfigService } from '../notification-config.service';
import { ProgramService } from 'src/app/programs/program.service';
import { ProgramConfig } from 'src/app/jobs/job-details/interfaces/ProgramConfig';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['../../../../assets/sass/self-config/config-main.scss',
  '../../../../assets/sass/self-config/config-main-2.scss',
  './notification-list.component.scss']
})
export class NotificationListComponent implements OnInit,OnDestroy {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('statusTemplate', { static: true }) statusTemplate: TemplateRef<void>;
  @ViewChild('showData', { static: true }) showData: TemplateRef<void>;
  @ViewChild('messageType', { static: true }) messageType: TemplateRef<void>;
  @ViewChild('customizedTemplate', { static: true }) customizedTemplate: TemplateRef<void>;


  programId: string;
  disableModules:any;
  isSectionVisible: boolean = true;
  prevNotificationConfig: any = { page: 1 };
  filterQuery: any = null;
  programDetails:ProgramConfig = null;
  notificationListArr: any = [];
  private notificationSubject: Subject<any> = new Subject<any>();
  private subscriptions: Array<Subscription> = [];

  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;
  tablePaginationConfig: ITablePaginationConfig;
  tableFilterConfig: Array<IAdvanceFilterConfig>;
  sortAscending: boolean;
  sortingField: string = null;

  get totalRecords() {
    return this.tableOptions?.totalRecords ?? 0;
  }

  set totalRecords(count: any) {
    if (this.tableOptions)
      this.tableOptions.totalRecords = count;
  }

  constructor(private storageService: StorageService,
    private loaderService: LoaderService,
    private _http: HttpService,
    private alertService: AlertService,
    public route: Router,
    private notificationService : NotificationConfigService,
    private programService: ProgramService,
    ) { }

  ngOnInit(): void {
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails?.id;
    if(this.storageService.get("SYSTEM_DEFAULT") === true){
      this.programId = "SYSTEM_DEFAULT";
    }
    this.initNotification();
    if(this.programId!='SYSTEM_DEFAULT'){ 
      this.loaderService.show(); 
      this._http.get(`/notification-config/programs/${this.programId}/event/excluded?tenantId=1`).subscribe({
        next:(data:any)=>{
          this.loaderService.hide();
          this.notificationService.setExcludedEvents(data?.payload ?? []);
          this.notificationSubject.next(this.prevNotificationConfig);
        },
        error:()=>{
          this.loaderService.hide();
          this.notificationSubject.next(this.prevNotificationConfig);
        }
      })
    }
    else{
      this.notificationSubject.next(this.prevNotificationConfig);
    }
    this.initalizeTableConfigs();
    this.fetchProgramDetails();
  }

  initalizeTableConfigs = () => {

    this.tableFilterConfig = [
      {
        name: 'module',
        title: 'name',
        placeholder: 'All',
        type: FilterType.SELECT,
        options: [],
      },
      {
        name: 'status',
        title: 'is_enabled',
        placeholder: 'All',
        type: FilterType.SELECT,
        options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      },
      {
        name: 'messageType',
        title: 'Message Type',
        placeholder: 'All',
        type: FilterType.SELECT,
        options: [
          { name: 'Action', value: 'ACTION' },
          { name: 'Information', value: 'INFORMATION' },
          { name: 'Reminder', value: 'REMINDER' }
        ]
      },
      {
        name: 'eventName',
        title: 'Event',
        placeholder: 'Search',
        type: FilterType.TEXT
      },
      {
        name: 'isCustomized',
        title: 'Customized',
        placeholder: 'All',
        type: FilterType.SELECT,
        options: [
          { name: 'Yes', value: true },
          { name: 'No', value: false }
        ]
      }

    ];

    let actionLinks: Array<IActionLinks> = [
      { linkName: 'Enable/Disable this Event', method: this.onDisableClicked },
      { linkName: 'Manage template', method: this.manageTemplate },
      { linkName: 'Manage template keys', method: this.manageTemplateKeys },
    ];

    this.tableHeaderConfig = {
      title: 'Notifications',
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onColumnFilter,
      columnSettingConfig:{
        onSortColumns: this.onSort
      }
    };

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onChangeRecords,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [10, 25, 50, 100]
    }

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      totalRecords: this.totalRecords,
      pagination: true,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Records Found",
      enableColumnFilter: true,
      actionLinks: actionLinks,
      linksValidatorFn: this.validateEvent
    };


    this.svmstableColomnDefn = [
      { field: 'module', header: 'Module', primary:true, onClick: this.manageTemplate, width: 35, order: 1, sortable: true },
      { field: 'status', header: 'Status', width: 15, order: 2, templateRef: this.statusTemplate, sortable: true },
      { field: 'eventName', header: 'Event', width: 70, primary:true, order: 3, sortable: true, onClick: this.manageTemplate },
      { field: 'messageType', header: 'Message Type', templateRef: this.messageType, width: 20, order: 4, sortable: true },
      { field: 'isCustomized', header: 'Customized?', templateRef: this.customizedTemplate, width: 20, order: 5, sortable: true },
    ];
  }

  initNotification = () => {
    this.subscriptions.push(
      this.notificationSubject
        .pipe(
          debounceTime(400),
          switchMap((query: any) => {
            const page: number = query?.page;
            this.prevNotificationConfig = { page };
            if (this.vmsTable?.currentPage) {
              this.vmsTable.currentPage = page ?? 1;
            };

            this.loaderService.show();
            return this.fetchListingObservable(page);
          })
        )
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.loaderService.hide();
              this.notificationListArr = data?.payload?.content;
              this.tableFilterConfig[0].options=data?.payload?.modules?.sort().map((module)=>{
                return {name : module, value: module}
              })
              this.totalRecords = data?.payload?.totalElements;

            }
          }, error: (err: any) => {
            this.loaderService.hide();
            this.notificationListArr=[];
            this.alertService.error('Error encountered while fetching entries!');
          }
        })
    )
  };

  onColumnFilter = (evt: any) => {
    this.filterQuery = evt;
    this.notificationSubject.next({ page: 1 });
  }

  fetchProgramDetails(){
    this.programService.fetchProgramDetails(this.programId).subscribe({
      next:(res:any) => {
        this.programDetails = res?.payload?.program;
        this.disableModules = this.programDetails?.module_configs?.filter((unselectedItem:any)=> unselectedItem?.is_enabled === false);
      },
      error:(e) => {
        this.disableModules = [];
        this.programDetails = {
          module_configs: null,
          program_id:null,
          is_enabled:true,
          created_on: null,
          modified_on: null,
          created_by: null,
          modified_by:null,
        }
      }
    })
}

closeWarningMessage() {
  this.isSectionVisible = !this.isSectionVisible;
  this.disableModules = [];
  this.programDetails.is_enabled = true;
}

  fetchListingObservable(page: number = 1): Observable<any> {
    let url: string = `/notification-config/programs/${this.programId}/event/all`
    let query: any = {
      size: this.itemPerPage,
      page: page - 1,
    };
    if(this.sortingField){
      query = {
        ...query, 
        sortingField: this.sortingField,
        sortAscending: this.sortAscending
      }
    }
    if (this.filterQuery) {
      if ('module' in this.filterQuery) {
        query['modules'] = this.filterQuery['module'];
      }

      if ('status' in this.filterQuery) {
        query['status'] = this.filterQuery['status'];
      }

      if ('eventName' in this.filterQuery) {
        query['event'] = this.filterQuery['eventName'];
      }

      if ('messageType' in this.filterQuery) {
        query['messageType'] = this.filterQuery['messageType'];
      }

      if ('isCustomized' in this.filterQuery) {
        query['isCustomized'] = this.filterQuery['isCustomized'];
      }
    }

    let it: number = 0;
    let keys: Array <string> = [...Object.keys(query)];

    keys.forEach((key: string) => {
        if(it === 0) {
          url += `?${key}=${query[key]}`;
        } else {
          url += `&${key}=${query[key]}`;
        }

        it++;
    });
    const payload={
      "excludeCodes": this.notificationService.getExcludedEvents()
    }
    return this._http.post(url,payload);
  }

  onPaginationClick = (page: number) => {
    this.notificationSubject.next({ ...this.prevNotificationConfig, page });
  }

  onChangeRecords = (count: number) => {
    this.itemPerPage = count;
    this.notificationSubject.next({ ...this.prevNotificationConfig, page: 1 });
  }

  get itemPerPage() {
    return this.tablePaginationConfig?.itemsPerPage ?? 10;
  }

  set itemPerPage(count: any) {
    if (this.tablePaginationConfig)
      this.tablePaginationConfig.itemsPerPage = count;
  }

  onDisableClicked=(event)=> {
    const url = `/notification-config/programs/${this.programId}/event/status`
    const payload={
      eventCode: event?.eventCode,
      isActive: event?.status ? false : true
    }
    this.loaderService.show();
    this._http.put(url,payload).subscribe({
      next:(data:any)=>{
        this.loaderService.hide();
        if(data?.errorCode){
          this.alertService.error(data?.message);
        }
        else{
          this.alertService.success(data?.message);
        }
        this.notificationSubject.next(this.prevNotificationConfig);
      },
      error: (err: Error | any) => {
        this.loaderService.hide();
        this.alertService.error(errorHandler(err));
      }
    })
  }

  validateEvent(links: Array <IActionLinks>, data: any){
    if(data?.allowOnlyRootLevelTemplates){
      links[0].disable=true;
    }
    else {
      links[0].disable=false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription)=>sub?.unsubscribe());
  }

  navigateToLink(url: string, event?) {
    if(event) {
      localStorage.setItem('eventData', JSON.stringify(event));
    }
    if(url) {
      this.route.navigate((url?.split('/')?.filter((fragment: string) => fragment) || []),
      {
        queryParams:{
          navigateToSelfConfig: this.route.url.includes('self-configuration') ? true : null
        }
      });
    }
  }

  manageTemplate= event => {
    let url = `/notification/config/event/template/${event?.id}`;
    if(this.route.url.includes('self-configuration')){
      url = `/self-configuration` + url;
    }
    this.navigateToLink(url, event)
  }

  manageTemplateKeys= event => {
    let url = `/notification/config/event/templatekeys/${event?.id}`;
    if(this.route.url.includes('self-configuration')){
      url = `/self-configuration` + url;
    }
    this.navigateToLink(url, event)
  }

  onSort = (field : string, order : string) =>{
    this.sortAscending = order?.toUpperCase() == 'ASC' ? true : false; 
    switch(field){
      case "module":
        this.sortingField = "group";
        break;
      case "status":
        this.sortingField = "active";
        break;
      default:
        this.sortingField = field;
        break;
    }
    if(this.sortingField){
      this.notificationSubject.next({ page: 1 });
    }
  }
}
