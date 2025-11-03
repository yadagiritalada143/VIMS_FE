import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { debounceTime, Observable, Subject, Subscription, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-master-data-types',
  templateUrl: './master-data-types.component.html',
  styleUrls: ['./master-data-types.component.scss']
})
export class MasterDataTypesComponent implements OnInit {


  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('optionalCol', { static: true }) optionalCol: TemplateRef <void>;
  @ViewChild('masterTypeStatus', { static: true }) masterTypeStatus: TemplateRef <void>;
  @ViewChild('moduleIcons', { static: true }) moduleIcons: TemplateRef <any>;
  @ViewChild('emptyDataTemplate', { static: true }) emptyDataTemplate: TemplateRef <any>;

  private subscriptions: Array <Subscription> = [];
  private masterSub: Subject<any> = new Subject<any>();
  private prevMasterConfig: any = {};

  public vmsData: any;
  public itemPerPage = 10;
  public totalRecords = 0;
  public expand: boolean = true;
  public description: string = '';
  public svmsData: Array<any>;
  public filterpayLoad: any;
  public isAdvanceSearch: boolean = false;
  public reorderFlyoutVisibility: string = 'hidden';

  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array <IColoumnDefinition>;
  tableOptions: ITableOptions;
  tablePaginationConfig: ITablePaginationConfig;
  tableFilterConfig: Array <IAdvanceFilterConfig>;

  initalizeTableConfigs = () => {

    this.tableFilterConfig = [
      {
        name: 'name',
        title: 'name',
        placeholder: 'Filter Name',
        type: FilterType.TEXT,
        advanceFilter: false
      }, {
        name: 'modified_on',
        title: 'modified_on',
        placeholder: 'Select Date Range',
        type: FilterType.DATEPICKER,
        advanceFilter: false
      }, {
        name: 'module_jobs',
        title: 'Contingent',
        type: FilterType.SELECT,
        options: [
          { name: 'OFF', value: 'OFF' },
          { name: 'OPTIONAL', value: 'OPTIONAL' },
          { name: 'REQUIRED', value: 'REQUIRED' },
        ]
      }, {
        name: 'module_sow',
        title: 'Services procurement',
        type: FilterType.SELECT,
        options: [
          { name: 'OFF', value: 'OFF' },
          { name: 'OPTIONAL', value: 'OPTIONAL' },
          { name: 'REQUIRED', value: 'REQUIRED' },
        ]
      }, {
        name: 'is_enabled',
        title: 'is_enabled',
        placeholder: 'Status',
        type: FilterType.SELECT,
        advanceFilter: false,
        options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      }
    ];

    this.tableHeaderConfig = {
      title: 'Master Data Types',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('master_data_manage'),
      onAdd: this.onCreateClick,
      advanceFilter: true,
      importData: false,
      exportData: false,
      columnSetting: false,
      onSearch: this.onSearch,
      reorder: true,
      onReorder: this.onReorderClicked,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    let actionLinks: Array <IActionLinks> = [
      { linkName: 'Enable/Disable', method: this.onDisableClicked, linkIcon: 'label_off', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('master_data_manage') },
      { linkName: 'Delete', method: this.onDeleteClick, linkIcon: 'delete', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('master_data_manage') },
    ];

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onChangeItemRecords: this.onItemCountChanged
    };

    this.svmstableColomnDefn = [
      { field: 'name', header: 'Name', width: 27, primary: true, order: 1,sortable:true,onClick:this.onDetailClick },
      { field: 'configuration', header: 'Modules', width: 20, templateRef: this.moduleIcons, order: 4 },
      { field: 'modified_on', header: 'Last Updated', width: 15, order: 5, type: ColumnType.DATETIME, sortable:true },
      { field: 'is_enabled', header: 'Status', width: 13, templateRef: this.masterTypeStatus, order: 2 },
      { field: 'fd_count', header: '#Values', width: 6, onClick: this.onClickView, sortable: true, order: 3, placeholder: '0' }
    ];



    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Master data type found for the selected program.",
      actionLinks:actionLinks,
      enableColumnFilter: true,
    };
  };

  constructor(
    private eventStream: EventStreamService,
    private router: SvmsRouterService,
    private _programService: ProgramService,
    private _loader: LoaderService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private _alert: AlertService,
    private _confirmService: ConfirmationDialogService,
    private accessControlService: AccessControlService,
    private authService: AuthorizationService
  ) {}

  ngOnInit(): void {
    // Listing API
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
        .subscribe(
          (data: any) => {
            if (data) {
              this.sortByRefColumn(data);
              this.vmsData = data;

              const fdTypes: Array<any> = this.vmsData?.foundational_data_types;

              this.svmsData = fdTypes;
              this.tableOptions.paginationConfig.itemsPerPage = data?.items_per_page;
              this.itemPerPage = data?.items_per_page;
              this.totalRecords = data?.total_records;
              this.tableOptions.totalRecords = this.totalRecords;

              if (this.vmsTable && this.prevMasterConfig) {
                this.vmsTable.currentPage = this.prevMasterConfig?.page || 1;
              }
            }
          },
          err => {
            this.svmsData = [];
            console.error(err);
            this._alert.error('Error occured while loading Master data types');
          },
        ),
    );

    // Refresh listing
    this.subscriptions.push(
      this.eventStream.on(Events.FOUNDATION_DATA_TYPE_LIST)
      .subscribe((flag: boolean) => {
        if (flag) {
          this.masterSub.next({ page: 1, term: '' });
        }
      }),
    );

    // Trigger (Create)
    this.subscriptions.push(
      this.route.paramMap.subscribe((param: ParamMap) => {
        if (param.get('add')) {
          this.onCreateClick(true);
        }
      }),
    );

    this.masterSub.next({ page: 1, term: '' });
  }

  fetchSearchObservable(config: any): Observable<any> {
    const { page, term } = config;
    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url = `/configurator/programs/${programId}/foundational-data-types?limit=${this.itemPerPage}`;

    if (page) {
      url += `&page=${page}`;
    }

    if (term) {
      url += `&k=${term}`;
    }

    return this._programService.get(url);
  }

  fetchAdvanceSearchObservable({ page }): Observable<any> {
    let filter: any = {
      pagination: {
        limit: this.itemPerPage,
        page: page || 1,
      },
    };

    if (this.filterpayLoad) {
      filter['filters'] = {
        name: this.filterpayLoad['name'],
        is_enabled: this.filterpayLoad['is_enabled'],
        date_range: this.filterpayLoad['modified_on'],
        module_jobs: this.filterpayLoad['module_jobs'],
        module_sow: this.filterpayLoad['module_sow'],
      };
    }

    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    const url: string = `/configurator/programs/${programId}/foundational-data-types/advanced-filters`;

    return this._programService.post(url, filter);
  }

  onSearch = (term: string) => {
    this.masterSub.next({ term, page: 1 });
  }

  onItemCountChanged = (count: number) => {
    this.itemPerPage = count;
    this.tablePaginationConfig.itemsPerPage = count;
    this.masterSub.next({ ...this.prevMasterConfig, page: 1 });
  }

  sortByRefColumn(vmsData: any) {
    if (vmsData) {
      const fdList: Array<any> = vmsData.foundational_data_types;
      if (Array.isArray(fdList)) {
        fdList.sort((x: any, y: any) => {
          return x.ref_order - y.ref_order;
        });
      }
    }
  }

  onClickView =(evt: any) => {
    if (evt) {
      this.router.navigate(['program', 'master-data-type', 'list-foundational-data', evt?.id, 'list']);
    }
  }

  onCreateClick = (event) => {
    if (event) {
      this.router.navigate(['program', 'master-data-type', 'create']);
    }
  }

  onReorderClicked = () => {
    this.reorderFlyoutVisibility = 'visible';
  }

  closeReorderFlyout() {
    this.reorderFlyoutVisibility = 'hidden';
  }

  onEditClick = (event) => {
    if (event?.id) {
      this.router.navigate(['program', 'master-data-type', 'edit', event?.id]);
    }
  }

  onDisableClicked = (event: any) => {
    if (event) {
      let state: string = event?.is_enabled ? 'disable' : 'enable';
      let message: string = `Are you sure to ${state} the ${event?.name}?`;

      this._confirmService
        .confirm('', message, 'Yes', 'No')
        .then((flag: boolean) => {
          if (flag) {
            const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
            const url: string = `/configurator/programs/${programId}/foundational-data-types/${event?.id}`;
            let payload: any = {
              ...event,
              is_enabled: !event?.is_enabled,
            };

            if ('dependent_foundational_data_types' in payload) {
              delete payload.dependent_foundational_data_types;
            }

            if ('dependent_custom_fields' in payload) {
              delete payload.dependent_custom_fields;
            }

            this._loader.show();
            this._programService.put(url, payload).subscribe(
              (res: any) => {
                if (res) {
                  this._loader.hide();
                  this._alert.success(`Master Data Type ${state}d successfully`);
                  event.is_enabled = !event.is_enabled;
                }
              },
              err => {
                this._loader.hide();
                this._alert.error(errorHandler(err));
              },
            );
          }
        })
        .catch(err => {
          console.error(err);
        });
    }
  }

  onExpandClick(id: string) {
    if (id) {
      const fd_types: Array<any> = this.vmsData?.foundational_data_types;
      if (Array.isArray(fd_types)) {
        let entry: any = fd_types.find((entry: any) => entry?.id === id);
        this.description = entry?.description;
      }
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
            const url: string = `/configurator/programs/${programId}/foundational-data-types/${event?.id}`;

            this._loader.show();
            this._programService.delete(url).subscribe(
              (res: any) => {
                if (res) {
                  this._loader.hide();
                  this._alert.success('Master data type deleted successfully');
                  this.masterSub.next(this.prevMasterConfig);
                }
              },
              err => {
                this._loader.hide();
                this._alert.error(errorHandler(err));
              },
            );
          }
        })
        .catch(err => {
          console.error(err);
        });
    }
  }

  onDetailClick = (event) => {
    if (event?.id) {
      this.router.navigate(['program', 'master-data-type', 'view', event?.id]);
    }
  }

  onPaginationClick = (page: number) => {
      this.masterSub.next({
        ...this.prevMasterConfig,
        page: page,
      });
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

  get showTable() {
    return this.totalRecords || this.isAdvanceSearch;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
