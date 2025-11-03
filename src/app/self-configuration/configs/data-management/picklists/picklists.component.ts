import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged, Observable, Subject, Subscription, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-picklists',
  templateUrl: './picklists.component.html',
  styleUrls: ['./picklists.component.scss']
})
export class PicklistsComponent implements OnInit, OnDestroy {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('count', { static: true}) countTemplate: TemplateRef <any>;
  @ViewChild('status', { static: true }) statusTemplate: TemplateRef <any>;

  public sidebarVisibility: ('visible' | 'hidden') = 'hidden';
  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];

  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;

  private subscriptions: Array<Subscription> = [];
  private listSubject: Subject<any> = new Subject<any>();
  private prevListConfig: any = {term: '', page: 1};
  private dropdownSubject: Subject<any> = new Subject<any>();

  private prevDropdownConfig: any = {term: '', page: 1};
  private dropdownRecordCount: number = 0;
  private filterParams: any = null;
  private firstCall: boolean = true;

  get programId() {
    return this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  constructor(
    private alert: AlertService,
    private loader: LoaderService,
    private storageService: StorageService,
    private programService: ProgramService,
    private eventStream: EventStreamService,
    private accessControlService: AccessControlService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {
    this.initTableConfig();
    this.initPicklistSubject();
    this.listSubject.next(this.prevListConfig);
  }

  initTableConfig = () => {

    // Advance filter
    this.tableFilterConfig = [
      {
        name: 'name',
        title: 'name',
        loading: false,
        placeholder: 'Filter Picklist Name',
        type: FilterType.TEXT,
        options: [],
      }, {
        name: 'defined_by',
        title: 'defined_by',
        placeholder: 'Defined By',
        type: FilterType.SELECT,
        options: [
          { name: 'Predefined', value: 'PREDEFINED' },
          { name: 'Program', value: 'PROGRAM' }
        ],
      },
      {
        name: 'modified_on',
        title: 'modified_on',
        placeholder: 'Select Date',
        type: FilterType.DATEPICKER
      }, {
        name: 'is_enabled',
        title: 'is_enabled',
        placeholder: "Select Status",
        type: FilterType.SELECT,
        options: [
          { name: 'Active', value: 'True' },
          { name: 'Inactive', value: 'False' }
        ]
      }
    ];

    this.tableHeaderConfig = {
      title: 'Picklists',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('picklist_manage'),
      advanceFilter: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdd: this.onAddClicked,
      onSearch: this.onSearch,
      onAdvanceFilter: this.onFilter,
    };

    // Action Links
    let actionLinks: Array <IActionLinks> = [
      { linkName: 'Edit', linkIcon: 'edit', method: this.onEditClicked, hide: !this.authService.authorize('picklist_manage') },
      { linkName: 'Enable/Disable', linkIcon: 'label_off', method: this.onDisableClicked, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('picklist_manage') }
    ];

    this.tablePaginationConfig = {
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged
    };

    this.tableColumnConfig = [
      { field: 'name', header: 'Name', width: 6, primary: true, order: 1, sortable: true, onClick: this.onViewClicked },
      { field: 'is_enabled', header: 'Status', width: 6, order: 3, sortable: true, templateRef: this.statusTemplate },
      { field: 'picklist_id', header: 'Picklist ID', width: 6, order: 2, sortable: true },
      { field: 'count', header: 'Number of Picklist Values', width: 6, order: 4, sortable: true, templateRef: this.countTemplate },
      { field: 'defined_by', header: 'Defined By', width: 6, order: 5, sortable: true },
      { field: 'modified_on', header: 'Last Updated', width: 6, order: 6, sortable: true, type: ColumnType.DATETIME },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Picklists Found",
      actionLinks,
      enableColumnFilter: true,
      linksValidatorFn: this.validateDropdown
    };
  }

  validateDropdown = (links: Array <IActionLinks>, data: any) => {
    const accessControl: boolean = !this.accessControlService.accessControl();
    if(data?.defined_by === 'PROGRAM') {
      links[1].hide = accessControl && false;
    } else {
      links[1].hide = accessControl || true;
    }
  }

  initPicklistSubject = () => {

    // Picklist listing
    this.subscriptions.push(
      this.listSubject
        .pipe(
          debounceTime(500),
          switchMap((query: any) => {

            const term: string = query?.term;
            const page: number = query?.page;
            this.prevListConfig = { term, page };
            if(this.vmsTable?.currentPage) {
              this.vmsTable.currentPage = page ?? 1;
            };

            this.loader.show();
            if(this.filterParams) {
              return this.fetchAdvanceFilterObservable(page);
            }

            return this.fetchListingObservable(term, page);
          })
        )
        .subscribe({
          next: (data: any) => {
            if(data) {
              this.loader.hide();
              this.totalRecords = data?.total_records;
              this.vmsData = data?.pick_lists?.map((entry: any) => {
                entry['count'] = (entry?.picklist_item?.length || 0);
                return entry;
              }) || [];

              if(this.firstCall) {
                this.firstCall = false;
                this.dropdownOneOptions = this.vmsData;
                this.dropdownRecordCount = this.totalRecords;
              }
            }
          }, error: (err: any) => {
            this.loader.hide();
            console.error(err);
            this.alert.error('Error encountered while fetching entries!');
          }
        }
      )
    );

    // Picklist dropdown
    this.subscriptions.push(
      this.dropdownSubject
        .pipe(
          debounceTime(500),
          distinctUntilChanged((prev: any, curr: any) => {
            let prevTerm: string = this.prevDropdownConfig?.term;
            let prevPage: number = this.prevDropdownConfig?.page;
            return ((prevTerm === curr?.term) && (prevPage === curr?.page));
          }),
          switchMap((query: any) => {
            const term: string = query?.term;
            const page: number = query?.page;
            this.prevDropdownConfig = { term, page };
            this.dropdownOneLoading = true;
            return this.fetchListingObservable(term, page);
          })
        )
        .subscribe({
          next: (data: any) => {
            if(data) {
              this.dropdownOneLoading = false;
              this.dropdownRecordCount = data?.total_records;
              this.dropdownOneOptions = (data?.pick_lists || []);
            }
          }, error: (err: any) => {
            console.error(err);
            this.dropdownOneLoading = false;
            this.alert.error('Error encountered while fetching entries!');
          }
        }
      )
    );
  }

  /* Custom logic start */
  searchPicklistEntry = (term: string) => {
    this.dropdownSubject.next({ term, page: 1 });
  }

  set dropdownOneOptions(data: Array <string>) {
    if(this.tableFilterConfig?.length) {
      this.tableFilterConfig[0].options = data?.map((entry: any) => {
        return {
          name: entry?.name,
          value: entry?.name
        }
      }) || [];
    }
  }

  set dropdownOneLoading(flag: boolean) {
    if(this.tableFilterConfig?.length) {
      this.tableFilterConfig[0].loading = flag;
    }
  }
  /* Custom login end */

  onAddClicked = (evt: any) => {
    if (evt) {
      this.sidebarVisibility = 'visible';
    }
  }

  onViewClicked = (evt: any) => {
    if (evt?.id) {
      this.sidebarVisibility = 'visible';
      this.eventStream.emit(new EmitEvent(Events.VIEW_PICKLIST, evt));
    }
  }

  onEditClicked = (evt: any) => {
    if (evt?.id) {
      this.sidebarVisibility = 'visible';
      this.eventStream.emit(new EmitEvent(Events.EDIT_PICKLIST, evt));
    }
  }

  onDisableClicked = (evt: any) => {
    if (evt?.id) {
      let url: string = `/configurator/programs/${this.programId}/pick-lists/${evt?.id}`;
      let payload: any = {
        is_enabled: Boolean(!evt?.is_enabled)
      };

      this.loader.show();
      this.programService.put(url, payload).subscribe({
        next: (data: any) => {
          if (data) {
            this.loader.hide();
            this.alert.success(`Picklist entry updated successfully`);
            this.refreshList(true);
          }
        }, error: (err: any) => {
          this.alert.error(errorHandler(err));
          this.loader.hide();
        }
      });
    }
  }

  refreshList(flag: boolean) {
    if (flag) {
      this.listSubject.next(this.prevListConfig);
    }
  }

  onSearch = (term: string) => {
    this.listSubject.next({ term, page: 1 });
  }

  onFilter = (data: any) => {
    if(!data) {
      this.filterParams = null;
    } else {
      this.filterParams = {};
      if(data?.name) {
        this.filterParams['picklist_name'] = data?.name;
      }
      if(data?.defined_by) {
        this.filterParams['defined_by'] = data?.defined_by;
      }
      if(data?.modified_on) {
        this.filterParams['date_range'] = data?.modified_on;
      }
      if(data?.is_enabled) {
        this.filterParams['active'] = data?.is_enabled;
      }
    }

    this.listSubject.next({ ...this.prevListConfig, page: 1 });
  }

  fetchListingObservable(term: string = '', page: number = 1): Observable <any> {
    let url: string = `/configurator/programs/${this.programId}/pick-lists?limit=${this.itemsPerPage}&page=${page}&disabled_picklist_items=1`;
    if(term) {
      url += `&picklist_name=${term}`;
    }

    return this.programService.get(url);
  }

  fetchAdvanceFilterObservable(page: number = 1) {
    let url: string = `/configurator/programs/${this.programId}/pick-lists?limit=${this.itemsPerPage}&page=${page}&disabled_picklist_items=1`;
    let queryKeys: Array <string> = [...Object.keys(this.filterParams)];
    queryKeys?.forEach((key: string) => {
      url += `&${key}=${this.filterParams[key]}`;
    });

    return this.programService.get(url);
  }

  onPaginationClick = (page: number) => {
    this.listSubject.next({ ...this.prevListConfig, page });
  }

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.listSubject.next({ ...this.prevListConfig, page: 1 });
  }

  get itemsPerPage() {
    return this.tablePaginationConfig?.itemsPerPage ?? 10;
  }

  set itemsPerPage(count: any) {
    if(this.tablePaginationConfig)
      this.tablePaginationConfig.itemsPerPage = count;
  }

  get totalRecords() {
    return this.tableOptions?.totalRecords ?? 0;
  }

  set totalRecords(count: any) {
    if(this.tableOptions)
      this.tableOptions.totalRecords = count;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
