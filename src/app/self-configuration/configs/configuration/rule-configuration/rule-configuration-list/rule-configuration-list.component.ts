import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { LocalDateTimeFormatPipe } from 'src/app/shared/pipe/local-date-time-format.pipe';
import { debounceTime, switchMap } from 'rxjs/operators';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { TimesheetConfigurationService } from 'src/app/program-setup/timesheet-configuration/timesheet-configuration.service';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { Observable, Subject, Subscription } from 'rxjs';
import { ProgramService } from 'src/app/programs/program.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-rule-configuration-list',
  templateUrl: './rule-configuration-list.component.html',
  styleUrls: ['./rule-configuration-list.component.scss']
})
export class RuleConfigurationListComponent implements OnInit, OnDestroy {

  private masterSub: Subject<any> = new Subject<any>();
  private subscriptions: Array<Subscription> = [];
  private prevMasterConfig: any = {};

  public vmsData: any;
  public tableOptions: ITableOptions;
  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public svmstableColomnDefn: Array<IColoumnDefinition>;

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('Status', { static: true }) Status: TemplateRef<void>;

  public user_type: any;
  public user: any;
  public searchTerm: string = '';
  public dbHierarchies = [];
  public selectedTimesheet = []
  public locations = [];
  public isAdvanceFilter: boolean = false;
  public filterpayLoad: any;

  public ruleNameAdvanceFilter: any = [];
  public timeSheetConfigAdvanceFilter: any = [];
  public ruleConfigAdvanceFilter: any = [];

  initalizeTableConfigs = () => {

    this.tableFilterConfig = [
      {
        name: 'title',
        title: 'title',
        placeholder: 'Search Rule Configuration',
        type: FilterType.MULTISELECT,
        options: this.ruleConfigAdvanceFilter,
      },
      {
        name: 'basic_title',
        title: 'basic_title',
        placeholder: 'Timesheet Configuration',
        type: FilterType.MULTISELECT,
        options: this.timeSheetConfigAdvanceFilter,
      },
      {
        name: 'hierarchy.name',
        title: 'hierarchy.name',
        placeholder: 'Hierarchy Name',
        type: FilterType.MULTISELECT,
        options: this.dbHierarchies
      },
      {
        name: 'rules_names',
        title: 'rules_names',
        placeholder: 'Filter by Rule Name',
        type: FilterType.MULTISELECT,
        options: this.ruleNameAdvanceFilter,
      },
      {
        name: 'is_active',
        title: 'Status',
        type: FilterType.SELECT,
        options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      },
      {
        name: 'updated_at',
        title: 'updated_at',
        placeholder: 'Select Date',
        type: FilterType.DATEPICKER
      }
    ];

    this.tableHeaderConfig = {
      title: 'Timesheet Rule Configurations',
      createButtonTitle: 'Create New',
      searchAllowed: false,
      showAddBtn: this.authService.authorize('timesheet_rule_configuration_manage'),
      onAdd: this.onCreate,
      onSearch: this.onSearch,
      advanceFilter: false,
      importData: false,
      exportData: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged,
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100]
    }

    this.svmstableColomnDefn = [
      { field: 'title', header: 'Name', width: 20, primary: true, order: 1, sortable: false, onClick: this.onViewClick },
      { field: 'basic_title', header: 'Timesheet Configuration', width: 20, order: 3, sortable: false },
      { field: 'hierarchy.name', header: 'Hierarchy', width: 10, order: 4, sortable: false },
      { field: 'location', header: 'Work Locations', width: 20, order: 5, sortable: false },
      { field: 'rules_names', header: 'Rule Name', width: 20, order: 6, sortable: false, onClick: this.onViewClick },
      { field: 'updated_at', header: 'Last Updated', width: 10, order: 7, sortable: false, type: ColumnType.DATETIME },
      { field: 'is_active', header: 'Status', width: 10, order: 2, sortable: false, templateRef: this.Status },
    ];

    let actionLinks: Array <IActionLinks> = [
      { linkName: 'View', method: this.onViewClick },
      { linkName: 'Clone', method: this.onCloneClicked },
      { linkName: 'Edit', method: this.onEditClick },
      // { linkName: 'Enable/Disable', method: this.onDisableClicked, disable: !this.accessControlService.accessControl() },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      totalRecords: this.totalRecords,
      pagination: true,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Records Found",
      actionLinks:actionLinks,
      enableColumnFilter: true
    };
  };

  constructor(
    public timesheetConfigurationService: TimesheetConfigurationService,
    private alertService: AlertService,
    private router: SvmsRouterService,
    private storageService: StorageService,
    private localDatePipe: LocalDateTimeFormatPipe,
    private dialog: ConfirmationDialogService,
    private spinner: LoaderService,
    private programService: ProgramService,
    private eventStream: EventStreamService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {

    this.initalizeTableConfigs();
    this.filterDropdownValue();

    this.user_type = this.storageService.get(StorageKeys.USER_TYPE);
    this.user = this.storageService.get(StorageKeys.CURRENT_USER);

    // Fetch hierarchy details
    this.fetchHierarchyObservable().subscribe({
      next: (data: any) => {
        if (Array.isArray(data?.result) && data?.result?.length)
          this.fetchHierarchyList(data.result?.[0], false);
          this.initalizeTableConfigs();
      }, error: (err: any) => {
        console.error(err);
        this.alertService.error('Error encountered while fetching hierarchy details');
      }
    });

    // Rule Configuration
    this.subscriptions.push(
      this.masterSub.pipe(
        debounceTime(600),
        switchMap((config: any) => {

          this.spinner.show();
          this.prevMasterConfig = config;
          if (this.vmsTable?.currentPage) {
            this.vmsTable.currentPage = config?.page ?? 1;
          }

          if (this.isAdvanceFilter) {
            // Search for table: false
            return this.fetchAdvanceSearchObservable(config);
          }

          // Search for table: true
          return this.fetchSearchObservable(config);
        }),
      )
        .subscribe({
          next: (data: any) => {

            this.spinner.hide();
            if (data?.data) {

              // Initialize entries
              this.vmsData = data?.data?.config;
              if (Array.isArray(this.vmsData)) {
                this.vmsData?.forEach(element => {
                  element.is_active = element?.status === 'active' ? true : false;
                  if (element?.hierarchies) {
                    let name = element?.hierarchies.map(n => n.name).toString();
                    element.location = element?.location?.map(n => n.name).toString() ?? '';
                    if (!element.hierarchy) {
                      element.hierarchy = {};
                      element.hierarchy['id'] = element?.hierarchies.map(n => n.id).toString();
                      element.hierarchy['name'] = name

                    } else {
                      element.hierarchy.name = name;
                    }
                  }
                  if (element?.created_by?.name) {
                    const createdAtDate = this.localDatePipe.transform((element?.created_at), DATE_FORMAT.FORMATDMMY, null, null, false);
                    let p = 'By '.concat(element?.created_by?.name, ' On ', createdAtDate);
                    return element.created_by.updated_at = p;
                  }
                });
              }

              this.totalRecords = data?.data?.pagination?.total_records;
              // this.initalizeTableConfigs();
            }
          }, error: (err: Error | any) => {
            console.error(err);
            this.spinner.hide();
            this.alertService.error('Error encountered while fetching Rule Configurations');
          }
        }
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

  fetchHierarchyObservable(): Observable<any> {
    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.spinner.show();
    let url: string = `/configurator/programs/${programId}/hierarchy`;
    return this.programService.get(url);
  }

  fetchHierarchyList(hierarchy, flag) {
    if (flag) {
      this.dbHierarchies?.push({
        value: hierarchy.id,
        name: hierarchy.name
      });
    } else {
      flag = true;
    }

    if (Array(hierarchy?.hierarchies)?.length === 0)
      return;

    hierarchy?.hierarchies?.forEach(item => {
      this.fetchHierarchyList(item, true);
    });
  }

  filterDropdownValue() {
    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${currentprogram?.id}/config/title/list`;
    this.timesheetConfigurationService.get(url)
      .subscribe({
        next: (data: any) => {
          if (data) {
            data?.data?.rule_names.forEach(ruleName => {
              this.ruleNameAdvanceFilter?.push({
                value: ruleName,
                name: ruleName
              });
            })

            data?.data?.rule_titles.forEach(ruleConfig => {
              this.ruleConfigAdvanceFilter?.push({
                value: ruleConfig,
                name: ruleConfig
              });
            })

            data?.data?.title.forEach(timesheetConfig => {
              this.timeSheetConfigAdvanceFilter?.push({
                value: timesheetConfig,
                name: timesheetConfig
              });
            })
          }

          this.initalizeTableConfigs();
        }, error: (err: Error | any) => {
          this.alertService.error(errorHandler(err));
        }
      }
    );
  }

  onCreate = (event: any) => {
    this.router.navigate(['configuration', 'timesheet-rule', 'create']);
  }

  fetchSearchObservable(config: any): Observable<any> {
    const { page, term } = config;
    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);

    let url = `/timesheet/programs/${currentprogram?.id}/config/rule?`;
    url = url + 'limit=' + this.itemsPerPage + `&page=${page}`;
    if (page) {
      url += `&page=${page}`;
    }
    if (term) {
      url += `&search=${term}`;
    }
    return this.programService.get(url);
  }

  fetchAdvanceSearchObservable({ page }): Observable<any> {

    let filters: any = {};
    if (this.filterpayLoad) {
      filters = {
        filters: {
          title: this.filterpayLoad?.title ?? [],
          basic_title: this.filterpayLoad?.basic_title ?? [],
          hierarchy_ids: this.filterpayLoad?.['hierarchy.name'] ?? [],
          status: this.filterpayLoad?.is_active ?? [],
          rules_names: this.filterpayLoad?.rules_names ?? [],
          date_range: this.filterpayLoad?.updated_at || []
        }
      }
    }

    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url: string = `/timesheet/programs/${programId}/config/rule/advanced-filters?limit=${this.itemsPerPage}&page=${page}`;
    return this.programService.post(url, filters);
  }

  onEditClick = (event: any) => {
    this.router.navigate(['configuration', 'timesheet-rule', 'create'], { queryParams: { id: event?.id, mode: 'edit' } });
  }
  onViewClick = (event: any) => {
            this.router.navigate(['configuration', 'timesheet-rule', 'view'], { queryParams: { id: event?.id, mode: 'view' } });
  }

  onCloneClicked = (event: any) => {
    this.router.navigate(['configuration', 'timesheet-rule', 'create'], { queryParams: { id: event?.id, mode: 'clone' } });
  }

  onDeleteClick = (event: any) => {
    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${currentprogram?.id}/config/basic/${event?.id}`;
    let payload = {};

    this.dialog.confirm(
      "Delete Timesheet",
      "Are you sure, You want to delete this Rule?",
      "Yes", "No")
      .then(res => {
        if (res === false)
          return;

        this.timesheetConfigurationService.delete(url, payload)
          .subscribe({
            next: (data: any) => {
              this.alertService.success('Rule successfully deleted');
              this.masterSub.next({ event, page: 1 });
            }, error: (err: Error | any) => {
              this.alertService.error(errorHandler(err));
            }
          }
        );
      }
    );
  }

  onDisableOrEnableClick = (event: any) => {

    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let payload: any = { status: event.is_active ? 'inactive' : 'active' };
    let url = `/timesheet/programs/${currentprogram?.id}/config/basic/${event?.id}/status`;

    this.dialog.confirm(
      "Update Timesheet Status",
      "Are you sure, you want to update the status?",
      "Yes",
      "No"
    ).then(res => {

      if (res === false)
        return;

      this.timesheetConfigurationService.put(url, payload)
        .subscribe({
          next: (data: any) => {
            this.alertService.success("Record updated successfully");
            this.masterSub.next({ event, page: 1 });
          }, error: (err: Error | any) => {
            this.alertService.error(errorHandler(err));
          }
        }
      );
    });
  }

  //Pagination click functionality
  onPaginationClick = (event: any) => {
    this.masterSub.next({
      ...this.prevMasterConfig,
      page: event,
    });
  }

  // search functionality
  onSearch = (term: string) => {
    if (!term) {
      this.vmsTable.currentPage = 1;
    }
    this.isAdvanceFilter = false;
    this.searchTerm = term;
    this.masterSub.next({ term, page: 1 });
  }

  // advance filter functionality
  onListFilter = (event: any) => {
    if (event) {
      this.isAdvanceFilter = true;
      this.filterpayLoad = event;
      if ('is_active' in event) {
        event['is_active'] = event['is_active'] ? ['active'] : ['inactive'];
      }
    } else {
      this.isAdvanceFilter = false;
      this.filterpayLoad = null;
    }

    this.masterSub.next({ page: 1, term: '' });
  }

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.masterSub.next({ term: this.searchTerm, page: 1 });
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub?.unsubscribe());
  }
}
