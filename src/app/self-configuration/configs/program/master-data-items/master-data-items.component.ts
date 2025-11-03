import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
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
  selector: 'app-master-data-items',
  templateUrl: './master-data-items.component.html',
  styleUrls: ['./master-data-items.component.scss']
})
export class MasterDataItemsComponent implements OnInit, OnDestroy {

  private itemId: string = null;
  private programId: string = null;
  private name: string = '--';

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('status', {static: true}) statusTemplate: TemplateRef <any>;

  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];

  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;
  public masterDataDetails: any = null;

  private subscriptions: Array<Subscription> = [];
  private itemSubject: Subject<any> = new Subject<any>();
  private prevItemConfig: any = {term: '', page: 1};
  private filterPayload: any = null;

  constructor(
    private storageService: StorageService,
    private route: ActivatedRoute,
    private loader: LoaderService,
    private alert: AlertService,
    private programService: ProgramService,
    private eventStream: EventStreamService,
    private confirmService: ConfirmationDialogService,
    private accessControlService: AccessControlService,
    private svmsRouter: SvmsRouterService,
    private authService: AuthorizationService,
  ) { }

  ngOnInit(): void {

    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.route.params.subscribe((param: Params) => {
    
      this.itemId = param?.id;

      // Initialization
      this.initTableConfig();
      this.initMasterItemSubs();
      this.fetchMasterDataDetails();
      this.itemSubject.next(this.prevItemConfig);
    });
  }

  initTableConfig = () => {

    this.tableFilterConfig = [{
      name: 'name',
      title: 'name',
      placeholder: 'Search Master Data Name',
      type: FilterType.TEXT
    }, {
      name: 'is_enabled',
      title: 'is_enabled',
      placeholder: 'Select Status',
      type: FilterType.SELECT,
      options: [
        { name: 'Active', value: true },
        { name: 'Inactive', value: false }
      ]
    }, {
      name: 'modified_on',
      title: 'modified_on',
      placeholder: 'Select Date Range',
      type: FilterType.DATEPICKER
    }, {
      name: 'code',
      title: 'code',
      placeholder: 'Search Code',
      type: FilterType.TEXT
    }, {
      name: 'managers_list',
      title: 'managers_list',
      placeholder: 'Search Manager',
      type: FilterType.TEXT
    }
    ];

    this.tableHeaderConfig = {
      title: this.name,
      showAddBtn: this.authService.authorize('master_data_manage'),
      advanceFilterConfig: this.tableFilterConfig,
      onAdd: this.onAddClicked,
      onSearch: this.onSearch,
      onAdvanceFilter: this.onFilter,
      createButtonTitle: 'Add Data',
      showBackArrow: true,
      onBackArrowClick: this.onBackClicked
    };

    // Action Links
    let actionLinks: Array <IActionLinks> = [
      { linkName: 'View', method: this.onViewClicked, linkIcon: 'visibility', hide: !this.authService.authorize('master_data_view') },
      { linkName: 'Edit', method: this.onEditClicked, linkIcon: 'edit', hide: !this.authService.authorize('master_data_manage') },
      { linkName: 'Enable/Disable', method: this.onDisableClicked, linkIcon: 'label_off', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('master_data_manage') },
      { linkName: 'Delete', method: this.onDeleteClicked, linkIcon: 'delete', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('master_data_manage') }
    ];

    this.tablePaginationConfig = {
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged
    };

    this.tableColumnConfig = [
      { field: 'name', header: 'Name', width: 6, primary: true, order: 1, sortable: true, onClick: this.onViewClicked },
      { field: 'is_enabled', header: 'Status', width: 6, order: 2, sortable: true, templateRef: this.statusTemplate },
      { field: 'code', header: 'Code', width: 6, order: 3, sortable: true },
      { field: 'managers_list', header: 'Owner', width: 6, order: 4, sortable: true },
      { field: 'modified_on', header: 'Last Updated', width: 6, order: 5, sortable: true, type: ColumnType.DATETIME },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Master Data Found",
      enableColumnFilter: true,
      actionLinks
    };
  };

  initMasterItemSubs = () => {

    // Listing
    this.subscriptions.push(
      this.itemSubject
        .pipe(
          debounceTime(400),
          switchMap((query: any) => {

            const term: string = query?.term;
            const page: number = query?.page;
            this.prevItemConfig = { term, page };
            if(this.vmsTable?.currentPage) {
              this.vmsTable.currentPage = page ?? 1;
            };

            this.loader.show();
            if(this.filterPayload) {
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
              this.vmsData = data?.foundational_data?.map((entry: any) => {
                return {
                  ...entry,
                managers_list: ((entry['manager']?.length) ? `${entry['manager'][0].first_name}` + ` ${entry['manager'][0].last_name}` : '--')
                }
              }) || [];
            }
          }, error: (err: any) => {
            this.loader.hide();
            console.error(err);
            this.alert.error('Error encountered while fetching entries!');
          }
        })
    );

    // Refresh
    this.subscriptions.push(
      this.eventStream.on(Events.FOUNDATION_DATA_LIST)
        .subscribe((data: any) => {
          if (data) {
            this.itemSubject.next(this.prevItemConfig);
          }
        }
      )
    );
  };

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

  onAddClicked = (evt: any) => {
    if(evt) {
      this.svmsRouter.navigate(['program', 'master-data-type', 'list-foundational-data', this.itemId, 'create'], {
        queryParams: {
          name: this.masterDataDetails?.name
        }
      });
    }
  }

  onViewClicked = (evt: any) => {
    if(evt?.id) {
      this.svmsRouter.navigate(['program', 'master-data-type', 'list-foundational-data', this.itemId, 'view', evt?.id], {
        queryParams: {
          name: this.masterDataDetails?.name
        }
      });
    }
  }

  onEditClicked = (evt: any) => {
    if(evt?.id) {
      this.svmsRouter.navigate(['program', 'master-data-type', 'list-foundational-data', this.itemId, 'edit', evt?.id], {
        queryParams: {
          name: this.masterDataDetails?.name
        }
      });
    }
  }

  onDisableClicked = (evt: any) => {
    if (evt?.id) {

      let action: string = (evt?.is_enabled) ? 'disable' : 'enable';
      let title: string = `Are you sure to ${action} ${evt?.name || 'this entry'}?`;
      this.confirmService.confirm('', title, 'Yes', 'No')
        .then((confirmed: boolean) => {
          if (confirmed) {

            const url: string = `/configurator/programs/${this.programId}/foundational-data-types/${this.itemId}/foundational-data/${evt?.id}`;
            const payload = {
              is_enabled: !evt?.is_enabled
            };

            this.loader.show();
            this.programService.put(url, payload)
              .subscribe({
                next: (data: any) => {
                  if (data) {
                    this.loader.hide();
                    this.alert.success(`Master data item updated successfully`);
                    this.itemSubject.next(this.prevItemConfig);
                  }
                }, error: (err: any) => {
                  this.loader.hide();
                  this.alert.error(errorHandler(err));
                }
              }
            );
          }
        }
      );
    }
  }

  onDeleteClicked = (evt: any) => {
    if (evt?.id) {

      let title: string = `Are you sure to delete ${evt?.name || 'this item'}?`;
      this.confirmService.confirm('', title, 'Yes', 'No')
        .then((confirmed: boolean) => {
          if (confirmed) {

            this.loader.show();
            const url: string = `/configurator/programs/${this.programId}/foundational-data-types/${this.itemId}/foundational-data/${evt?.id}`;
            this.programService.delete(url).subscribe({
              next: (data: any) => {
                if (data) {
                  this.loader.hide();
                  this.alert.success(`Master data item removed successfully.`);
                  this.itemSubject.next({ ...this.prevItemConfig, page: 1 });
                }
              }, error: (err: any) => {
                this.loader.hide();
                this.alert.error(errorHandler(err));
              }
            });
          }
        }
      );
    }
  }

  onPaginationClick = (page: number) => {
    this.itemSubject.next({ ...this.prevItemConfig, page });
  }

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.itemSubject.next({ ...this.prevItemConfig, page: 1 });
  }

  onSearch = (term: string) => {
    this.itemSubject.next({ term, page: 1 });
  }

  onFilter = (evt: any) => {
    if (!!evt) {
      this.filterPayload = {};
      if (evt?.name) {
        this.filterPayload['name'] = evt?.name;
      }
      if (typeof (evt?.is_enabled) === 'boolean') {
        this.filterPayload['is_enabled'] = evt?.is_enabled;
      }
      if (evt?.modified_on) {
        this.filterPayload['date_range'] = evt?.modified_on;
      }
      if(evt?.code) {
        this.filterPayload['code'] = evt?.code;
      }
      if(evt?.managers_list) {
        this.filterPayload['manager'] = evt?.managers_list;
      }
    } else {
      this.filterPayload = null;
    }

    this.itemSubject.next({ ...this.prevItemConfig, page: 1 });
  }

  fetchListingObservable(term: string = '', page: number = 1): Observable <any> {
    let url: string = `/configurator/programs/${this.programId}/foundational-data-types/${this.itemId}/foundational-data?limit=${this.itemsPerPage}&page=${page}`;
    if(term) {
      url += `&k=${term}`;
    }

    return this.programService.get(url);
  }

  fetchAdvanceFilterObservable(page: number = 1): Observable <any> {

    let url: string = `/configurator/programs/${this.programId}/foundational-data-types/${this.itemId}/foundational-data/advanced-filters?limit=${this.itemsPerPage}&page=${page}`;
    let payload: any = {
      pagination: {
        limit: this.itemsPerPage,
        page
      },
      filters: this.filterPayload
    };

    return this.programService.post(url, payload);
  }

  fetchMasterDataDetails() {
    const url: string = `/configurator/programs/${this.programId}/foundational-data-types/${this.itemId}`;
    this.programService.get(url).subscribe({
      next: (res: any) => {
        if (res) {
          if (res?.foundational_data_type)
            this.masterDataDetails = res.foundational_data_type;
          else
            this.masterDataDetails = res;

          this.name = this.masterDataDetails?.name;
          this.tableHeaderConfig.title = this.name;
        }
      }, error: (err: any) => {
        this.alert.error(errorHandler(err));
      }
    });
  }

  onBackClicked = () => {
    this.svmsRouter.navigate(['program', 'master-data-type', 'list']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
