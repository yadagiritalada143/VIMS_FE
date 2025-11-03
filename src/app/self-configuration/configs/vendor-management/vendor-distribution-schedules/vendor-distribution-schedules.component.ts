import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { debounceTime, Observable, Subject, Subscription, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-vendor-distribution-schedules',
  templateUrl: './vendor-distribution-schedules.component.html',
  styleUrls: ['./vendor-distribution-schedules.component.scss']
})
export class VendorDistributionSchedulesComponent implements OnInit, OnDestroy {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('status', {static: true}) statusTemplate: TemplateRef <any>;

  public sidepanelVisibility: ('visible' | 'hidden') = 'hidden';
  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];

  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;

  private programId: string = null;
  private subscriptions: Array<Subscription> = [];
  private scheduleSubject: Subject<any> = new Subject<any>();
  private prevScheduleConfig: any = {term: '', page: 1};
  private filterPayload: any = null;

  constructor(
    private alert: AlertService,
    private loader: LoaderService,
    private storage: StorageService,
    private programService: ProgramService,
    private eventStream: EventStreamService,
    private confirmService: ConfirmationDialogService,
    private accessControlService: AccessControlService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {

    // Initialization
    this.initTableConfig();
    this.initScheduleSub();

    this.programId = this.storage.get(StorageKeys.PROGRAM_ID);
    this.scheduleSubject.next(this.prevScheduleConfig);
  }

  initTableConfig = () => {

    this.tableFilterConfig = [
      {
        name: 'name',
        title: 'name',
        placeholder: 'Filter Schedule',
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
      },
      {
        name: 'modified_on',
        title: 'modified_on',
        placeholder: 'Select Date',
        type: FilterType.DATEPICKER
      }
    ];

    this.tableHeaderConfig = {
      title: 'Vendor Distribution Schedules',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('vendor_distribution_schedule_manage'),
      advanceFilter: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdd: this.onAddClicked,
      onSearch: this.onSearch,
      onAdvanceFilter: this.onAdvanceFilter,
      createButtonTitle: 'Create New'
    };

    // Action Links
    let actionLinks: Array <IActionLinks> = [{
      linkName: 'View', method: this.onViewClicked, linkIcon: 'visibility', hide: !this.authService.authorize('vendor_distribution_schedule_view')
    }, {
      linkName: 'Edit', method: this.onEditClicked, linkIcon: 'edit', hide: !this.authService.authorize('vendor_distribution_schedule_manage')
    }, {
      linkName: 'Enable/Disable', method: this.onDisableClicked, linkIcon: 'label_off', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('vendor_distribution_schedule_manage')
    }, {
      linkName: 'Delete', method: this.onDeleteClicked, linkIcon: 'delete', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('vendor_distribution_schedule_manage')
    }];

    this.tablePaginationConfig = {
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged
    };

    this.tableColumnConfig = [
      { field: 'name', header: 'Name', width: 12, primary: true, order: 1, sortable: true, onClick: this.onViewClicked },
      { field: 'description_view', header: 'Description', width: 24, order: 3, sortable: false },
      { field: 'modified_on', header: 'Last Updated', width: 12, order: 4, sortable: true, type: ColumnType.DATETIME },
      { field: 'is_enabled', header: 'Status', width: 12, order: 2, sortable: true, templateRef: this.statusTemplate }
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Program Found",
      enableColumnFilter: true,
      actionLinks
    };
  };

  initScheduleSub() {
    this.subscriptions.push(
      this.scheduleSubject.pipe(
        debounceTime(400),
        switchMap((query: any) => {

            const term: string = query?.term;
            const page: number = query?.page;
            this.prevScheduleConfig = { term, page };
            if(this.vmsTable?.currentPage) {
              this.vmsTable.currentPage = page ?? 1;
            };

            this.loader.show();
            if(this.filterPayload) {
              return this.fetchSearchObservable(page);
            }

            return this.fetchScheduleObservable(page);
          })
      ).subscribe({
        next: (data: any) => {
          if(data) {
            this.loader.hide();
            this.totalRecords = data?.total_records;
            data?.distribution_schedules?.forEach((entry: any) => {
              entry['description_view'] = entry['description'] || '--';
            });

            this.vmsData = data?.distribution_schedules;
          }
        }, error: (err: any) => {
          console.error(err);
          this.loader.hide();
          this.alert.error('Error encountered while fetching entries!');
        }
      })
    );
  }

  fetchScheduleObservable(page: number = 1): Observable <any> {
    const url: string = `/configurator/programs/${this.programId}/vendors/distribution-schedules?limit=${this.itemsPerPage}&page=${page}`;
    return this.programService.get(url);
  }

  fetchSearchObservable(page: number = 1): Observable <any> {
    const url: string = `/configurator/programs/${this.programId}/vendors/distribution-schedules/advanced-filters`;
    let payload: any = {
      "filters": this.filterPayload,
      "pagination": {
        limit: this.itemsPerPage,
        page: page
      }
    }

    return this.programService.post(url, payload);
  }

  onCloseCreateVendorDistribution(evt: any = null) {
    this.sidepanelVisibility = 'hidden';
    this.scheduleSubject.next({ ...this.prevScheduleConfig, page: 1 });
  }

  onPaginationClick = (page: number) => {
    this.scheduleSubject.next({ ...this.prevScheduleConfig, page });
  }

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.scheduleSubject.next({ ...this.prevScheduleConfig, page: 1 });
  }

  onSearch = (term: string) => {
    if(term) {
      this.filterPayload = {
        name: term
      };
    } else {
      this.filterPayload = null;
    }

    this.scheduleSubject.next({ term, page: 1 });
  }

  onAdvanceFilter = (data: any) => {
    if(!!data) {
      this.filterPayload = {};
      if(data?.name)
        this.filterPayload['name'] = data?.name;
      if(typeof(data?.is_enabled) === 'boolean')
        this.filterPayload['is_enabled'] = data?.is_enabled;
      if(data?.modified_on)
        this.filterPayload['date_range'] = data?.modified_on;
    } else {
      this.filterPayload = null;
    }

    this.scheduleSubject.next({term: '', page: 1});
  }

  onAddClicked = (evt: any = null) => {
    this.sidepanelVisibility = 'visible';
  }

  onViewClicked = (evt: any = null) => {
    if(evt?.id) {
      let obj = { "event": true, "data": evt };
      this.sidepanelVisibility = 'visible';
      this.eventStream.emit(new EmitEvent(Events.VENDOR_VIEW_SCHEDULE, obj));
    }
  }

  onEditClicked = (evt: any = null) => {
    if(evt?.id) {
      let obj = { "event": true, "data": evt };
      this.sidepanelVisibility = 'visible';
      this.eventStream.emit(new EmitEvent(Events.EDIT_VENDOR_SCHEDULE, obj));
    }
  }

  onDisableClicked = (evt: any = null) => {
    if (evt?.id) {

      const url: string = `/configurator/programs/${this.programId}/vendors/distribution-schedules/${evt?.id}`;
      const payload = {
        is_enabled: evt?.is_enabled ? false : true,
      };

      this.loader.show();
      this.programService.put(url, payload)
        .subscribe({
          next: (data: any) => {
            if (data) {
              if(payload?.is_enabled){
              this.alert.success('Vendor distribution schedule enabled successfully');
              }else {
              this.alert.success('Vendor distribution schedule disabled successfully');
              }
              this.scheduleSubject.next(this.prevScheduleConfig);
              this.loader.hide();
            }
          }, error: (err: any) => {
            this.alert.error(errorHandler(err));
            this.loader.hide();
          }
        }
      );
    }
  }

  onDeleteClicked = (evt: any = null) => {
    if (evt?.id) {
      this.confirmService.confirm('', `Are you sure to delete entry: ${evt?.name ?? ''}?`, 'Yes', 'No')
        .then((confirmed: boolean) => {
          if (confirmed) {

            this.loader.show();
            let url: string = `/configurator/programs/${this.programId}/vendors/distribution-schedules/${evt?.id}`;
            this.programService.delete(url)
              .subscribe({
                next: (data: any) => {
                  if (data) {
                    this.loader.hide();
                    this.alert.success(`Vendor schedule deleted successfully`);
                    this.scheduleSubject.next({ ...this.prevScheduleConfig, page: 1 });
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
