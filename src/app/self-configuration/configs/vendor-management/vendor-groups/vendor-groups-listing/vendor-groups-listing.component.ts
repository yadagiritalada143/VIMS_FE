import { Component, OnDestroy, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ProgramSetupService } from 'src/app/program-setup/program-setup.service';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Subscription, Subject, debounceTime, switchMap, Observable } from 'rxjs';
import { ColumnType, FilterType, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig, IActionLinks, IAdvanceFilterConfig } from 'src/app/library/svms-table/svms-table.model';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { Router } from '@angular/router';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-vendor-groups-listing',
  templateUrl: './vendor-groups-listing.component.html',
  styleUrls: ['./vendor-groups-listing.component.scss']
})
export class VendorGroupsListingComponent implements OnInit, OnDestroy {

  private subscriptions: Array<Subscription> = [];
  private searchVendorGroupSub: Subject<any> = new Subject<any>();
  private prevVendorGroupQuery: any = { term: '', page: 1 };

  public vendorGroupList: Array<any> = [];
  public isCreateVendorGroup: ('visible' | 'hidden') = 'hidden';
  public filter: any = null;

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('statusTemplate', { static: true }) statusTemplate: TemplateRef<void>;
  @ViewChild('showData', { static: true }) showData: TemplateRef<void>;

  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;
  tablePaginationConfig: ITablePaginationConfig;
  tableFilterConfig: Array<IAdvanceFilterConfig>;

  initalizeTableConfigs = () => {

    this.tableFilterConfig = [
      {
        name: 'name',
        title: 'Name',
        placeholder: 'Filter by Vendor Group Name',
        type: FilterType.TEXT
      }, {
        name: 'is_enabled',
        title: 'is_enabled',
        placeholder: 'Select Status',
        type: FilterType.SELECT, options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      },
      {
        name: 'modified_on',
        title: 'modified_on',
        placeholder: 'Select Date',
        type: FilterType.DATEPICKER
      }
    ];

    this.tableHeaderConfig = {
      title: 'Vendor Groups',
      searchAllowed: false,
      showAddBtn: this.authService.authorize('vendor_group_manage'),
      onAdd: this.onCreateClick,
      onSearch: this.onSearch,
      advanceFilter: false,
      importData: false,
      exportData: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    let actionLinks: Array<IActionLinks> = [
      { linkName: 'View', method: this.onViewClick, hide: !this.authService.authorize('vendor_group_view') },
      { linkName: 'Edit', method: this.onEditClick, hide: !this.authService.authorize('vendor_group_manage') },
      { linkName: 'Enable/Disable', method: this.onDisableClicked, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('vendor_group_manage') },
      { linkName: 'Delete', method: this.onDeleteClick, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('vendor_group_manage') }
    ];

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onChangeRecords,
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100]
    }

    this.svmstableColomnDefn = [
      { field: 'name', header: 'Name', width: 35, primary: true, order: 1, sortable: true, onClick: this.onViewClick },
      { field: 'description', header: 'Description', templateRef: this.showData, width: 20, order: 3, sortable: true },
      { field: 'modified_on', header: 'Last Updated', type: ColumnType.DATETIME, width: 20, order: 4, sortable: true },
      { field: 'is_enabled', header: 'Status', width: 15, order: 2, templateRef: this.statusTemplate, sortable: false },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      totalRecords: this.totalRecords,
      pagination: true,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Records Found",
      actionLinks: actionLinks,
      enableColumnFilter: true
    };
  };

  constructor(
    public programSetupService: ProgramSetupService,
    public storageService: StorageService,
    private vendorService: VendorService,
    private alertService: AlertService,
    private confirmService: ConfirmationDialogService,
    private loaderService: LoaderService,
    private accessControlService: AccessControlService,
    private router: Router,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {

    this.initalizeTableConfigs();
    this.subscriptions.push(
      this.searchVendorGroupSub.pipe(
        debounceTime(600),
        switchMap((query: any) => {

          this.loaderService.show();
          this.prevVendorGroupQuery = query;
          if (this.vmsTable) {
            this.vmsTable.currentPage = query?.page ?? 1;
          }

          if (this.filter) {
            return this.filterObservable(query);
          }

          return this.searchObservable(query);
        })
      ).subscribe({
        next: (res: any) => {
          if (res) {

            this.loaderService.hide();
            this.totalRecords = res?.total_records;

            if ('program_vendors' in res) {
              res = res.program_vendors;
            }

            if ('vendor_groups' in res) {
              res = res.vendor_groups;
            }

            this.vendorGroupList = res;

          }
        }, error: (err: Error | any) => {
          this.loaderService.hide();
          this.alertService.error('Error encountered while fetching entries!');
          console.error(err);
        }
      })
    );

    this.searchVendorGroupSub.next(this.prevVendorGroupQuery);
  }

  searchObservable({ term, page }): Observable<any> {
    let url = `/configurator/programs/${this.programId}/vendor-groups?limit=${this.itemsPerPage}&page=${page}`;
    return this.programSetupService.get(url);
  }

  filterObservable({ term, page }): Observable<any> {
    let queryFilter = {...this.filter}
    if (queryFilter?.modified_on) {
      queryFilter['date_range'] = queryFilter.modified_on
      delete queryFilter['modified_on']
    }
    let payLoad: any = { filters: queryFilter };
    let url: string = `/configurator/programs/${this.programId}/vendor-groups/advanced-filters?limit=${this.itemsPerPage}&page=${page}`;
    return this.programSetupService.post(url, payLoad);
  }

  onCreateClick = (evt: any) => {
    this.router.navigate([`/self-configuration/vendor/create-vendor-group`]);
  }

  onViewClick = (event: any) => {
    if (event) {
      this.router.navigate([`/self-configuration/vendor/view-vendor-group/${event?.id}`]);
    }
  }

  onEditClick = (event: any) => {
    if(event) {
      this.router.navigate([`/self-configuration/vendor/edit-vendor-group/${event?.id}`]);
    }
  }

  onCloseCreateVendorGroup = (event: any) => {
    this.isCreateVendorGroup = 'hidden';
    this.searchVendorGroupSub.next(this.prevVendorGroupQuery);
  }

  onPaginationClick = (page: number) => {
    this.searchVendorGroupSub.next({ ...this.prevVendorGroupQuery, page });
  }

  onListFilter = (event: any) => {
    if (event) {
      this.filter = event;
    } else {
      this.filter = null;
    }

    this.searchVendorGroupSub.next({
      ...this.prevVendorGroupQuery,
      page: 1
    });
  }

  onDisableClicked = (event: any) => {
    if (event) {

      let url: string = `/configurator/programs/${this.programId}/vendor-groups/${event?.id}`;
      const payLoad = {
        is_enabled: event?.is_enabled ? false : true,
        name: event?.name,
        description: event?.description,
      };

      this.loaderService.show();
      this.vendorService.put(url, payLoad).subscribe({
        next: (data): any => {
          if (data) {
            this.alertService.success('Vendor Group updated successfully');
            this.searchVendorGroupSub.next(this.prevVendorGroupQuery);
            this.loaderService.hide();
          }
        },
        error: (err) => {
          this.alertService.error(errorHandler(err));
          this.loaderService.hide();
        }
      });
    }
  }

  onDeleteClick = (event: any) => {
    if (event) {
      this.confirmService.confirm('', `Are you sure to delete the ${event?.name}?`, 'Yes', 'No')
        .then((confirmed: any) => {
          if (confirmed) {

            let url: string = `/configurator/programs/${this.programId}/vendor-groups/${event?.id}`;
            this.vendorService.delete(url).subscribe({
              next: (data): any => {
                if (data) {
                  this.alertService.success(`You have deleted vendor group successfully.`);
                  this.searchVendorGroupSub.next({ ...this.prevVendorGroupQuery, page: 1 });
                }
              },
              error: (err) => {
                this.alertService.error(errorHandler(err));
              }
            });
          }
        }
      );
    }
  }

  onSearch = (term: any) => {
    this.searchVendorGroupSub.next({ term, page: 1 });
  }

  onChangeRecords = (count: any) => {
    this.itemsPerPage = count;
    this.searchVendorGroupSub.next({
      ...this.prevVendorGroupQuery,
      page: 1
    });
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

  get programId() {
    return this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach((sub: Subscription) => sub?.unsubscribe());
  }
}
