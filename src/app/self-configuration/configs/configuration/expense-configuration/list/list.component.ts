import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { debounceTime, Observable, Subject, Subscription, switchMap } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import {
  IExpensesConfigurationListItem,
  IExpensesConfigurationVmsData,
  IDisableOrEnableRequestPayload,
  ConfigExpenseStatus
} from 'src/app/program-setup/expense-configuration/pages/expense-configuration-list/expense-configuration-list-interface';
import { ExpenseConfigurationListService } from 'src/app/program-setup/expense-configuration/pages/expense-configuration-list/expense-configuration-list.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';


 @Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('masterTypeStatus',{static:true}) masterTypeStatus:TemplateRef<void>;

  private masterSub: Subject<any> = new Subject<any>();
  private prevMasterConfig: any = {};
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
        type: FilterType.TEXT
      },
      {
        name: 'hierarchy_title',
        title: 'hierarchy_title',
        placeholder: 'Select Hierarchy',
        type: FilterType.MULTISELECT,
        options:this.dbHierarchies
      },
      {
        name: 'status',
        title: 'status',
        placeholder: 'Select Status',
        type: FilterType.SELECT,
        options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      },
      {
        name: 'last_updated',
        title: 'last_updated',
        placeholder: 'Select Date',
        type: FilterType.DATEPICKER
      }
    ];

    this.tableHeaderConfig = {
      title: 'Expense Configurations',
      searchAllowed: false,
      showAddBtn: this.authService.authorize('expense_configuration_manage'),
      onAdd: this.onCreateClick,
      advanceFilter: false,
      importData: false,
      exportData: false,
      columnSetting: false,
      onSearch: this.onSearch,
      reorder: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    this.svmstableColomnDefn = [
      { field: 'config_name', header: 'Name', width: 5,  primary: true, order: 1,sortable:true,onClick:this.onDetailClick },
      { field: 'status', header: 'Status', width: 20,  templateRef: this.masterTypeStatus, order: 2 },
      { field: 'hierarchy_title', header: 'Hierarchy', width: 20, order: 3 },
      { field: 'updated_by', header: 'Updated By',width: 50, order:4 },
      { field: 'last_updated', header: 'Last Updated',width: 50, order:5,type:ColumnType.DATETIME}

    ];


    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onChangeItemRecords: this.onItemCountChanged
    };

    let actionLinks: Array <IActionLinks> = [
      { linkName: 'View', method: this.onDetailClick, hide: !this.authService.authorize('expense_configuration_view') },
      { linkName: 'Edit', method: this.onEditClick, hide: !this.authService.authorize('expense_configuration_manage') },
      { linkName: 'Enable/Disable', method: this.onDisableClicked, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('expense_configuration_manage') },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Expense config found for the selected program.",
      actionLinks:actionLinks,
      enableColumnFilter: true
    };
  };

  programId: any;
  actualFilters: any = {};
  expenseConfigData: any;
  dbHierarchies: any = [];

  constructor (
    private storageService: StorageService,
    private alertService: AlertService,
    private loader: LoaderService,
    private eventStream: EventStreamService,
    private programService: ProgramService,
    private _confirmService: ConfirmationDialogService,
    private router: SvmsRouterService,
    private localDateFormat: LocalDateFormatPipe,
    public service: ExpenseConfigurationListService,
    private accessControlService: AccessControlService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.initalizeTableConfigs();
    this.getHierarchyList();
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
        .subscribe({next:
          (data: any) => {
            if (data) {
              this.setVmsData(data?.data?.configuration || []);
              this.loader.hide();
              this.expenseConfigData = data?.data?.configuration;
              console.log('data?.data?.items_per_page',data?.data?.per_page);

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
            this.loader.hide();
            this.alertService.error('Error occured while loading Expense config data');
          },}
        ),
    );
    // Refresh listing
    this.subscriptions.push(
      this.eventStream.on(Events.FETCH_EXPENSE_CONFIGURATION_LIST)
      .subscribe((flag: boolean) => {
        if (flag) {
          this.masterSub.next({ page: 1, term: '' });
        }
      }),
    );
    this.masterSub.next({ page: 1, term: '' });
  }
  setVmsData(items: IExpensesConfigurationListItem[]) {
    this.vmsData = items.map((item: IExpensesConfigurationListItem) => {
        const updatedAtDate = this.localDateFormat.transform(item?.updated_at, '', '', '', true);
        return {
            config_uuid: item.config_uuid,
            config_name: item.config_name,
            hierarchy_title: item.hierarchy?.map(val => val?.title).toString() || '',
            updated_by: item.updated_by?.name || '',
            last_updated: updatedAtDate,
            status: ConfigExpenseStatus[item.status]
        } as IExpensesConfigurationVmsData;
    });
}
onDisableClicked = (item: IExpensesConfigurationVmsData) => {
  const status = !item.status;
  this.service.disableOrEnable(item.config_uuid, { status } as IDisableOrEnableRequestPayload);
  this.masterSub.next({ page: 1, term: '' });
}


  onEditClick = (event: boolean | IExpensesConfigurationVmsData, status: string = 'edit') => {
    if (typeof event === 'boolean' && !status) {
      this.router.navigate(['configuration', 'expense-configuration', 'create']);
  } else if (typeof event === 'object' && status) {
      const config_uuid = event.config_uuid;
      this.router.navigate(['configuration', 'expense-configuration', 'create'], { queryParams: { config_uuid, status } });
  }
  }
  onDetailClick =(event: boolean | IExpensesConfigurationVmsData, status: string = 'view') => {
    if (typeof event === 'boolean' && !status) {
      this.router.navigate(['configuration', 'expense-configuration', 'create']);
  } else if (typeof event === 'object' && status) {
      const config_uuid = event.config_uuid;
      this.router.navigate(['configuration', 'expense-configuration', 'create'], { queryParams: { config_uuid, status } });
  }
  }
  onCreateClick = (event) => {
    if (event) {
      this.router.navigate(['configuration', 'expense-configuration', 'create']);
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
            const url: string = `/configurator/programs/${this.programId}/msps/fees/${event?.id}`;
            this.loader.show();
            this.programService.delete(url).subscribe({next:
              (res: any) => {
                if (res) {
                  this.loader.hide();
                  this.alertService.success('Fees config deleted successfully');
                  this.masterSub.next(this.prevMasterConfig);
                }
              }, error:
              err => {
                this.loader.hide();
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
    let url: string = `/expense/programs/${programId}/config-expense?limit=${this.itemPerPage}&page=${page}`;
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
    let url = `/expense/programs/${programId}/config-expense?limit=${this.itemPerPage}`;

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
getHierarchyList() {
  this.programService.get(`/configurator/programs/${this.programId}/hierarchy`).subscribe((data: any) => {
    this.fetchHierarchyList(data?.result[0], false);
    this.initalizeTableConfigs();
  });
}

fetchHierarchyList(hierarchy, flag) {
  if(flag) {
    this.dbHierarchies?.push({
      value: hierarchy?.id,
      name: hierarchy?.name
    });
  }
   else {
     flag = true;
   }

  if(Array(hierarchy?.hierarchies)?.length === 0)
    return;

  hierarchy?.hierarchies?.forEach(item => {
    this.fetchHierarchyList(item, true);
  });
}

checkFilters(filtersApplied: any) {
  this.actualFilters = {};
  if (filtersApplied?.hasOwnProperty('status')) {
    if (filtersApplied?.status) {
      this.actualFilters['is_active'] = '1';
    } else {
      this.actualFilters['is_active'] = '0';
    }
  }

  const hierarchies: any = filtersApplied?.hierarchy_title;
  if (Array.isArray(hierarchies) && hierarchies?.length) {
    this.actualFilters['hierarchy'] = hierarchies?.toString();
  }

  if (filtersApplied?.config_name) {
    this.actualFilters['config_name'] = filtersApplied.config_name.toString();
  }

  if (filtersApplied?.last_updated) {
    this.actualFilters['date_range'] = (filtersApplied.last_updated || []).join(',')
  }

}

ngOnDestroy(): void {
  this.subscriptions.forEach((sub: Subscription) => {
    sub?.unsubscribe();
  });
}
}
