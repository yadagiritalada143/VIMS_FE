import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ProgramService } from 'src/app/programs/program.service';
import { Router } from '@angular/router';
import { StorageService,StorageKeys } from 'src/app/core/services/storage.service';
import { Subject, Subscription } from 'rxjs';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import {  FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { debounceTime, switchMap } from 'rxjs/operators';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { Observable } from 'rxjs';
import { AuthorizationService } from 'src/app/core/services/authorize.service';


@Component({
  selector: 'app-flows-list',
  templateUrl: './flows-list.component.html',
  styleUrls: ['./flows-list.component.scss']
})
export class FlowsListComponent implements OnInit {

  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;
  @ViewChild('flowStatus',{static:true}) flowStatus:TemplateRef<void>;

  private subscriptions: Array<Subscription> = [];
  private masterSub: Subject<any> = new Subject<any>();
  private prevMasterConfig: any = {};

  public vmsData: any;
  public itemPerPage = 10;
  public totalRecords = 0;
  public expand: boolean = true;
  public description: string = '';
  public svmsData: Array<any>;
  public currentPath: string = ''
  public filterpayLoad: any;
  public isAdvanceSearch: boolean = false;
  public reorderFlyoutVisibility: string = 'hidden';
  public masterFlyoutVisibility: 'visible' | 'hidden' = 'hidden';

  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;

  public programId: any;
  public moduleFilterInput = new Subject<string | null>();
  public eventNameFilterInput = new Subject<string | null>();
  public searchmoduleId: string = null;
  moduleList : any = [];
  allEventList : any = [];
  allMethodList : any = [];
  eventList : any = [];
  methodList : any = [];

   dataLoader: boolean = false;
   searchTerm: string = null;
   tablePaginationConfig: ITablePaginationConfig;
   tableFilterConfig: Array <IAdvanceFilterConfig>;

  initalizeTableConfigs = () => {
    this.tableFilterConfig = [
      {
        name: 'event.name',
        title: 'Event',
        type: FilterType.SELECT,
        options: this.eventList
      },
      {
        name: 'event.module.name',
        title: 'Module',
        type: FilterType.SELECT,
        options: this.moduleList
      },
      {
        name: 'flow_type',
        title: 'Method',
        type: FilterType.SELECT,
        options: []
      },
      {
        name: 'flow_count',
        title: 'Flows',
        disabled: true,
        type: FilterType.NONE
      },
    ];


    this.tableHeaderConfig = {
      title: 'Workflows',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('workflow_manage'),
      onAdd: this.onCreateClick,
      advanceFilter: false,
      importData: false,
      exportData: false,
      onSearch: this.onSearch,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    let actionLinks: Array<IActionLinks> = [
      { linkName: 'View', method: this.onClickView, hide: !this.authService.authorize('workflow_view') }
    ];

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [1,10, 25, 50, 100],
      onChangeItemRecords: this.onItemCountChanged
    };
    this.svmstableColomnDefn = [
      { field: 'event.module.name', header: 'Module', width: 5, order:1,sortable:true,primary:true, onClick:this.onClickView },
      { field: 'event.name', header: 'Event', width: 27,order:2,sortable:true },
      { field: 'flow_type', header: 'Method', width: 13,order:3 },
      { field: 'flow_count', header: 'Flows', width: 13,order:4 }
    ];


    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Flows found for the selected program. ",
      actionLinks:actionLinks,
      enableColumnFilter: true,
    };
  };

  constructor (
    private route: SvmsRouterService,
    private router: Router,
    private loader: LoaderService,
    private alert: AlertService,
    private localStorage: StorageService,
    private storageService: StorageService,
    private programService: ProgramService,
    private localDateFormat: LocalDateFormatPipe,
    private authService: AuthorizationService,
  ) { }

  onClickView =(evt: any) => {
    if (evt) {
      this.route.navigate(['program', 'workflow', 'flow-list', evt?.event?.id, evt.event.module.id, evt?.flow_type]);
    }
  }

  onPaginationClick = (page: number) => {
    // this.masterSub.next({
    //   ...this.prevMasterConfig,
    //   page: page,
    // });

    this.getFlowsList({page: page})
}

  onItemCountChanged = (count: number) => {
    this.itemPerPage = count;
    this.tablePaginationConfig.itemsPerPage = count;
    this.masterSub.next({ ...this.prevMasterConfig, page: 1 });
  }

  ngOnInit(): void {
    this.programId = this.localStorage.get("PROGRAM_ID");
    this.currentPath = this.router.url;
    this.loadFilters();
    this.initalizeTableConfigs();
    this.subscriptions.push(
      this.masterSub
        .pipe(
          debounceTime(600),
          switchMap((config: any) => {
            this.loader.show();
            this.prevMasterConfig = config;

            if (this.isAdvanceSearch) {
              // Search for table: false
              return this.fetchAdvanceSearchObservable(config);
            }

            // Search for table: true
            return this.fetchSearchObservable(config);
          }),
        )
        .subscribe(
          (data: any) => {
            if (data) {
              this.vmsData = data;
              const flowConfig: Array<any> = this.vmsData?.flow_config_groups;
              flowConfig.forEach((el: any) => {
                el.modified_on = this.localDateFormat.transform(el?.modified_on, '', '', '', true);
                el.status = el.is_enabled ? 'Active' : 'Inactive'
              });


              this.svmsData = flowConfig;
              this.tableOptions.paginationConfig.itemsPerPage = data?.items_per_page;
              this.itemPerPage = data?.items_per_page;
              this.totalRecords = data?.total_records;
              this.tableOptions.totalRecords = this.totalRecords;

              this.loader.hide();
              if (this.vmsTable && this.prevMasterConfig) {
                this.vmsTable.currentPage = this.prevMasterConfig?.page || 1;
              }
            }
          },
          err => {
            this.loader.hide();
            console.error(err);
            this.alert.error('Error occured while loading Flow List');
          },
        ),
    );
    this.masterSub.next({ page: 1, term: '' });
  }

  onListFilter = (event: any) => {
    if (event) {
      this.isAdvanceSearch = true;
      this.filterpayLoad = event;
      this.getFlowsList(event)
    } else {
      this.isAdvanceSearch = false;
      this.masterSub.next({ page: 1, term: '' });
    }
  }
  searchModuleFilter = (term = '') => {

    let url = `/configurator/programs/${this.programId}/modules?limit=25&page=1`;

    if (term) {
      url += `&k=${term}`;
    }
    this.programService.get(url)
      .subscribe(
        {
          next: (data: any) => {
            const moduleData = data?.modules;
            const fmoduleData = [];
            moduleData?.forEach((item: any) => {
              fmoduleData.push({ value: item?.id, name: item?.name });
            });
          }
        });

  }

  fetchSearchObservable(config: any): Observable<any> {
    const { page, term } = config;
    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);

    let url = `/configurator/programs/${programId}/flow-configs/grouped?limit=${this.itemPerPage}`;

    if (page) {
      url += `&page=${page}`;
    }

    if (term) {
      url += `&k=${term}`;
    }

    return this.programService.get(url);
  }

  fetchAdvanceSearchObservable({ page }): Observable<any> {
    let filter: any = {
      pagination: {
        limit: 10,
        page: page || 1,
      },
    };

    if (this.filterpayLoad) {
      filter = {
        flow_type: this.filterpayLoad['flow_type'],
      };
      if(this.filterpayLoad['event.name']) {
        filter.events = [this.filterpayLoad['event.name']]
      }
      if(this.filterpayLoad['module.name']) {
        filter.modules = [this.filterpayLoad['module.name']]
      }
    }

    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    const url: string = `/configurator/programs/${programId}/flow-configs/grouped/advance-search`;

    return this.programService.post(url, filter);
  }

  onCreateClick =(event)=> {

    if(event) {
      this.route.navigate(['program', 'workflow', 'create']);
    }
  }

  onSearch = (term: string) => {
    this.masterSub.next({ term, page: 1 });
  }

  getFlowsList = (payload) => {
    if(payload) {
      let limit = 10
      this.dataLoader = true;
      const url: string = `/configurator/programs/${this.programId}/flow-configs/grouped?limit=${limit}${payload['page'] ? '&page=' + payload['page'] : ''}${payload['event.name'] ? '&events=' + payload['event.name'] : ''}${payload['event.module.name'] ? '&modules=' + payload['event.module.name'] : ''}${payload.flow_type ? '&flow_types=' + payload.flow_type : ''}`;

      this.programService.get(url).subscribe(
        {
          next: (data: any) => {
            this.vmsData = data;
            this.svmsData = data?.flow_config_groups;
            this.itemPerPage = data?.items_per_page;
            this.totalRecords = data?.total_records;
            this.tableOptions.totalRecords = this.totalRecords;
          },
          error: (err: any) => {
            this.alert.error(errorHandler(err));
          }
        })
    }
  }

  sortListValues(items, sortBy) {
    return items?.sort((item1, item2) => item1?.[sortBy]?.localeCompare(item2?.[sortBy]));
  }

  loadFilters(): void {
    this.programService.post(`/configurator/flow-system/search-options`,{}).subscribe({
      next: (data: any) => {
        this.moduleList = data?.search_options?.modules.map(x => { return {
          value: x.id,
          name: x.name
        }})
        this.allEventList = data?.search_options?.events.map(x => { return {
          value: x.id,
          name: x.name
        }})
        this.allMethodList = data?.search_options?.methods.map(x => { return {
          value: x.slug,
          name: x.name
        }})
        this.tableFilterConfig.filter(x => x.name == 'event.module.name')[0].options = this.moduleList;
        this.tableFilterConfig.filter(x => x.name == 'event.name')[0].options = this.allEventList;
        this.tableFilterConfig.filter(x => x.name == 'flow_type')[0].options = this.allMethodList;
      },
      error: err => {
        console.error(err);
      }
    });
  }

  get showTable() {
    return this.totalRecords;
  }
}
