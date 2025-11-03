import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, Observable, Subject, Subscription, switchMap } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { ColumnType, FilterType, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';


 @Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  private masterSub: Subject<any> = new Subject<any>();
  private prevMasterConfig: any = {};
  private hierarchyMap: Map <string, string> = new Map <string, string> ();

  public vmsData: any;
  public itemPerPage = 10;
  public totalRecords = 0;
  public filterpayLoad: any;
  public isAdvanceSearch: boolean = false;
  private subscriptions: Array <Subscription> = [];

  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array <IColoumnDefinition>;
  tableOptions: ITableOptions;
  tablePaginationConfig: ITablePaginationConfig;
  tableFilterConfig: Array <IAdvanceFilterConfig>;

  onAddClickFilter = () => {
    alert('On Advanced Filter Click');
  };

  initalizeTableConfigs = () => {
    this.tableFilterConfig = [
      {
        name: 'config_name',
        title: 'config_name',
        placeholder: 'Filter by Name',
        type: FilterType.TEXT,
        advanceFilter: false
      },
      {
        name: 'hierarchy_name',
        title: 'hierarchy_name',
        placeholder: 'Select Hierarchy',
        type: FilterType.MULTISELECT,
        options:this.dbHierarchies,
        advanceFilter: false
      },
      {
        name: 'is_enabled',
        title: 'Status',
        type: FilterType.SELECT,
        options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      }
    ];

    this.tableHeaderConfig = {
      title: 'Invoice Configurations',
      searchAllowed: false,
      showAddBtn: this.authService.authorize('invoice_configuration_manage'),
      onAdd: this.onCreateClick,
      advanceFilter: true,
      importData: false,
      exportData: false,
      columnSetting: false,
      onSearch: this.onSearch,
      reorder: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    this.svmstableColomnDefn = [
      { field: 'config_name', header: 'Name', width: 30,   primary: true, order: 1,sortable:true,onClick:this.onClickView },
      { field: 'hierarchy_name', header: 'Hierarchy', width: 30, order: 3 },
      { field: 'invoice_start_date', header: 'Invoice Start Date',width: 25, order:4,type:ColumnType.DATE}
    ];

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onChangeItemRecords: this.onItemCountChanged
    };

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No invoice config found for the selected program.",
      enableColumnFilter: true
    };
  };

  programId: any;
  actualFilters: any = {};
  dbHierarchies: any = [];

  constructor(
    private storageService: StorageService,
    private alertService: AlertService,
    private loader: LoaderService,
    private eventStream: EventStreamService,
    private programService: ProgramService,
    private _confirmService: ConfirmationDialogService,
    private router: SvmsRouterService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.initalizeTableConfigs();
    this.subscriptions.push(
      this.masterSub
        .pipe(
          debounceTime(600),
          switchMap((config: any) => {
            this.prevMasterConfig = config;
            if (this.isAdvanceSearch) {

              // Search for table: false
              return this.fetchAdvanceSearchObservable(config);
            }
            // Search for table: true
            return this.fetchSearchObservable(config);
          }),
        )
        .subscribe({next:
          (data: any) => {
            if (data) {

              this.vmsData = data?.data?.config?.map((entry: any) => {
                return {
                  ...entry,
                  hierarchy_name: (this.hierarchyMap.get(entry?.hierarchy_uuid) ?? 'Undefined')
                };
              });

              this.tableOptions.paginationConfig.itemsPerPage = data?.data?.per_page;
              this.itemPerPage = data?.data?.per_page;
              this.totalRecords = data?.data?.total_records;
              this.tableOptions.totalRecords = this.totalRecords;
              if (this.vmsTable && this.prevMasterConfig) {
                this.vmsTable.currentPage = this.prevMasterConfig?.page || 1;
              }
            }
          },error:
          err => {
            this.alertService.error('Error occured while loading invoice config data');
          },}
        ),
    );
    // Refresh listing
    this.subscriptions.push(
      this.eventStream.on(Events.FETCH_INVOICE_CONFIG_LIST)
      .subscribe((flag: boolean) => {
        if (flag) {
          this.masterSub.next({ page: 1, term: '' });
        }
      }),
    );

    // Fetch hierarchy details
    this.fetchHierarchyObservable().subscribe({
      next: (data: any) => {
        this.loader.hide();
        if(Array.isArray(data?.result) && data?.result?.length)
          this.hierarchyMapper(data?.result?.[0]);
          this.fetchHierarchyList(data.result?.[0], false);
          this.initalizeTableConfigs();
        this.masterSub.next({ term: '', page: 1 });
      }, error: (err: any) => {
        console.error(err);
        this.alertService.error('Error encountered while fetching hierarchy details');
      }, complete: () => {
        this.loader.hide();
      }
    });
  }

  fetchHierarchyObservable(): Observable <any> {
    this.loader.show();
    let url: string = `/configurator/programs/${this.programId}/hierarchy`;
    return this.programService.get(url);
  }

  fetchHierarchyList(hierarchy, flag) {
    if(flag) {
      this.dbHierarchies?.push({
        value: hierarchy.id,
        name: hierarchy.name
      });
    } else {
       flag = true;
     }

    if(Array(hierarchy?.hierarchies)?.length === 0)
      return;

    hierarchy?.hierarchies?.forEach(item => {
      this.fetchHierarchyList(item, true);
    });
  }

  hierarchyMapper(hierarchy: any) {
    if(!hierarchy) {
      return;
    }

    const { name, id, hierarchies } = hierarchy;
    if(name && id) {
      this.hierarchyMap.set(id, name);
    }

    if(Array.isArray(hierarchies)) {
      hierarchies.forEach((entry: any) => {
        this.hierarchyMapper(entry);
      });
    }
  }

  onClickView =(evt: any) => {
    if (evt) {
      this.router.navigate(['configuration', 'invoice-configuration', 'create'],
      { queryParams: { id: evt?.config_uuid, mode: 'view' } }
     );
    }
  }

  onEditClick = (event) => {
    if (event) {
      this.router.navigate(['configuration', 'invoice-configuration', 'create']).then(() => {
        setTimeout(() => {
          this.eventStream.emit(new EmitEvent(Events.FETCH_INVOICE_CONFIG_LIST, event.id));
        }, 800);
      });
    }
  }
  onDetailClick =(event: any) => {
    if (event) {
      this.router.navigate(['configuration', 'invoice-configuration', 'detail-page']).then(() => {
        setTimeout(() => {
          this.eventStream.emit(new EmitEvent(Events.FETCH_INVOICE_CONFIG_LIST, event.id));
        }, 800);
      });
    }
  }
  onCreateClick = (event) => {
    if (event) {
      this.router.navigate(['configuration', 'invoice-configuration', 'create']);
    }
  }
  onListFilter = (event: any) => {
    if (event) {
      this.isAdvanceSearch = true;
      this.filterpayLoad = event;
      this.masterSub.next({ page: 1 });
    } else {
      this.isAdvanceSearch = false;
      this.masterSub.next({ page: 1, term: '' });
    }
  }
  onDeleteClick = (event) =>{
    if (event) {
      let title: string = `Are you sure to delete the ${event?.name}?`;
      this._confirmService
        .confirm('', title, 'Yes', 'No')
        .then((flag: boolean) => {
          if (flag) {
            const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
            const url: string = `/invoice/programs/${programId}/config/${event?.id}`;
            this.programService.delete(url).subscribe({next:
              (res: any) => {
                if (res) {
                  this.alertService.success('Invoice config deleted successfully');
                  this.masterSub.next(this.prevMasterConfig);
                }
              }, error:
              err => {;
                this.alertService.error(errorHandler(err));
              }}
            );
          }
        })
        .catch(err => {
          console.error(err);
        });
    }
  }

  fetchAdvanceSearchObservable({ page }): Observable<any> {
    this.checkFilters(this.filterpayLoad);
    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url: string = `/invoice/programs/${programId}/config?limit=${this.itemPerPage}&page=${page}`;
    let keys = Object.keys(this.actualFilters)
    if (keys.length !== 0) {
      for (let i = 0; i < keys.length; i++) {
        url += `&${keys[i]}=${this.actualFilters[keys[i]]}`
      }
    }
    return this.programService.get(url);
  }

  fetchSearchObservable(config: any): Observable<any> {
    const { page, term } = config;
    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url = `/invoice/programs/${programId}/config?limit=${this.itemPerPage}`;

    if (page) {
      url += `&page=${page}`;
    }

    if (term) {
      url += `&search=${term}`;
    }

    return this.programService.get(url);
  }
  onSearch = (term: string) => {
      this.masterSub.next({ term, page: 1 });
  }
  onPaginationClick = (page: number) => {
    this.masterSub.next({
      ...this.prevMasterConfig,
      page: page,
    });
}
onItemCountChanged = (count: number) => {
  this.itemPerPage = count;
  this.tablePaginationConfig.itemsPerPage = count;
  this.masterSub.next({ ...this.prevMasterConfig, page: 1 });
}

checkFilters(filtersApplied: any) {
  this.actualFilters = {};
  if(filtersApplied?.hasOwnProperty('is_enabled')){
    if(filtersApplied?.is_enabled){
      this.actualFilters['is_active'] = '1';
    } else{
      this.actualFilters['is_active'] = '0';
    }
  }

  let hierarchies: any = filtersApplied?.hierarchy_name;
  if(Array.isArray(hierarchies) && hierarchies?.length){
    this.actualFilters['hierarchy'] = hierarchies?.toString();
  }

  if(filtersApplied?.config_name){
    this.actualFilters['config_name'] = filtersApplied.config_name.toString();
  }
}


ngOnDestroy(): void {
  this.subscriptions.forEach((sub: Subscription) => {
    sub?.unsubscribe();
  });
}
}
