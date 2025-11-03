import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { debounceTime, Observable, Subject, Subscription, switchMap } from 'rxjs';
import { StorageKeys,StorageService } from 'src/app/core/services/storage.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig} from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent,Events,EventStreamService } from 'src/app/core/services/event-stream.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('optionalCol',{static:true}) optionalCol: TemplateRef<void>;
  @ViewChild('masterTypeStatus',{static:true}) masterTypeStatus:TemplateRef<void>;
  @ViewChild('moduleName',{static:true}) moduleName:TemplateRef<any>;

  private masterSub: Subject<any> = new Subject<any>();
  private prevMasterConfig: any = {};

  public vmsData: any;
  public itemPerPage = 10;
  public totalRecords = 0;
  public filterpayLoad: any;
  public isAdvanceSearch: boolean = false;

  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array <IColoumnDefinition>;
  tableOptions: ITableOptions;
  tablePaginationConfig: ITablePaginationConfig;
  tableFilterConfig: Array <IAdvanceFilterConfig>;

  private subscriptions: Array <Subscription> = [];
  public vendors: any = [];
  public labor_categories: any = [];
  public dbHierarchies = [];

  onAddClickFilter = () => {
    alert('On Advanced Filter Click');
  };

  initalizeTableConfigs = () => {
    this.tableFilterConfig = [
      {
        name: 'title',
        title: 'title',
        placeholder: 'Filter by Name',
        type: FilterType.TEXT,
        advanceFilter: false
      },
      {
        name: 'hierarchy',
        title: 'Select Hierarchy',
        type: FilterType.MULTISELECT,
        onChange : this.onChange,
        options:this.dbHierarchies
      },
      {
        name: 'sourcing_models',
        title: 'sourcing_models',
        placeholder: 'Select Souring Model',
        advanceFilter: false,
        type: FilterType.MULTISELECT,
        options: [
          { name: 'SOW', value: 'SOW' },
          { name: 'CONTINGENT', value: 'CONTINGENT' },
          { name: 'DIRECT SOURCING', value: 'DIRECT_SOURCING' },
        ]
      }, {
        name: 'labor_categories',
        title: 'Select Labor Category',
        type: FilterType.MULTISELECT,
        onChange : this.onChange,
        options:this.labor_categories
      }, {
        name: 'vendors',
        title: 'Select Vendors',
        type: FilterType.MULTISELECT,
        onChange : this.onChange,
        options:this.vendors
      }, {
        name: 'category',
        title: 'Select Category',
        type: FilterType.MULTISELECT,
        options: [
          { name: 'MSP Partner Fee', value: 'MSP_PARTNER' },
          { name: 'MSP Penalty Fee', value: 'MSP_PENALTY' },
          { name: 'VMS Fee', value: 'VMS' },
        ]
      }, {
        name: 'modules',
        title: 'Select Modules',
        type: FilterType.MULTISELECT,
        options: [
          { name: 'Timesheet', value: 'TIMESHEETS' },
          { name: 'Expense', value: 'EXPENSES' },
          {name:'Misc. Expense',value:'MISC_EXPENSES'},
          {name:'SOW Project',value:'SOW_PROJECT'}
        ]
      },
      {
        name: 'modified_on',
        title: 'modified_on',
        placeholder: 'Select Date',
        advanceFilter: false,
        type: FilterType.DATEPICKER
      }, {
        name: 'is_enabled',
        title: 'Select Status',
        type: FilterType.SELECT,
        advanceFilter: false,
        options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      }
    ];

    this.tableHeaderConfig = {
      title: 'Fee Configurations',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('fee_configuration_manage') ,
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
      { field: 'title', header: 'Name',  primary: true, order: 1,sortable:true,onClick:this.onDetailClick },
      { field: 'is_enabled', header: 'Status',  templateRef: this.masterTypeStatus, order: 2 },
      { field: 'sourcing_models', header: 'Source Model',  templateRef: this.moduleName, order: 3 },
      { field: 'hierarchy_levels.length', header: 'Hierarchies', order: 4 },
      { field: 'industries.length', header: 'Labor Category', order:5 },
      { field: 'vendors.length', header: 'Vendors', order:6 },
      { field: 'modified_on', header: 'Last Updated', order: 7, type: ColumnType.DATETIME }
    ];

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onChangeItemRecords: this.onItemCountChanged
    };

    let actionLinks: Array <IActionLinks> = [
      { linkName: 'View', method: this.onDetailClick, hide: !this.authService.authorize('fee_configuration_view') },
      { linkName: 'Edit', method: this.onEditClick, hide: !this.authService.authorize('fee_configuration_manage')  },
      { linkName: 'Enable/Disable', method: this.onDisabledClick, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('fee_configuration_manage') },
      { linkName: 'Delete', method: this.onDeleteClick, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('fee_configuration_manage')  },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Fees config found for the selected program.",
      actionLinks:actionLinks,
      enableColumnFilter: true
    };
  };
  programId: any;
  actualFilters: any = {};
  fees: any;

  constructor(
    private storageService: StorageService,
    private alertService: AlertService,
    private eventStream: EventStreamService,
    private programService: ProgramService,
    private _confirmService: ConfirmationDialogService,
    private router: SvmsRouterService,
    private accessControlService: AccessControlService,
    private loader: LoaderService,
    private authService: AuthorizationService
    ) { }
  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.initalizeTableConfigs();
    this.getHierarchyList();
    this.getVendorList();
    this.getLaborCategoriesList();
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
              // this.sortByRefColumn(data);
              this.fees = data?.msp_fees;
              this.fees?.forEach((element, i) => {
                if (!element?.title) {
                  element.title = `Title ${i + 1}`
                }
              });
              this.tableOptions.paginationConfig.itemsPerPage = data?.items_per_page;
              this.itemPerPage = data?.items_per_page;
              this.totalRecords = data?.total_records;
              this.tableOptions.totalRecords = this.totalRecords;
              if (this.vmsTable && this.prevMasterConfig) {
                this.vmsTable.currentPage = this.prevMasterConfig?.page || 1;
              }

              this.loader.hide();
            }
          },error:
          err => {
            this.loader.hide();
            this.alertService.error('Error occured while loading fees config data');
          },}
        ),
    );
    // Refresh listing
    this.subscriptions.push(
      this.eventStream.on(Events.FEE_CONFIG_EDIT)
      .subscribe((flag: boolean) => {
        if (flag) {
          this.masterSub.next({ page: 1, term: '' });
        }
      }),
    );
    this.masterSub.next({ page: 1, term: '' });
  }
  onChange = (selectedModule: string) => {
  }

  onDisabledClick = (event: any) => {
      if(event?.id) {

        const url: string = `/configurator/programs/${this.programId}/msps/fees/${event.id}`;
        let payload = {
          title: event.title,
          is_enabled: !event.is_enabled
        };
        this.loader.show();
        this.programService.put(url, payload)
          .subscribe({
            next: (res: any) => {
              this.masterSub.next({ page: 1, term: '' });
              this.alertService.success(`Fee Configuration is ${event.is_enabled ? 'Disabled' : 'Enabled'} Successfully`);
            }, error: (err: Error | any) => {
              this.loader.hide();
              this.alertService.error(errorHandler(err));
            }
          }
        );
      }
  }

  onEditClick = (event) => {
    if (event) {
      this.router.navigate(['configuration', 'fees-configuration', 'create'],{ queryParams: { id:event?.id }}).then(() => {
        setTimeout(() => {
          this.eventStream.emit(new EmitEvent(Events.FEE_CONFIG_EDIT, event.id));
        }, 800);
      });
    }
  }
  onDetailClick =(event: any) => {
    if (event) {
      this.router.navigate(['configuration', 'fees-configuration', 'detail-page'], { queryParams: { id:event?.id } }).then(() => {
        setTimeout(() => {
          this.eventStream.emit(new EmitEvent(Events.FEE_CONFIG_EDIT, event.id));
        }, 800);
      });
    }
  }
  onCreateClick = (event) => {
    if (event) {
      this.router.navigate(['configuration', 'fees-configuration', 'create']);
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
      let title: string = `Are you sure to delete ${event?.title}?`;
      this._confirmService
        .confirm('', title, 'Yes', 'No')
        .then((flag: boolean) => {
          if (flag) {
            const url: string = `/configurator/programs/${this.programId}/msps/fees/${event?.id}`;
            this.programService.delete(url).subscribe({next:
              (res: any) => {
                if (res) {
                  this.alertService.success('Fees config deleted successfully');
                  this.masterSub.next(this.prevMasterConfig);
                }
              }, error:
              err => {
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
    let filter: any = {
      pagination: {
        limit: 10,
        page: page || 1,
      },
    };

    if (this.filterpayLoad) {
      filter['filters'] = {
        k: this.filterpayLoad['title'],
        hierarchy: this.filterpayLoad['hierarchy'],
        sourcemode: this.filterpayLoad['sourcing_models'],
        labor_categories: this.filterpayLoad['labor_categories'],
        vendors: this.filterpayLoad['vendors'],
        modules: this.filterpayLoad['modules'],
        category: this.filterpayLoad['category'],
        mspPartnerFee: null,
        mspProgramFee: null,
        vmsFee: null,
        penaltyFee: null,
        modified_on: this.filterpayLoad['modified_on'],
        is_enabled: this.filterpayLoad['is_enabled']
      };
    }

    this.checkFilters(filter['filters']);
    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url: string = `/configurator/programs/${programId}/msps/fees?limit=${this.itemPerPage}`;
    let keys = Object?.keys(this.actualFilters);
    if (keys?.length !== 0) {
      for (let i = 0; i < keys?.length; i++) {
        url += `&${keys[i]}=${this.actualFilters[keys[i]]}`
      }
    }
    return this.programService.get(url);
  }

  fetchSearchObservable(config: any): Observable<any> {
    const { page, term } = config;
    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url = `/configurator/programs/${programId}/msps/fees?limit=${this.itemPerPage}`;

    if (page) {
      url += `&page=${page}`;
    }
    if (term) {
      url += `&k=${term}`;
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
getVendorList(term: string = null) {
  let url = `/configurator/programs/${this.programId}/vendors`;
  if(term){
    url += `?k=${term}`;
  }
  this.programService.get(url).subscribe({
    next: (data: any) => {
      let vendors = data.program_vendors.map(vd => (vd.vendor));
      if(vendors.length === 0)
    return
    vendors.forEach(element => {
      this.vendors.push({
        value: element.id,
        name: element.name
      });
    });
    }
  });
}

getLaborCategoriesList() {
  this.programService.get(`/configurator/programs/${this.programId}/industries`).subscribe((data: any) => {
    let labor_categories = data.industries;
    if(labor_categories.length === 0)
    return

    labor_categories.forEach(element => {
      this.labor_categories.push({
        value: element.id,
        name: element.name
      });
    });
  });
}

getHierarchyList() {
  this.programService.get(`/configurator/programs/${this.programId}/hierarchy`).subscribe((data: any) => {
    this.fetchHierarchyList(data.result[0], false);
  });
}

fetchHierarchyList(hierarchy, flag) {
  if(flag) {
    this.dbHierarchies.push({
      value: hierarchy.id,
      name: hierarchy.name
    });
  }
   else {
     flag = true;
   }

  if(Array(hierarchy?.hierarchies).length === 0)
    return;

  hierarchy?.hierarchies.forEach(item => {
    this.fetchHierarchyList(item, true);
  });
}

checkFilters(filtersApplied: any) {
  this.actualFilters = {};
  if(filtersApplied?.hierarchy && filtersApplied?.hierarchy?.length != 0){
    this.actualFilters['hierarchy'] = filtersApplied?.hierarchy?.toString();
  }
  if(filtersApplied?.sourcemode && filtersApplied?.sourcemode?.length != 0 ){
    this.actualFilters['sourcing_models'] = filtersApplied?.sourcemode?.toString();
  }
  if(filtersApplied?.labor_categories && filtersApplied?.labor_categories?.length !=0 ){
    this.actualFilters['industries'] = filtersApplied?.labor_categories?.toString();
  }
  if(filtersApplied?.vendors && filtersApplied?.vendors?.length != 0 ){
    this.actualFilters['vendor'] = filtersApplied?.vendors?.toString();
  }
  if(filtersApplied?.modules && filtersApplied?.modules?.length != 0){
    this.actualFilters['module'] = filtersApplied?.modules?.toString();
  }
  if(filtersApplied?.mspPartnerFee && filtersApplied?.mspPartnerFee != null){
    let mspParFee = filtersApplied.mspPartnerFee?.replaceAll("%","%25");
    this.actualFilters['msp_partner_fee'] = mspParFee?.toString();
  }
  if(filtersApplied?.mspProgramFee && filtersApplied?.mspProgramFee != null){
    let mspProFee = filtersApplied.mspProgramFee?.replaceAll("%","%25");
    this.actualFilters['msp_program_fee'] = mspProFee?.toString();
  }
  if(filtersApplied?.vmsFee && filtersApplied?.vmsFee != null){
    let vmFee = filtersApplied.vmsFee?.replaceAll("%","%25");
    this.actualFilters['vms_fee'] = vmFee?.toString();
  }
  if(filtersApplied?.penaltyFee && filtersApplied?.penaltyFee != null) {
    let penFee = filtersApplied.penaltyFee?.replaceAll("%","%25");
    this.actualFilters['penalty_fee'] = penFee?.toString();
  }

  if(filtersApplied?.category && filtersApplied?.category?.length != 0){
    this.actualFilters['category'] = filtersApplied?.category.toString();
  }

  if(filtersApplied?.k) {
    this.actualFilters['k'] = filtersApplied?.k?.toString();
  }

  if(filtersApplied?.modified_on) {
    this.actualFilters['date_range'] = (filtersApplied?.modified_on || []).join(',');
  }

  if(typeof(filtersApplied?.is_enabled) === 'boolean') {
    this.actualFilters['is_enabled'] = filtersApplied?.is_enabled ? 1 : 0;
  }
}


ngOnDestroy(): void {
  this.subscriptions.forEach((sub: Subscription) => {
    sub?.unsubscribe();
  });
}
}
