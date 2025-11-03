import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ProgramService } from 'src/app/programs/program.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { Subject, Subscription } from 'rxjs';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { Router } from '@angular/router';
import { debounceTime, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-rules-list',
  templateUrl: './rules-list.component.html',
  styleUrls: ['./rules-list.component.scss']
})
export class RulesListComponent implements OnInit {

  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;
  @ViewChild('ruleStatus',{static:true}) ruleStatus:TemplateRef<void>;

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
  moduleList : any = [];
  allEventList : any = [];
  eventList : any = [];
  ruleType : any = [];

  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;

  public programId: any;
  public moduleFilterInput = new Subject<string | null>();
  public eventNameFilterInput = new Subject<string | null>();
  public searchmoduleId: string = null;

  dataLoader: boolean = false;
  searchTerm: string = null;
  tablePaginationConfig: ITablePaginationConfig;
  tableFilterConfig: Array <IAdvanceFilterConfig>;

  initalizeTableConfigs = () => {
    this.tableFilterConfig = [
      {
        name: 'ruleCode',
        title: 'Search ID',
        placeholder: 'Search ID',
        type: FilterType.TEXT,
        advanceFilter: false
      },
      {
        name: 'statusMessage',
        title: 'status',
        placeholder: 'Status',
        type: FilterType.SELECT,
        advanceFilter: false,
        options: [
          { name: 'ACTIVE', value: 'ACTIVE' },
          { name: 'INACTIVE', value: 'INACTIVE' },
          { name: 'EXPIRED', value: 'EXPIRED' }
        ]
      },
      {
        name: 'ruleName',
        title: 'Rule Title',
        placeholder: 'Search Rule Title',
        type: FilterType.TEXT,
        advanceFilter: false
      },
      {
        name: 'moduleName',
        title: 'Module Name',
        placeholder: 'Search Module',
        type: FilterType.SELECT,
        options: this.moduleList,
        advanceFilter: false
      },
      {
        name: 'ruleEvent.name',
        title: 'Event Name',
        placeholder: 'Search Event',
        type: FilterType.SELECT,
        options: this.eventList,
        advanceFilter: false
      },
      {
        name: 'ruleType',
        title: 'Rule Type',
        placeholder: 'Search Rule Type',
        type: FilterType.SELECT,
        options: this.ruleType,
        advanceFilter: false
      },
      {
        name: 'modified_on',
        title: 'Last Updated',
        placeholder: 'Last Updated',
        type: FilterType.DATEPICKER,
        advanceFilter: false
      },
    ];


    this.tableHeaderConfig = {
      title: 'Rule Builder',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('rule_builder_manage'),
      onAdd: this.onCreateClick,
      advanceFilter: false,
      importData: false,
      exportData: false,
      onSearch: this.onSearch,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    let actionLinks: Array <IActionLinks> = [
      { linkName: 'View', method: this.onClickView, linkIcon: 'visibility', hide: !this.authService.authorize('rule_builder_view') },
      // { linkName: 'Edit', method: this.onEditClick, hide: !this.authService.authorize('rule_builder_manage') },
      { linkName: 'Delete', method: this.onDeleteClick, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('rule_builder_manage') }
    ];

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [1,10, 25, 50, 100],
      onChangeItemRecords: this.onItemCountChanged
    };
    this.svmstableColomnDefn = [
      { field: 'ruleCode', header: 'Id', width: 5, order:1, primary:true , sortable:true, onClick:this.onClickView },
      { field: 'statusMessage', header: 'Status', width: 15, sortable:true, templateRef:this.ruleStatus, order:2 },
      { field: 'ruleName', header: 'Rule Title', width: 15, sortable:true, order:3, onClick:this.onClickView },
      { field: 'moduleName', header: 'Module', width: 15, sortable:true, order:4 },
      { field: 'ruleEvent.name', header: 'Event', width: 15, sortable:true, order:5 },
      { field: 'ruleType', header: 'Rule Type', width: 15, sortable:true, order:6 },
      { field: 'modified_on', header: 'Last Updated', width: 15, sortable:true, order:7, type: ColumnType.DATETIME },
    ];


    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Rule found for the selected program.",
      actionLinks:actionLinks,
      enableColumnFilter: true,
    };
  };

  constructor (
    private route: SvmsRouterService,
    private loader: LoaderService,
    private accessControlService: AccessControlService,
    private router: Router,
    private alert: AlertService,
    private storeServ: StorageService,
    private programService: ProgramService,
    private localDateFormat: LocalDateFormatPipe,
    private authService: AuthorizationService
  ) { }

  onDeleteClick = (event) =>{
    if (event) {
         const { id } = event;
    if (id) {
      this.loader.show();
      this.programService.delete(`/rule-engine/delete/rule-detail/${id}`)
        .subscribe(
          {
            next: (message: any) => {
              this.alert.success("Rule Deleted Successfully");
              this.loader.hide();
              this.masterSub.next({});
            }, error: (err: any) => {
              this.loader.hide();
              this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
            }
          });
    }
    }
  }

  ngOnInit(): void {
    this.programId = this.storeServ.get(StorageKeys.CURRENT_PROGRAM)?.id;
    this.currentPath = this.router.url
    this.initalizeTableConfigs();
    this.loadFilters();
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
              const rulrConfig: Array<any> = this.vmsData?.rules;
              rulrConfig.forEach((el: any) => {
                el.modified_on = new Date(el?.updateAt);
                el.status = el.enabled
                el.statusMessage = el.enabled ? 'Active' : 'Inactive'
                if(el.effectiveEndDate && new Date(el.effectiveEndDate) < new Date()) {
                  el.statusMessage = 'Expired'
                }
                if(!el.effectiveEndDate && el.effectiveStartDate) {
                  el.statusMessage = 'Active'
                }
              });

              this.svmsData = rulrConfig;
              this.tableOptions.paginationConfig.itemsPerPage = data?.itemsPerPage;
              this.itemPerPage = data?.itemsPerPage;
              this.totalRecords = data?.totalRecords;
              this.tableOptions.totalRecords = this.totalRecords;

              this.loader.hide();
              if (this.vmsTable && this.prevMasterConfig) {
                this.vmsTable.currentPage = this.prevMasterConfig?.page || 1;
              }
            }
          },
          err => {
            this.loader.hide();
            this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
            console.error(err);
          },
        ),
    );
    this.masterSub.next({ page: 1, term: '' });
  }

  fetchAdvanceSearchObservable({ page }): Observable<any> {
    let filter: any = {};

    if (this.filterpayLoad) {
      filter = {
        ruleType: this.filterpayLoad['ruleType'],
      };
      if(this.filterpayLoad['ruleCode']) {
        filter.ruleCode = this.filterpayLoad['ruleCode']
      }
      if(this.filterpayLoad['ruleName']) {
        filter.ruleName = this.filterpayLoad['ruleName']
      }
      if(this.filterpayLoad['ruleEvent.name']) {
        filter.ruleEvent = this.allEventList?.filter(x => x?.value == this.filterpayLoad['ruleEvent.name'])?.map(y => {return {id : y?.value, name : y?.name, slug : y?.slug}})[0]
      }
      if(this.filterpayLoad['moduleName']) {
        filter.moduleId = this.filterpayLoad['moduleName']
      }
      if(this.filterpayLoad['modified_on']) {
        filter.modifiedOn = {
          "startDate" : this.localDateFormat.transform(new Date(this.filterpayLoad['modified_on'][0]), DATE_FORMAT.FORMATYMD ,null ,null , true,),
          "endDate" : this.localDateFormat.transform(this.filterpayLoad['modified_on'][1], DATE_FORMAT.FORMATYMD ,null ,null , true,)
        }
      }
      if(this.filterpayLoad['statusMessage']) {
        filter.status = this.filterpayLoad['statusMessage']
      }
    }
    this.itemPerPage = this.itemPerPage ? this.itemPerPage : 10
    let url: string = `/rule-engine/programs/${this.programId}/rule-listing/search?limit=${this.itemPerPage}`;
    page = page ? page : 1;
    if (page) {
      url += `&page=${page}`;
    }

    return this.programService.post(url, filter);
  }

  fetchSearchObservable(config: any): Observable<any> {
    const { page, term } = config;

    this.itemPerPage = this.itemPerPage ? this.itemPerPage : 10

    let url = `/rule-engine/programs/${this.programId}/rule-listing?limit=${this.itemPerPage}`;

    if (page) {
      url += `&page=${page}`;
    }

    if (term) {
      url += `&k=${term}`;
    }

    return this.programService.get(url);
  }

  onListFilter = (event: any) => {
    if (event) {
      this.isAdvanceSearch = true;
      this.filterpayLoad = event;
      this.masterSub.next(event);
    } else {
      this.isAdvanceSearch = false;
      this.masterSub.next({ page: 1, term: '' });
    }
  }

  loadFilters = () => {
    let url = `/rule-engine/programs/${this.programId}/search-options`
    this.programService.get(url).subscribe({
      next: (data: any) => {
        this.moduleList = data?.searchOption?.modules?.map(x => { return {
          value: x.moduleId,
          name: x.name
        }});
        this.allEventList = data?.searchOption?.events?.map(x => { return {
          value: x.id,
          name: x.name,
          slug: x.slug
        }});
        this.ruleType = data?.searchOption?.ruleTypes?.map(x => { return {
          value: x.id,
          name: x.ruleType
        }});
        this.tableFilterConfig.filter(x => x.name == 'moduleName')[0].options = this.moduleList;
        this.tableFilterConfig.filter(x => x.name == 'ruleEvent.name')[0].options = this.allEventList;
        this.tableFilterConfig.filter(x => x.name == 'ruleType')[0].options = this.ruleType
      },
      error: err => {
        console.error(err);
      }
    });

  }

  onCreateClick =(create: any) => {
    if (create) {
      this.route.navigate(['program', 'rules-builder', 'create']);
    }
  }

  onClickView =(evt: any) => {
    if (evt) {
      const { id } = evt;
      this.route.navigate(['program', 'rules-builder', 'view', id]);
    }
  }

  onItemCountChanged = (count: number) => {
    this.itemPerPage = count;
    this.tablePaginationConfig.itemsPerPage = count;
    this.masterSub.next({ ...this.prevMasterConfig, page: 1 });
  }

  onPaginationClick = (page: number) => {
    this.masterSub.next({ ...this.prevMasterConfig, page: page });
  }

  onEditClick = (event) => {
    if (event) {
      const { id } = event;
      this.route.navigate(['program', 'rules-builder', 'edit', id]);
    }
  }

  onSearch = (term: string) => {
    this.masterSub.next({ term, page: 1 });
  }

}
