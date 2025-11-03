import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { AuthorizationService } from 'src/app/core/services/authorize.service';


@Component({
  selector: 'app-work-location-list',
  templateUrl: './work-location-list.component.html',
  styleUrls: ['./work-location-list.component.scss']
})
export class WorkLocationListComponent implements OnInit, OnDestroy {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;

  private locationSub: Subject<any> = new Subject<any>();

  @ViewChild('locationStatus', { static: true }) locationStatus: TemplateRef<void>;
  public prevLocationQuery: any = {};
  public sidepanelVisibility: ('visible' | 'hidden') = 'hidden';

  private subscriptions: Array<Subscription> = [];

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
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;
  tablePaginationConfig: ITablePaginationConfig;
  tableFilterConfig: Array<IAdvanceFilterConfig>;

  initalizeTableConfigs = () => {

    this.tableFilterConfig = [
      {
        name: 'name',
        title: 'title',
        placeholder: 'filter_by_name',
        type: FilterType.TEXT
      },
      {
        name: 'code',
        title: 'code',
        placeholder: 'filter_by_code',
        type: FilterType.TEXT
      },
      {
        name: 'zipcode',
        title: 'zipcode',
        placeholder: 'filter_by_zipcode',
        type: FilterType.TEXT
      },
      {
        name: 'modified_on',
        title: 'modified_on',
        placeholder: 'Select Date',
        type: FilterType.DATEPICKER
      },
      {
        name: 'is_enabled',
        title: 'is_enabled',
        placeholder: 'Select Status',
        type: FilterType.SELECT,
        options: [
          { name: 'Active', value: 'true' },
          { name: 'Inactive', value: 'false' }
        ]
      }
    ];

    this.tableHeaderConfig = {
      title: 'work_locations',
      searchAllowed: false,
      showAddBtn: this.authService.authorize('work_location_manage'),
      onAdd: this.onCreateClick,
      advanceFilter: false,
      importData: false,
      exportData: false,
      columnSetting: false,
      reorder: false,
      onReorder: this.onReorderClicked,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    let actionLinks: Array<IActionLinks> = [
      { linkName: 'view', method: this.onClickView, disable: false, hide: !this.authService.authorize('work_location_view') },
      { linkName: 'edit', method: this.onEditClick, hide: !this.authService.authorize('work_location_manage') },
      { linkName: 'enable_disable', method: this.onDisableClicked, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('work_location_manage') }
    ];

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onChangeItemRecords: this.onItemCountChanged
    };

    this.svmstableColomnDefn = [
      { field: 'name', header: 'name', width: 24, primary: true, order: 1, onClick: this.onClickView },
      { field: 'is_enabled', header: 'status', width: 16, templateRef: this.locationStatus, order: 2 },
      { field: 'code', header: 'code', width: 16, order: 3 },
      { field: 'country.name', header: 'country', width: 16, order: 4 },
      { field: 'state_name', header: 'state_province', width: 16, order: 5 },
      { field: 'zipcode', header: 'zip_code', width: 16, order: 6 },
      { field:'modified_on', header: 'last_updated', width: 16, order: 7 , sortable: true, type:ColumnType.DATETIME},
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "no_work_location_data_found_for_the_selected_program",
      actionLinks: actionLinks,
      enableColumnFilter: true,
    };
  };

  constructor(
    private eventStream: EventStreamService,
    private programService: ProgramService,
    private loader: LoaderService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private alert: AlertService,
    private accessControlService: AccessControlService,
    private router: Router,
    private authService: AuthorizationService
  ) {
  }

  ngOnInit(): void {
    this.initalizeTableConfigs();
    this.subscriptions.push(
      this.locationSub.pipe(
        debounceTime(600),
        switchMap((query: any) => {
          this.prevLocationQuery = query;
          if(this.vmsTable) {
            this.vmsTable.currentPage = query?.page ?? 1;
          }

          this.loader.show();
          return this.getLocationURL(query);
        })
      ).subscribe({
        next: (data: any) => {
          if (data) {

            this.vmsData = data;
            const locations: Array<any> = this.vmsData?.work_locations;

            if (Array.isArray(locations)) {
              locations.forEach((entry: any, it: number) => {
                locations[it].zipvalue = locations[it].zipcode;
                if (entry?.zipcode) {
                  locations[it].zipcode = entry.zipcode.toString();
                } else {
                  locations[it].zipcode = '—';
                }
              })
            }

            this.svmsData = data?.work_locations;
            this.itemPerPage = data?.items_per_page;
            this.totalRecords = data?.total_records;
            this.tableOptions.totalRecords = data?.total_records;
            this.loader.hide();
          }
        }, error: (err: Error | any) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      })
    );

    this.subscriptions.push(
      this.route.paramMap
        .subscribe((param: ParamMap) => {
          if (param.get('add')) {
            this.sidepanelVisibility = 'visible';
          }
        })
    );

    this.locationSub.next({ page: 1, term: '' });

  }

  getLocationURL(query: any): Observable<any> {

    const { name, code, zipcode, page, modified_on, status } = query;
    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url: string = `/configurator/programs/${programId}/work-locations?limit=${this.itemPerPage}&page=${(page || 1)}`;

    // Advance search
    if (name || code || zipcode || modified_on ||status) {
      if (name)
        url += `&name=${name}`;
      if (code)
        url += `&code=${code}`;
      if (zipcode)
        url += `&zipcode=${zipcode}`;
      if (modified_on)
        url += `&date_range=${(modified_on || []).join(',')}`;
      if (status)
        url += `&status=${status}`;
    }

    return this.programService.get(url);
  }

  onSearch = (term: string) => {
    this.locationSub.next({ page: 1, search: term });
  }

  onItemCountChanged = (count: number) => {
    this.itemPerPage = count;
    this.tablePaginationConfig.itemsPerPage = count;
    this.locationSub.next({ ...this.prevLocationQuery, page: 1 });
  }


  onPaginationClick = (page: number) => {
    this.locationSub.next({
      ...this.prevLocationQuery,
      page: page
    });
  }

  onListFilter = (event: any) => {
    if (event) {
      this.isAdvanceSearch = true;
      this.filterpayLoad = event;
      this.locationSub.next({
        name: event?.name,
        code: event?.code,
        zipcode: event?.zipcode,
        id: event?.id,
        modified_on: event?.modified_on,
        status: event?.is_enabled,
        page: 1
      });
    } else {
      this.isAdvanceSearch = false;
      this.locationSub.next({ page: 1, search: '' });
    }
  }

  onEditClick = (event) => {
    if (event) {
      this.router.navigate(['/self-configuration/program/work-location/edit'], { queryParams: { id: event.id } });
    }
  }

  sortByRefColumn(vmsData: any) {
    if (vmsData) {
      const fdList: Array<any> = vmsData.work_locations;
      if (Array.isArray(fdList)) {
        fdList.sort((x: any, y: any) => {
          return x.ref_order - y.ref_order;
        });
      }
    }
  }

  onClickView = (evt: any) => {
    if (evt) {
      this.eventStream.emit(new EmitEvent(Events.WORK_LOCATION_VIEW, evt));
      this.storageService.set('WORK_LOCATION_DATA', evt);
      this.router.navigate(['/self-configuration/program/work-location/view'], { queryParams: { id: evt.id } });

    }
  }

  onCreateClick = (event) => {
    if (event) {
      // this.sidepanelVisibility = 'visible';
      this.eventStream.emit(new EmitEvent(Events.WORK_LOCATION_CREATE, true));
      this.router.navigate(['/self-configuration/program/work-location/create']);
    }
  }

  onReorderClicked = () => {
    this.reorderFlyoutVisibility = 'visible';
  }


  closeReorderFlyout() {
    this.reorderFlyoutVisibility = 'hidden';
  }

  onViewClick($event) {
    if ($event) {
      this.sidepanelVisibility = 'visible';
      this.eventStream.emit(new EmitEvent(Events.WORK_LOCATION_VIEW, {
        event: true,
        data: $event,
      }));
    }
  }

  validatorActionLinksFn = (actionLinks: Array<IActionLinks>, rowData: any) => {
    if (actionLinks && actionLinks.length > 0) {
      actionLinks[0].hide = !actionLinks[0].hide;
    }
  }


  onDisableClicked = (event) => {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.WORK_LOCATION_DISABLE, event));
    }
  }

  refreshListing() {
    this.locationSub.next(this.prevLocationQuery);
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
